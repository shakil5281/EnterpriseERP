"use client"

import * as React from "react"
import {
    IconFingerprint,
    IconRefresh,
    IconUserCheck,
    IconUserX,
    IconClock,
    IconUsers,
    IconInfoCircle,
    IconLoader2,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
    attendanceService,
    type BackendDailyAttendance,
} from "@/lib/services/attendance"
import { companyService, type Company } from "@/lib/services/company"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type AttendanceRow = BackendDailyAttendance & {
    sequence: number
    workingHours: string
    otHours: string
}

interface ReportSummary {
    totalHeadcount: number
    presentCount: number
    absentCount: number
    lateCount: number
    leaveCount: number
    attendanceRate: number
}

function isGuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toDateInput(value: Date): string {
    return format(value, "yyyy-MM-dd")
}

function minutesToHours(minutes: number): string {
    if (!minutes) return "0.00"
    return (minutes / 60).toFixed(2)
}

function formatDateTime(value?: string | null): string {
    if (!value) return "--:--"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--:--"
    return format(date, "hh:mm aa")
}

function formatAttendanceDate(value?: string | null): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "dd MMM yyyy")
}

function buildSummary(rows: BackendDailyAttendance[]): ReportSummary {
    const employeeIDs = new Set(rows.map((r) => r.employeeID).filter(Boolean))
    const totalHeadcount = employeeIDs.size || rows.length

    let presentCount = 0
    let absentCount = 0
    let lateCount = 0
    let leaveCount = 0

    for (const row of rows) {
        const status = row.status.toLowerCase()
        if (status.includes("absent")) absentCount += 1
        else if (status.includes("leave")) leaveCount += 1
        else if (
            status.includes("present") ||
            status.includes("late") ||
            status.includes("early")
        ) {
            presentCount += 1
        }
        if (row.lateMinutes > 0 || status.includes("late")) lateCount += 1
    }

    const attendanceRate =
        totalHeadcount > 0 ? Math.round((presentCount / totalHeadcount) * 100) : 0

    return {
        totalHeadcount,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        attendanceRate,
    }
}

function statusClass(status: string): string {
    const normalized = status.toLowerCase()
    if (normalized.includes("present")) return "bg-primary/10 text-primary hover:bg-primary/20"
    if (normalized.includes("late")) return "bg-amber-100 text-amber-700 hover:bg-amber-200"
    if (normalized.includes("absent")) return "bg-destructive/10 text-destructive hover:bg-destructive/20"
    if (normalized.includes("leave")) return "bg-blue-100 text-blue-700 hover:bg-blue-200"
    if (normalized.includes("holiday")) return "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20"
    if (normalized.includes("missing")) return "bg-amber-100 text-amber-700 hover:bg-amber-200"
    return "bg-muted text-muted-foreground"
}

