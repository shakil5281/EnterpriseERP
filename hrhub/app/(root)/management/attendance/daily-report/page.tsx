"use client"

import * as React from "react"
import {
    IconFingerprint,
    IconSearch,
    IconDownload,
    IconUserCheck,
    IconUserX,
    IconClock,
    IconDatabaseImport,
    IconChevronDown,
    IconFileTypePdf,
    IconUsers,
    IconInfoCircle,
    IconLoader2
} from "@tabler/icons-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { attendanceService, type AttendanceRecord, type AttendanceSummary } from "@/lib/services/attendance"
import { organogramService } from "@/lib/services/organogram"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { AdvancedFilter } from "@/components/attendance/advanced-filter"
import { CommonFilterParams } from "@/lib/services/attendance"

export default function DailyAttendanceReportPage() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [records, setRecords] = React.useState<AttendanceRecord[]>([])
    const [summary, setSummary] = React.useState<AttendanceSummary | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [departments, setDepartments] = React.useState<any[]>([])

    // Filters
    const [deptFilter, setDeptFilter] = React.useState("all")
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [search, setSearch] = React.useState("")
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>({
        date: date ? format(date, "yyyy-MM-dd") : undefined,
        status: "all"
    })
    const [isExportingPdf, setIsExportingPdf] = React.useState(false)
    const [isExportingExcel, setIsExportingExcel] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [reportData, summaryData] = await Promise.all([
                attendanceService.getDailyReport(fullFilters),
                attendanceService.getSummary(fullFilters)
            ])
            setRecords(reportData)
            setSummary(summaryData)
        } catch (error) {
            toast.error("Failed to fetch attendance data")
        } finally {
            setIsLoading(false)
        }
    }, [fullFilters])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    React.useEffect(() => {
        organogramService.getDepartments().then(setDepartments)
    }, [])

    const handleSeedMock = async () => {
        if (!date) return
        try {
            const formattedDate = format(date, "yyyy-MM-dd")
            await attendanceService.seedMock(formattedDate)
            toast.success("Mock data seeded successfully")
            fetchData()
        } catch (error) {
            toast.error("Failed to seed mock data")
        }
    }

    const handleExportExcel = async () => {
        setIsExportingExcel(true)
        try {
            await attendanceService.exportDailyReportExcel(fullFilters)
            toast.success("Excel report exported successfully")
        } catch (error) {
            toast.error("Failed to export Excel report")
        } finally {
            setIsExportingExcel(false)
        }
    }

    const handleExportPdf = async () => {
        setIsExportingPdf(true)
        try {
            await attendanceService.exportDailyReportPdf(fullFilters)
            toast.success("PDF report exported successfully")
        } catch (error) {
            toast.error("Failed to export PDF report")
        } finally {
            setIsExportingPdf(false)
        }
    }

    const columns: ColumnDef<AttendanceRecord>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs font-medium text-muted-foreground">{(row.index + 1).toString().padStart(2, '0')}</span>,
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "employeeId",
            header: "Employee ID",
            cell: ({ row }) => <span className="font-bold text-xs tabular-nums text-foreground">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => <span className="font-medium text-sm text-foreground">{row.original.employeeName}</span>
        },
        {
            accessorKey: "designation",
            header: "Designation",
            cell: ({ row }) => <span className="text-xs font-medium text-muted-foreground">{row.original.designation}</span>
        },
        {
            accessorKey: "section",
            header: "Section",
            cell: ({ row }) => <span className="text-xs font-medium text-muted-foreground">{row.original.section}</span>
        },
        {
            accessorKey: "shift",
            header: "Shift",
            cell: ({ row }) => <Badge variant="outline" className="font-bold text-[10px] uppercase py-0">{row.original.shift}</Badge>
        },
        {
            accessorKey: "inTime",
            header: "Check-In",
            cell: ({ row }) => {
                const val = row.original.inTime
                if (!val) return <span className="text-xs font-bold text-muted-foreground opacity-50">--:--</span>
                try {
                    return <span className="text-xs font-bold tabular-nums">{format(new Date(val), "hh:mm aa")}</span>
                } catch (e) {
                    return <span className="text-xs font-bold tabular-nums">{val}</span>
                }
            }
        },
        {
            accessorKey: "outTime",
            header: "Check-Out",
            cell: ({ row }) => {
                const val = row.original.outTime
                if (!val) return <span className="text-xs font-bold text-muted-foreground opacity-50">--:--</span>
                try {
                    return <span className="text-xs font-bold tabular-nums">{format(new Date(val), "hh:mm aa")}</span>
                } catch (e) {
                    return <span className="text-xs font-bold tabular-nums">{val}</span>
                }
            }
        },
        {
            accessorKey: "otHours",
            header: "OT",
            cell: ({ row }) => {
                const ot = row.original.otHours
                return (
                    <span className={cn(
                        "text-xs font-bold tabular-nums",
                        ot > 0 ? "text-primary" : "text-muted-foreground opacity-50"
                    )}>
                        {ot > 0 ? `${ot.toFixed(2)}h` : "0.00"}
                    </span>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant="outline" className={cn(
                        "font-bold text-[10px] uppercase h-6 px-2.5 rounded-full border-none shadow-sm",
                        status === "Present" && "bg-primary/10 text-primary hover:bg-primary/20",
                        status === "Late" && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                        status === "Absent" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                        status === "On Leave" && "bg-blue-100 text-blue-700 hover:bg-blue-200",
                        status === "Holiday" && "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20",
                        !["Present", "Late", "Absent", "On Leave", "Holiday"].includes(status) && "bg-muted text-muted-foreground"
                    )}>
                        {status}
                    </Badge>
                )
            }
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconFingerprint className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Activity</h1>
                        <p className="text-muted-foreground text-sm">Attendance movements for {date ? format(date, "PPP") : "today"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9"
                        onClick={handleSeedMock}
                    >
                        <IconDatabaseImport className="size-4" />
                        Seed Data
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="gap-2 h-9" disabled={isExportingExcel || isExportingPdf}>
                                {isExportingExcel || isExportingPdf ? (
                                    <IconLoader2 className="size-4 animate-spin" />
                                ) : (
                                    <IconDownload className="size-4" />
                                )}
                                {isExportingExcel || isExportingPdf ? "Exporting..." : "Export"}
                                <IconChevronDown className="size-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-primary/10">
                            <DropdownMenuLabel className="text-xs font-bold opacity-50">Generate Report</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={handleExportPdf} 
                                className="cursor-pointer gap-2 py-2"
                                disabled={isExportingPdf}
                            >
                                {isExportingPdf ? (
                                    <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <IconFileTypePdf className="size-4 text-destructive" />
                                )}
                                <span className="font-semibold">{isExportingPdf ? "Generating PDF..." : "Download PDF"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={handleExportExcel} 
                                className="cursor-pointer gap-2 py-2"
                                disabled={isExportingExcel}
                            >
                                {isExportingExcel ? (
                                    <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <IconDownload className="size-4 text-primary" />
                                )}
                                <span className="font-semibold">{isExportingExcel ? "Generating Excel..." : "Download Excel"}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                <StatCard title="Headcount" value={summary?.totalHeadcount ?? 0} subtitle="Across all sections" icon={IconUsers} />
                <StatCard title="Present" value={summary?.presentCount ?? 0} subtitle={`${summary?.attendanceRate ?? 0}% participation`} icon={IconUserCheck} className="text-primary" />
                <StatCard title="Away" value={summary?.absentCount ?? 0} subtitle={`${summary?.leaveCount ?? 0} official leave`} icon={IconUserX} className="text-destructive" />
                <StatCard title="Delayed" value={summary?.lateCount ?? 0} subtitle="Requires follow-up" icon={IconClock} className="text-amber-600" />
            </div>

            {/* Filters */}
            <div className="px-6">
                <AdvancedFilter
                    onFilterChange={(newFilters: CommonFilterParams) => {
                        if (newFilters.date) {
                            // Ensure local date by appending time
                            setDate(new Date(newFilters.date + "T00:00:00"))
                        }
                        setDeptFilter(newFilters.departmentId?.toString() || "all")
                        setStatusFilter(newFilters.status || "all")
                        setSearch(newFilters.searchTerm || "")
                        setFullFilters(newFilters)
                    }}
                    initialFilters={fullFilters}
                />
            </div>

            {/* Attendance Table */}
            <div className="px-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span>Detailed Logs</span>
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <IconInfoCircle className="size-3.5" />
                                Live attendance data
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={records}
                            columns={columns}
                            showActions={false}
                            showTabs={false}
                            searchKey="employeeName"
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, className }: any) {
    return (
        <Card className="border-none shadow-sm group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className={cn("text-3xl font-black mt-2 tracking-tight", className)}>{value}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary/40" />
                        {subtitle}
                    </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                    <Icon className="size-6 text-muted-foreground group-hover:text-primary" />
                </div>
            </CardContent>
        </Card>
    )
}
