"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconId,
    IconPrinter,
    IconDownload,
    IconChevronLeft,
    IconChevronRight,
    IconSearch,
    IconFileText,
    IconFileCheck,
    IconLoader
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DateRange } from "react-day-picker"
import { NativeSelect } from "@/components/ui/native-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { cn } from "@/lib/utils"
import { isSameMonth, isSameYear } from "date-fns"
import { jobCardService, type JobCardResponse } from "@/lib/services/jobcard"
import { organogramService } from "@/lib/services/organogram"
import { employeeService } from "@/lib/services/employee"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { AdvancedFilter } from "@/components/attendance/advanced-filter"
import { type CommonFilterParams } from "@/lib/services/attendance"

export default function JobCardPage() {
    const [empId, setEmpId] = React.useState("")
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            startDate: format(start, "yyyy-MM-dd"),
            endDate: format(end, "yyyy-MM-dd")
        };
    })

    const [showReport, setShowReport] = React.useState(false)
    const [jobCardData, setJobCardData] = React.useState<JobCardResponse | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)

    const [departments, setDepartments] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [sections, setSections] = React.useState<any[]>([])
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [employees, setEmployees] = React.useState<any[]>([])
    const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null)

    // Fetch filter options
    React.useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [depts, desigs, sects] = await Promise.all([
                    organogramService.getDepartments(),
                    organogramService.getDesignations(),
                    organogramService.getSections()
                ])
                setDepartments(depts)
                setDesignations(desigs)
                setSections(sects)
            } catch (error) {
                console.error("Failed to fetch filters", error)
            }
        }
        fetchFilters()
    }, [])

    // Fetch employees based on filters
    React.useEffect(() => {
        const fetchEmployeesList = async () => {
            try {
                const params: any = {}
                if (fullFilters.companyId) params.companyId = fullFilters.companyId
                if (fullFilters.departmentId) params.departmentId = fullFilters.departmentId
                if (fullFilters.designationId) params.designationId = fullFilters.designationId
                if (fullFilters.sectionId) params.sectionId = fullFilters.sectionId
                if (fullFilters.shiftId) params.shiftId = fullFilters.shiftId
                if (fullFilters.groupId) params.groupId = fullFilters.groupId
                if (fullFilters.floorId) params.floorId = fullFilters.floorId
                if (fullFilters.searchTerm) params.searchTerm = fullFilters.searchTerm

                const emps = await employeeService.getEmployees(params)
                setEmployees(emps)
                setCurrentIndex(0) // Reset index when filters change
            } catch (error) {
                console.error("Failed to fetch employees", error)
            }
        }
        fetchEmployeesList()
    }, [fullFilters.companyId, fullFilters.departmentId, fullFilters.designationId, fullFilters.sectionId, fullFilters.shiftId, fullFilters.groupId, fullFilters.floorId, fullFilters.searchTerm])

    const handleGenerate = async (filters: CommonFilterParams = fullFilters) => {
        const currentEmpId = filters.searchTerm;
        
        if (!filters.startDate || !filters.endDate) {
            toast.error("Please select a date range")
            return
        }

        setIsLoading(true)
        try {
            // Fetch employees list to support navigation
            const params = {
                ...filters,
                searchTerm: currentEmpId
            };
            const emps = await employeeService.getEmployees(params);
            setEmployees(emps);
            
            if (emps.length === 0) {
                toast.error("No employees found with the selected filters.");
                setJobCardData(null);
                setShowReport(false);
                return;
            }

            // If we have employees, show the first one (or the one matching searchTerm)
            let indexToSelect = 0;
            if (currentEmpId) {
                const foundIndex = emps.findIndex(e => e.employeeId === currentEmpId);
                if (foundIndex !== -1) indexToSelect = foundIndex;
            }

            setCurrentIndex(indexToSelect);
            await fetchJobCard(emps[indexToSelect].id, filters);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to find employees")
        } finally {
            setIsLoading(false)
        }
    }

    const handleNext = async () => {
        if (currentIndex < employees.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            await fetchJobCard(employees[nextIndex].id, fullFilters);
        }
    }

    const handlePrevious = async () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            await fetchJobCard(employees[prevIndex].id, fullFilters);
        }
    }

    const fetchJobCard = async (employeeId: number, filters: CommonFilterParams) => {
        try {
            setIsLoading(true)
            const data = await jobCardService.getJobCard({
                employeeCard: employeeId,
                startDate: filters.startDate!,
                endDate: filters.endDate!
            })

            setJobCardData(data)
            setShowReport(true)
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to generate job card")
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportExcel = async () => {
        if (!fullFilters.startDate || !fullFilters.endDate) return;
        try {
            // Use current state for single or group export
            const exportParams = {
                ...fullFilters,
                employeeCard: employees[currentIndex]?.id
            };
            await jobCardService.exportJobCardExcel(exportParams);
            toast.success("Excel exported successfully");
        } catch (error) {
            toast.error("Excel export failed");
        }
    }

    const handleExportPdf = async () => {
        if (!fullFilters.startDate || !fullFilters.endDate) return;
        try {
            // Use current state for single or group export
            const exportParams = {
                ...fullFilters,
                employeeCard: employees[currentIndex]?.id
            };
            await jobCardService.exportJobCardPdf(exportParams);
            toast.success("PDF exported successfully");
        } catch (error) {
            toast.error("PDF export failed");
        }
    }

    const handleExportBulk = async (format: "excel" | "pdf") => {
        if (!fullFilters.startDate || !fullFilters.endDate) return;
        try {
            // Remove specific employeeCard and searchTerm to trigger bulk export for the entire group
            const { employeeCard, searchTerm, ...bulkParams } = fullFilters;
            if (format === "excel") {
                await jobCardService.exportJobCardExcel(bulkParams);
            } else {
                await jobCardService.exportJobCardPdf(bulkParams);
            }
            toast.success(`Bulk ${format.toUpperCase()} export started`);
        } catch (error) {
            toast.error(`Bulk ${format} export failed`);
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Job Card</h1>
                    <p className="text-muted-foreground text-sm">Employee Monthly Audit Report</p>
                </div>
                <div className="flex items-center gap-2">
                    {showReport && (
                        <>
                            <div className="flex items-center bg-muted rounded-md p-1 gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleExportExcel}>
                                    <IconDownload className="mr-1 size-3 text-emerald-600" />
                                    Excel
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleExportPdf}>
                                    <IconDownload className="mr-1 size-3 text-blue-600" />
                                    PDF
                                </Button>
                                <div className="w-[1px] h-4 bg-border mx-1" />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs font-semibold text-primary"
                                    onClick={() => handleExportBulk("pdf")}
                                    disabled={employees.length <= 1}
                                >
                                    <IconFileText className="mr-1 size-3" />
                                    Bulk PDF
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs font-semibold text-primary"
                                    onClick={() => handleExportBulk("excel")}
                                    disabled={employees.length <= 1}
                                >
                                    <IconFileCheck className="mr-1 size-3" />
                                    Bulk Excel
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => window.print()}>
                                <IconPrinter className="mr-2 size-4" />
                                Print
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <main className="px-6 space-y-6">
                {/* Generation Filter */}
                <div className="px-0">
                    <AdvancedFilter
                        showDate={false}
                        showDateRange={true}
                        onFilterChange={(newFilters) => {
                            setFullFilters(newFilters)
                            handleGenerate(newFilters)
                        }}
                        initialFilters={fullFilters}
                        isLoading={isLoading}
                    />
                </div>

                {/* Bulk Navigation */}
                {employees.length > 1 && showReport && (
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-dashed animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Navigation</span>
                                <span className="text-sm font-semibold">Bulk Job Card View</span>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handlePrevious} 
                                    disabled={currentIndex === 0 || isLoading}
                                    className="h-8"
                                >
                                    Previous
                                </Button>
                                <div className="bg-background px-3 py-1 rounded-md border text-xs font-bold min-w-[80px] text-center shadow-sm">
                                    {currentIndex + 1} / {employees.length}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleNext} 
                                    disabled={currentIndex === employees.length - 1 || isLoading}
                                    className="h-8"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current Employee</span>
                            <span className="text-sm font-medium text-primary">
                                {employees[currentIndex]?.fullNameEn} ({employees[currentIndex]?.employeeId})
                            </span>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="size-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <IconLoader className="size-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <h3 className="text-xl font-bold tracking-tight">Generating Job Card...</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                We're meticulously analyzing attendance logs and calculating overtime. This might take a moment.
                            </p>
                        </div>
                    </div>
                )}

                {!isLoading && !showReport && (
                    <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed">
                        <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                            <IconId className="size-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold">No Report Generated</h3>
                        <p className="text-xs text-muted-foreground mt-1">Select filters above to generate report</p>
                    </div>
                )}

                {!isLoading && showReport && jobCardData && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Report Content - Job Card */}
                        <Card className="print-report">
                            {/* Header */}
                            <div className="p-6 border-b">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold">Monthly Job Card</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {fullFilters.startDate && fullFilters.endDate && (
                                                format(new Date(fullFilters.startDate), "MMMM yyyy") === format(new Date(fullFilters.endDate), "MMMM yyyy") ? (
                                                    format(new Date(fullFilters.startDate), "MMMM yyyy")
                                                ) : (
                                                    `${format(new Date(fullFilters.startDate), "MMM dd, yy")} - ${format(new Date(fullFilters.endDate), "MMM dd, yy")}`
                                                )
                                            )}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Finalized</Badge>
                                </div>

                                {/* Employee Info */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 pt-4 border-t">
                                    <InfoItem label="Name" value={jobCardData.employee.employeeName} />
                                    <InfoItem label="ID" value={jobCardData.employee.employeeId} />
                                    <InfoItem label="Department" value={jobCardData.employee.department} />
                                    <InfoItem label="Designation" value={jobCardData.employee.designation} />
                                    <InfoItem label="Section" value={jobCardData.employee.section} />
                                    <InfoItem label="Joining Date" value={jobCardData.employee.joiningDate || "N/A"} />
                                    <InfoItem label="Grade" value={jobCardData.employee.grade || "N/A"} />
                                    <InfoItem label="Shift" value={jobCardData.employee.shift || "N/A"} />
                                </div>
                            </div>

                            <CardContent className="p-6">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                                    <StatCard label="Present" value={jobCardData.summary.presentDays} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
                                    <StatCard label="Absent" value={jobCardData.summary.absentDays} color="bg-rose-50 text-rose-700 border-rose-100" />
                                    <StatCard label="Weekend" value={jobCardData.summary.weekendDays} color="bg-slate-50 text-slate-700 border-slate-100" />
                                    <StatCard label="Holiday" value={jobCardData.summary.holidayDays} color="bg-blue-50 text-blue-700 border-blue-100" />
                                    <StatCard label="Total OT" value={`${jobCardData.summary.totalOTHours}h`} color="bg-amber-50 text-amber-700 border-amber-100" />
                                    <StatCard label="Late" value={`${jobCardData.summary.totalLateMinutes}m`} color="bg-orange-50 text-orange-700 border-orange-100" />
                                </div>

                                {/* Attendance Table */}
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr className="border-b">
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Day</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shift</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">In</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Out</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Late</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">OT</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Total</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobCardData.attendanceRecords.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    className={cn(
                                                        "border-b last:border-0 hover:bg-muted/50 transition-colors",
                                                        row.isOffDay && "bg-slate-100/80 font-medium",
                                                        row.status === "Absent" && !row.isOffDay && "bg-rose-50/30",
                                                        row.status === "Holiday" && !row.isOffDay && "bg-blue-50/30"
                                                    )}
                                                >
                                                    <td className="px-4 py-2.5 font-medium">{row.date}</td>
                                                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.day}</td>
                                                    <td className="px-4 py-2.5 text-xs font-semibold">{row.shift || "-"}</td>
                                                    <td className="px-4 py-2.5 text-center font-mono text-xs">{row.inTime}</td>
                                                    <td className="px-4 py-2.5 text-center font-mono text-xs">{row.outTime}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        {row.lateMinutes > 0 ? (
                                                            <span className="text-xs font-semibold text-rose-600">{row.lateMinutes}m</span>
                                                        ) : <span className="text-muted-foreground">-</span>}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        {row.otHours > 0 ? (
                                                            <span className="text-xs font-semibold text-emerald-600">+{row.otHours}h</span>
                                                        ) : <span className="text-muted-foreground">-</span>}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-semibold text-xs">{row.totalHours > 0 ? `${row.totalHours}h` : "-"}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "font-normal text-xs",
                                                                row.status === "Present" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                                row.status === "Absent" && "bg-rose-50 text-rose-700 border-rose-200",
                                                                row.status === "Weekend" && "bg-slate-100 text-slate-700 border-slate-200",
                                                                row.status === "Holiday" && "bg-blue-50 text-blue-700 border-blue-200"
                                                            )}
                                                        >
                                                            {row.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.remarks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>

                            {/* Signature Section */}
                            <div className="p-6 border-t mt-6">
                                <div className="grid grid-cols-3 gap-12 pt-16">
                                    <div className="text-center border-t border-slate-300 pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground">Employee Signature</p>
                                    </div>
                                    <div className="text-center border-t border-slate-300 pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground">Department Head</p>
                                    </div>
                                    <div className="text-center border-t border-slate-300 pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground">HR Authority</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </main>

            {/* Print Friendly Styles */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-report, .print-report * { visibility: visible; }
                    .print-report { position: absolute; left: 0; top: 0; width: 100%; border: none; shadow: none; }
                    header, button, nav, aside { display: none !important; }
                }
            `}</style>
        </div>
    )
}

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
        </div>
    )
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
    return (
        <div className={cn("p-4 rounded-lg border", color)}>
            <p className="text-xs opacity-80 mb-1">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    )
}