export default function DailyAttendanceReportPage() {
    const today = React.useMemo(() => toDateInput(new Date()), [])
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [companyId, setCompanyId] = React.useState("")
    const [fromDate, setFromDate] = React.useState(today)
    const [toDate, setToDate] = React.useState(today)
    const [employeeID, setEmployeeID] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [records, setRecords] = React.useState<AttendanceRow[]>([])
    const [summary, setSummary] = React.useState<ReportSummary | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)

    const loadCompanies = React.useCallback(async () => {
        try {
            const data = await companyService.getAll()
            setCompanies(data)
            if (!companyId && data[0]?.entityId) {
                setCompanyId(data[0].entityId)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load companies")
        }
    }, [companyId])

    const fetchData = React.useCallback(async () => {
        if (!companyId) {
            toast.error("Select a company")
            return
        }
        if (!isGuid(companyId)) {
            toast.error("Company id must be a valid GUID")
            return
        }
        setIsLoading(true)
        try {
            const rows = await attendanceService.getDailyAttendance({
                companyId,
                fromDate,
                toDate,
                employeeID: employeeID.trim() || undefined,
            })

            const mapped = rows.map((row, index) => ({
                ...row,
                sequence: index + 1,
                workingHours: minutesToHours(row.workingMinutes),
                otHours: minutesToHours(row.otMinutes),
            }))

            setRecords(mapped)
            setSummary(buildSummary(rows))
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to fetch attendance data")
            setRecords([])
            setSummary(null)
        } finally {
            setIsLoading(false)
        }
    }, [companyId, fromDate, toDate, employeeID])

    const runProcess = async () => {
        if (!companyId || !isGuid(companyId)) {
            toast.error("Select a company")
            return
        }
        setIsProcessing(true)
        try {
            const result = await attendanceService.processDaily({
                companyId,
                date: fromDate,
            })
            toast.success(
                `Processed ${result.recordsProcessed} employees (${result.presentCount} present, ${result.absentCount} absent)`,
            )
            await fetchData()
        } catch (error: unknown) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Processing failed")
        } finally {
            setIsProcessing(false)
        }
    }

    React.useEffect(() => {
        loadCompanies()
    }, [loadCompanies])

    React.useEffect(() => {
        if (companyId) {
            fetchData()
        }
    }, [companyId, fetchData])

    const filteredRecords = React.useMemo(() => {
        if (statusFilter === "all") return records
        return records.filter((row) => row.status.toLowerCase().includes(statusFilter.toLowerCase()))
    }, [records, statusFilter])

    const columns: ColumnDef<AttendanceRow>[] = [
        {
            accessorKey: "sequence",
            header: "SL",
            cell: ({ row }) => (
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {row.original.sequence.toString().padStart(2, "0")}
                </span>
            ),
        },
        {
            accessorKey: "employeeID",
            header: "Employee ID",
            cell: ({ row }) => (
                <span className="font-bold text-xs tabular-nums text-foreground max-w-[140px] truncate block">
                    {row.original.employeeID || "—"}
                </span>
            ),
        },
        {
            accessorKey: "punchNumber",
            header: "Punch #",
            cell: ({ row }) => (
                <span className="font-mono text-xs tabular-nums">{row.original.punchNumber || "—"}</span>
            ),
        },
        {
            accessorKey: "attendanceDate",
            header: "Date",
            cell: ({ row }) => (
                <span className="text-xs font-medium">{formatAttendanceDate(row.original.attendanceDate)}</span>
            ),
        },
        {
            accessorKey: "shiftCode",
            header: "Shift",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-bold text-[10px] uppercase py-0">
                    {row.original.shiftCode || "—"}
                </Badge>
            ),
        },
        {
            accessorKey: "inTime",
            header: "Check-In",
            cell: ({ row }) => (
                <span className="text-xs font-bold tabular-nums">{formatDateTime(row.original.inTime)}</span>
            ),
        },
        {
            accessorKey: "outTime",
            header: "Check-Out",
            cell: ({ row }) => (
                <span className="text-xs font-bold tabular-nums">{formatDateTime(row.original.outTime)}</span>
            ),
        },
        {
            accessorKey: "workingHours",
            header: "Work (h)",
            cell: ({ row }) => (
                <span className="text-xs font-bold tabular-nums">{row.original.workingHours}</span>
            ),
        },
        {
            accessorKey: "otHours",
            header: "OT (h)",
            cell: ({ row }) => (
                <span
                    className={cn(
                        "text-xs font-bold tabular-nums",
                        row.original.otMinutes > 0 ? "text-primary" : "text-muted-foreground opacity-50",
                    )}
                >
                    {row.original.otHours}
                </span>
            ),
        },
        {
            accessorKey: "lateMinutes",
            header: "Late (m)",
            cell: ({ row }) => (
                <span className="text-xs font-bold tabular-nums">{row.original.lateMinutes}</span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={cn(
                        "font-bold text-[10px] uppercase h-6 px-2.5 rounded-full border-none shadow-sm",
                        statusClass(row.original.status),
                    )}
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground max-w-[160px] truncate block">
                    {row.original.remarks || "—"}
                </span>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconFingerprint className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Activity</h1>
                        <p className="text-muted-foreground text-sm">
                            Platform attendance for {format(new Date(fromDate), "dd MMM yyyy")}
                            {fromDate !== toDate ? ` – ${format(new Date(toDate), "dd MMM yyyy")}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="default"
                        className="gap-2 h-9"
                        onClick={runProcess}
                        disabled={isProcessing || isLoading || !companyId}
                    >
                        {isProcessing ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconRefresh className="size-4" />
                        )}
                        Run Process
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 h-9"
                        onClick={fetchData}
                        disabled={isLoading || isProcessing || !companyId}
                    >
                        {isLoading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconRefresh className="size-4" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                <StatCard
                    title="Headcount"
                    value={summary?.totalHeadcount ?? 0}
                    subtitle="Unique employees in range"
                    icon={IconUsers}
                />
                <StatCard
                    title="Present"
                    value={summary?.presentCount ?? 0}
                    subtitle={`${summary?.attendanceRate ?? 0}% participation`}
                    icon={IconUserCheck}
                    className="text-primary"
                />
                <StatCard
                    title="Away"
                    value={summary?.absentCount ?? 0}
                    subtitle={`${summary?.leaveCount ?? 0} on leave`}
                    icon={IconUserX}
                    className="text-destructive"
                />
                <StatCard
                    title="Delayed"
                    value={summary?.lateCount ?? 0}
                    subtitle="Late minutes or status"
                    icon={IconClock}
                    className="text-amber-600"
                />
            </div>

            <div className="px-6">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Company</Label>
                            <NativeSelect
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                className="h-10"
                                disabled={isLoading}
                            >
                                <option value="">Select company</option>
                                {companies.map((company) => (
                                    <option key={company.entityId} value={company.entityId}>
                                        {company.companyNameEn}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">From</Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="h-10"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">To</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="h-10"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Status (client)</Label>
                            <NativeSelect
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10"
                            >
                                <option value="all">All Statuses</option>
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="absent">Absent</option>
                                <option value="leave">Leave</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">
                                Employee Code (optional)
                            </Label>
                            <Input
                                value={employeeID}
                                onChange={(e) => setEmployeeID(e.target.value)}
                                placeholder="e.g. 10"
                                className="h-10 font-mono text-xs"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex items-end lg:col-span-3">
                            <Button
                                className="h-10 w-full md:w-auto gap-2"
                                onClick={fetchData}
                                disabled={isLoading || !companyId}
                            >
                                {isLoading ? (
                                    <IconLoader2 className="size-4 animate-spin" />
                                ) : (
                                    <IconRefresh className="size-4" />
                                )}
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="px-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span>Detailed Logs</span>
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <IconInfoCircle className="size-3.5" />
                                GET /api/v1/Attendance
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={filteredRecords}
                            columns={columns}
                            showActions={false}
                            showTabs={false}
                            searchKey="employeeID"
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    className,
}: {
    title: string
    value: number
    subtitle: string
    icon: React.ComponentType<{ className?: string }>
    className?: string
}) {
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
