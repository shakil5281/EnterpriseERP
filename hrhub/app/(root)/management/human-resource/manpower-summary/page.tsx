"use client"

import * as React from "react"
import {
    IconReport,
    IconUsers,
    IconUserCheck,
    IconUserOff,
    IconChartPie,
    IconTrendingUp,
    IconUserExclamation,
    IconBuildingSkyscraper,
    IconBriefcase,
    IconLoader,
    IconFilter,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { SummaryCard } from "@/components/summary-card"
import { toast } from "sonner"
import { employeeService, type ManpowerSummary, type SummaryItem } from "@/lib/services/employee"
import { companyService, type Company } from "@/lib/services/company"
import { organogramService, type Floor, type Department, type Section, type Designation } from "@/lib/services/organogram"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { type DateRange } from "react-day-picker"

export default function ManpowerSummaryPage() {
    const [summary, setSummary] = React.useState<ManpowerSummary | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    // Filter states
    const [departmentId, setDepartmentId] = React.useState<string>("all")
    const [sectionId, setSectionId] = React.useState<string>("all")
    const [designationId, setDesignationId] = React.useState<string>("all")
    const [status, setStatus] = React.useState<string>("all")
    const [companyName, setCompanyName] = React.useState<string>("all")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [floorId, setFloorId] = React.useState<string>("all")
    const [gender, setGender] = React.useState<string>("all")
    const [religion, setReligion] = React.useState<string>("all")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

    // Options states
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])
    const [designations, setDesignations] = React.useState<Designation[]>([])
    const [floors, setFloors] = React.useState<Floor[]>([])
    const [companies, setCompanies] = React.useState<Company[]>([])

    const fetchSummary = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (departmentId !== "all") params.departmentId = parseInt(departmentId)
            if (sectionId !== "all") params.sectionId = parseInt(sectionId)
            if (designationId !== "all") params.designationId = parseInt(designationId)
            if (floorId !== "all") params.floorId = parseInt(floorId)
            if (selectedCompanyId !== "all") params.companyId = parseInt(selectedCompanyId)
            if (companyName !== "all") params.companyName = companyName
            if (gender !== "all") params.gender = gender
            if (dateRange?.from) params.joinDateFrom = dateRange.from.toISOString()
            if (dateRange?.to) params.joinDateTo = dateRange.to.toISOString()
            if (status !== "all") params.status = status

            const data = await employeeService.getManpowerSummary(params)
            setSummary(data)
        } catch (error) {
            console.error("Failed to load manpower summary", error)
            toast.error("Failed to load manpower summary data")
        } finally {
            setIsLoading(false)
        }
    }, [departmentId, sectionId, designationId, floorId, selectedCompanyId, companyName, gender, religion, dateRange, status])

    React.useEffect(() => {
        const loadRefs = async () => {
            try {
                const [depts, flrs, comps] = await Promise.all([
                    organogramService.getDepartments(),
                    organogramService.getFloors(),
                    companyService.getAll()
                ])
                setDepartments(depts)
                setFloors(flrs)
                setCompanies(comps)
            } catch (error) {
                console.error("Failed to load reference data", error)
            }
        }
        loadRefs()
    }, [])

    // Cascading dropdowns
    React.useEffect(() => {
        if (departmentId !== "all") {
            organogramService.getSections({ departmentId: parseInt(departmentId) }).then(setSections)
        } else {
            setSections([])
            setSectionId("all")
        }
    }, [departmentId])

    React.useEffect(() => {
        if (sectionId !== "all") {
            organogramService.getDesignations({ sectionId: parseInt(sectionId) }).then(setDesignations)
        } else {
            setDesignations([])
            setDesignationId("all")
        }
    }, [sectionId])

    React.useEffect(() => {
        fetchSummary()
        // Initial load only; further loads use Apply Filters.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const departmentColumns: ColumnDef<SummaryItem>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "name",
            header: "Department",
            cell: ({ row }) => <span className="font-semibold">{row.getValue("name")}</span>,
        },
        {
            accessorKey: "count",
            header: "Headcount",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.getValue("count")}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1">
                        {row.original.percentage}%
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "percentage",
            header: "Distribution",
            cell: ({ row }) => {
                const val = row.getValue("percentage") as number
                return (
                    <div className="flex items-center gap-3 w-full max-w-[200px]">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${val}%` }}
                            />
                        </div>
                    </div>
                )
            },
        },
    ]

    const designationColumns: ColumnDef<SummaryItem>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "name",
            header: "Designation",
            cell: ({ row }) => <span className="text-sm">{row.getValue("name")}</span>,
        },
        {
            accessorKey: "count",
            header: "Count",
            cell: ({ row }) => <span className="font-medium">{row.getValue("count")}</span>,
        },
        {
            accessorKey: "percentage",
            header: "Share",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue("percentage")}%</span>,
        },
    ]

    if (isLoading && !summary) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <IconLoader className="size-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Analyzing workforce data...</p>
            </div>
        )
    }

    const chartDataBase = [
        { value: 10 }, { value: 25 }, { value: 15 }, { value: 35 },
        { value: 25 }, { value: 45 }, { value: 30 }, { value: 55 }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 bg-muted/20 min-h-screen px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                        <IconChartPie className="size-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manpower Analytics</h1>
                        <p className="text-sm text-muted-foreground">
                            Deep dive into workforce distribution and employee status.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-full border">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live Feed Active
                    </span>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none bg-background/60 backdrop-blur-sm overflow-hidden">
                <div className="h-1 bg-primary/20 w-full" />
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconFilter className="size-4 text-primary" />
                            <CardTitle className="text-sm font-medium uppercase tracking-wider">Analytics Filters</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={fetchSummary}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <IconLoader className="size-3.5 animate-spin" />
                                ) : (
                                    <IconFilter className="size-3.5" />
                                )}
                                Apply Filters
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => {
                                    setDepartmentId("all")
                                    setSectionId("all")
                                    setDesignationId("all")
                                    setFloorId("all")
                                    setCompanyName("all")
                                    setSelectedCompanyId("all")
                                    setGender("all")
                                    setReligion("all")
                                    setDateRange(undefined)
                                    setStatus("all")
                                }}
                            >
                                Reset All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Department */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Department</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.nameEn}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        {/* Section */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Section</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={sectionId}
                                onChange={(e) => setSectionId(e.target.value)}
                                disabled={departmentId === "all"}
                            >
                                <option value="all">All Sections</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>{s.nameEn}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        {/* Designation */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Designation</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={designationId}
                                onChange={(e) => setDesignationId(e.target.value)}
                                disabled={sectionId === "all"}
                            >
                                <option value="all">All Designations</option>
                                {designations.map((d) => (
                                    <option key={d.id} value={d.id}>{d.nameEn}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        {/* Status */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Status</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Probation">Probation</option>
                                <option value="Resigned">Resigned</option>
                            </NativeSelect>
                        </div>

                        {/* Company */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Company</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={selectedCompanyId}
                                onChange={(e) => {
                                    const val = e.target.value
                                    setSelectedCompanyId(val)
                                    if (val === "all") {
                                        setCompanyName("all")
                                    } else {
                                        const comp = companies.find((c) => c.id === parseInt(val, 10))
                                        setCompanyName(comp?.companyNameEn ?? "all")
                                    }
                                    setDepartmentId("all")
                                    setSectionId("all")
                                    setDesignationId("all")
                                }}
                            >
                                <option value="all">All Companies</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.companyNameEn}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        {/* Floor */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Floor</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={floorId}
                                onChange={(e) => setFloorId(e.target.value)}
                            >
                                <option value="all">All Floors</option>
                                {floors.map((f) => (
                                    <option key={f.id} value={f.id}>{f.nameEn}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        {/* Gender */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gender</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option value="all">All Genders</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Others">Others</option>
                            </NativeSelect>
                        </div>

                        {/* Religion */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Religion</Label>
                            <NativeSelect
                                className="h-10 bg-muted/30 border-none"
                                value={religion}
                                onChange={(e) => setReligion(e.target.value)}
                            >
                                <option value="all">All Religions</option>
                                <option value="Islam">Islam</option>
                                <option value="Hinduism">Hinduism</option>
                                <option value="Christianity">Christianity</option>
                                <option value="Buddhism">Buddhism</option>
                            </NativeSelect>
                        </div>

                        {/* Date Range picker */}
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Joining Date Range</Label>
                            <DateRangePicker
                                date={dateRange}
                                setDate={setDateRange}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Employees"
                    value={summary?.totalEmployees.toString() || "0"}
                    icon={IconUsers}
                    trend={{ value: "Live", label: "registered in system", isUp: true }}
                    status="primary"
                    chartData={chartDataBase}
                />
                <SummaryCard
                    title="Active Manpower"
                    value={summary?.activeEmployees.toString() || "0"}
                    icon={IconUserCheck}
                    trend={{
                        value: `${summary ? Math.round((summary.activeEmployees / summary.totalEmployees) * 100) : 0}%`,
                        label: "of total workforce",
                        isUp: true
                    }}
                    status="success"
                    chartData={chartDataBase.map(d => ({ value: d.value + 5 }))}
                />
                <SummaryCard
                    title="Absence/Leave"
                    value={summary?.onLeaveEmployees.toString() || "0"}
                    icon={IconUserExclamation}
                    trend={{
                        value: summary?.onLeaveEmployees.toString() || "0",
                        label: "awaiting return",
                        isUp: false
                    }}
                    status="warning"
                    chartData={chartDataBase.map(d => ({ value: d.value * 0.3 }))}
                />
                <SummaryCard
                    title="Inactive Profile"
                    value={summary?.inactiveEmployees.toString() || "0"}
                    icon={IconUserOff}
                    trend={{ value: "N/A", label: "archived records", isUp: false }}
                    status="error"
                    chartData={chartDataBase.map(d => ({ value: 10 }))}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <Card className="border-none rounded-2xl overflow-hidden bg-background/60 backdrop-blur-sm">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                            <IconBuildingSkyscraper className="size-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">By Department</CardTitle>
                                <CardDescription className="text-xs">Headcount distribution across sections.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={summary?.departmentSummary || []}
                            columns={departmentColumns}
                            showActions={false}
                            showTabs={false}
                            searchKey="name"
                        />
                    </CardContent>
                </Card>

                {/* Status distribution */}
                <Card className="border-none rounded-2xl overflow-hidden bg-background/60 backdrop-blur-sm">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                            <IconTrendingUp className="size-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">By Status</CardTitle>
                                <CardDescription className="text-xs">Employee current lifecycle status.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {(summary?.statusSummary || []).map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "size-2 rounded-full",
                                                item.name === "Active" ? "bg-green-500" :
                                                    item.name === "On Leave" ? "bg-amber-500" : "bg-muted-foreground/30"
                                            )} />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-muted-foreground">{item.count} Employees ({item.percentage}%)</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-1000",
                                                item.name === "Active" ? "bg-green-500" :
                                                    item.name === "On Leave" ? "bg-amber-500" : "bg-primary"
                                            )}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Designations */}
                <Card className="border-none rounded-2xl overflow-hidden bg-background/60 backdrop-blur-sm lg:col-span-2">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                            <IconBriefcase className="size-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">Top 10 Designations</CardTitle>
                                <CardDescription className="text-xs">Most common roles within the organization.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={summary?.designationSummary || []}
                            columns={designationColumns}
                            showActions={false}
                            showTabs={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
