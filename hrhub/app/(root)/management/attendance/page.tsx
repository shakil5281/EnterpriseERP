"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconActivity,
    IconCalendar,
    IconCheck,
    IconClock,
    IconEdit,
    IconFingerprint,
    IconLoader,
    IconRefresh,
    IconSearch,
    IconShieldCheck,
    IconUserCheck,
    IconUserOff,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    attendanceService,
    type BackendAttendanceSummary,
    type BackendDailyAttendance,
} from "@/lib/services/attendance"
import { companyService, type Company } from "@/lib/services/company"

const emptyGuid = "00000000-0000-0000-0000-000000000000"

type AttendanceRow = BackendDailyAttendance & {
    sequence: number
    workingHours: string
    otHours: string
}

type AttendanceSummaryRow = BackendAttendanceSummary & {
    id: string
}

function isGuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function minutesToHours(minutes: number): string {
    if (!minutes) return "0h 0m"
    const sign = minutes < 0 ? "-" : ""
    const abs = Math.abs(minutes)
    return `${sign}${Math.floor(abs / 60)}h ${abs % 60}m`
}

function toDateInput(value: Date): string {
    return format(value, "yyyy-MM-dd")
}

function formatDateTime(value?: string | null): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "dd MMM yyyy, hh:mm aa")
}

function toDateTimeLocal(value?: string | null): string {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return format(date, "yyyy-MM-dd'T'HH:mm")
}

function statusClass(status: string): string {
    const normalized = status.toLowerCase()
    if (normalized.includes("present")) return "bg-emerald-50 text-emerald-700 border-emerald-100"
    if (normalized.includes("late")) return "bg-amber-50 text-amber-700 border-amber-100"
    if (normalized.includes("absent")) return "bg-red-50 text-red-700 border-red-100"
    if (normalized.includes("holiday")) return "bg-blue-50 text-blue-700 border-blue-100"
    return "bg-muted text-muted-foreground border-transparent"
}

export default function AttendancePage() {
    const today = React.useMemo(() => toDateInput(new Date()), [])
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [companyId, setCompanyId] = React.useState("")
    const [fromDate, setFromDate] = React.useState(today)
    const [toDate, setToDate] = React.useState(today)
    const [employeeID, setEmployeeID] = React.useState("")
    const [adminId, setAdminId] = React.useState("")
    const [records, setRecords] = React.useState<AttendanceRow[]>([])
    const [summary, setSummary] = React.useState<AttendanceSummaryRow[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [isSavingAdjustment, setIsSavingAdjustment] = React.useState(false)
    const [editingRecord, setEditingRecord] = React.useState<AttendanceRow | null>(null)
    const [adjustment, setAdjustment] = React.useState({ inTime: "", outTime: "", remarks: "" })

    const queryParams = React.useMemo(() => ({
        companyId,
        fromDate,
        toDate,
        employeeID: employeeID.trim() || undefined,
    }), [companyId, fromDate, toDate, employeeID])

    const loadCompanies = React.useCallback(async () => {
        try {
            const data = await companyService.getAll()
            setCompanies(data)
            if (!companyId && data[0]?.entityId) {
                setCompanyId(data[0].entityId)
            }
        } catch (error) {
            console.error("Failed to load companies", error)
            toast.error("Failed to load companies")
        }
    }, [companyId])

    const loadAttendance = React.useCallback(async () => {
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
            const [attendanceRows, summaryRows] = await Promise.all([
                attendanceService.getDailyAttendance(queryParams),
                attendanceService.getAttendanceSummaryRecords(queryParams),
            ])
            setRecords(attendanceRows.map((row, index) => ({
                ...row,
                sequence: index + 1,
                workingHours: minutesToHours(row.workingMinutes),
                otHours: minutesToHours(row.otMinutes),
            })))
            setSummary(summaryRows.map((row) => ({ ...row, id: `${row.employeeID}-${row.punchNumber}` })))
        } catch (error) {
            console.error("Failed to load attendance", error)
            toast.error("Failed to load attendance")
        } finally {
            setIsLoading(false)
        }
    }, [companyId, employeeID, queryParams])

    React.useEffect(() => {
        loadCompanies()
    }, [loadCompanies])

    React.useEffect(() => {
        if (companyId) {
            loadAttendance()
        }
    }, [companyId, loadAttendance])

    const totals = React.useMemo(() => {
        return summary.reduce(
            (acc, row) => ({
                present: acc.present + row.totalPresent,
                absent: acc.absent + row.totalAbsent,
                late: acc.late + row.totalLate,
                earlyOut: acc.earlyOut + row.totalEarlyOut,
                otMinutes: acc.otMinutes + row.totalOTMinutes,
                workingMinutes: acc.workingMinutes + row.totalWorkingMinutes,
            }),
            { present: 0, absent: 0, late: 0, earlyOut: 0, otMinutes: 0, workingMinutes: 0 },
        )
    }, [summary])

    const openAdjustment = (row: AttendanceRow) => {
        setEditingRecord(row)
        setAdjustment({
            inTime: toDateTimeLocal(row.inTime),
            outTime: toDateTimeLocal(row.outTime),
            remarks: row.remarks ?? "",
        })
    }

    const processDaily = async () => {
        if (!companyId || !isGuid(companyId)) {
            toast.error("Select a valid company")
            return
        }
        setIsProcessing(true)
        try {
            await attendanceService.processDaily({ companyId, date: fromDate })
            toast.success("Attendance processed")
            await loadAttendance()
        } catch (error) {
            console.error("Failed to process attendance", error)
            toast.error("Failed to process attendance")
        } finally {
            setIsProcessing(false)
        }
    }

    const saveAdjustment = async () => {
        if (!editingRecord) return
        if (!adminId.trim() || !isGuid(adminId.trim())) {
            toast.error("Admin id must be a valid GUID")
            return
        }

        setIsSavingAdjustment(true)
        try {
            await attendanceService.adjustAttendance({
                id: editingRecord.id,
                inTime: adjustment.inTime || null,
                outTime: adjustment.outTime || null,
                remarks: adjustment.remarks.trim() || null,
                adminId: adminId.trim(),
            })
            toast.success("Attendance adjusted")
            setEditingRecord(null)
            await loadAttendance()
        } catch (error) {
            console.error("Failed to adjust attendance", error)
            toast.error("Failed to adjust attendance")
        } finally {
            setIsSavingAdjustment(false)
        }
    }

    const approveAttendance = async (row: AttendanceRow) => {
        if (!adminId.trim() || !isGuid(adminId.trim())) {
            toast.error("Admin id must be a valid GUID")
            return
        }

        try {
            await attendanceService.approveAttendance(row.id, adminId.trim())
            toast.success("Attendance approved")
            await loadAttendance()
        } catch (error) {
            console.error("Failed to approve attendance", error)
            toast.error("Failed to approve attendance")
        }
    }

    const attendanceColumns = React.useMemo<ColumnDef<AttendanceRow>[]>(() => [
        {
            accessorKey: "sequence",
            header: "SL",
            cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground tabular-nums">{row.original.sequence}</span>,
        },
        {
            accessorKey: "employeeID",
            header: "Employee ID",
            cell: ({ row }) => (
                <div className="flex max-w-[220px] flex-col">
                    <span className="truncate text-xs font-black tabular-nums">{row.original.employeeID || "—"}</span>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{row.original.shiftCode || "No shift"}</span>
                </div>
            ),
        },
        {
            accessorKey: "attendanceDate",
            header: "Date",
            cell: ({ row }) => <span className="text-xs font-semibold">{formatDateTime(row.original.attendanceDate).split(",")[0]}</span>,
        },
        {
            accessorKey: "inTime",
            header: "In",
            cell: ({ row }) => <span className="text-xs font-semibold">{formatDateTime(row.original.inTime)}</span>,
        },
        {
            accessorKey: "outTime",
            header: "Out",
            cell: ({ row }) => <span className="text-xs font-semibold">{formatDateTime(row.original.outTime)}</span>,
        },
        {
            accessorKey: "workingHours",
            header: "Work",
            cell: ({ row }) => <span className="text-xs font-black tabular-nums">{row.original.workingHours}</span>,
        },
        {
            accessorKey: "otHours",
            header: "OT",
            cell: ({ row }) => <span className="text-xs font-black tabular-nums text-primary">{row.original.otHours}</span>,
        },
        {
            accessorKey: "lateMinutes",
            header: "Late",
            cell: ({ row }) => <span className="text-xs font-semibold tabular-nums">{row.original.lateMinutes}m</span>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant="outline" className={cn("h-6 rounded-full px-3 text-[10px] font-black uppercase", statusClass(row.original.status))}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right text-xs font-bold uppercase text-muted-foreground">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2" data-no-row-click="true">
                    <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => openAdjustment(row.original)}>
                        <IconEdit className="size-3.5" />
                        Adjust
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs text-emerald-700" onClick={() => approveAttendance(row.original)}>
                        <IconCheck className="size-3.5" />
                        Approve
                    </Button>
                </div>
            ),
        },
    ], [adminId, loadAttendance])

    const summaryColumns = React.useMemo<ColumnDef<AttendanceSummaryRow>[]>(() => [
        {
            accessorKey: "employeeID",
            header: "Employee ID",
            cell: ({ row }) => <span className="text-xs font-black tabular-nums">{row.original.employeeID || "—"}</span>,
        },
        {
            accessorKey: "totalPresent",
            header: "Present",
            cell: ({ row }) => <span className="text-xs font-bold text-emerald-700">{row.original.totalPresent}</span>,
        },
        {
            accessorKey: "totalAbsent",
            header: "Absent",
            cell: ({ row }) => <span className="text-xs font-bold text-red-700">{row.original.totalAbsent}</span>,
        },
        {
            accessorKey: "totalLate",
            header: "Late",
            cell: ({ row }) => <span className="text-xs font-bold text-amber-700">{row.original.totalLate}</span>,
        },
        {
            accessorKey: "totalEarlyOut",
            header: "Early Out",
            cell: ({ row }) => <span className="text-xs font-bold">{row.original.totalEarlyOut}</span>,
        },
        {
            accessorKey: "totalOTMinutes",
            header: "OT",
            cell: ({ row }) => <span className="text-xs font-bold text-primary">{minutesToHours(row.original.totalOTMinutes)}</span>,
        },
        {
            accessorKey: "totalWorkingMinutes",
            header: "Work",
            cell: ({ row }) => <span className="text-xs font-bold">{minutesToHours(row.original.totalWorkingMinutes)}</span>,
        },
        {
            accessorKey: "totalHolidays",
            header: "Holidays",
            cell: ({ row }) => <span className="text-xs font-bold">{row.original.totalHolidays}</span>,
        },
        {
            accessorKey: "totalWeeklyOffs",
            header: "Weekly Off",
            cell: ({ row }) => <span className="text-xs font-bold">{row.original.totalWeeklyOffs}</span>,
        },
    ], [])

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                        <IconFingerprint className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Attendance</h1>
                        <p className="text-sm text-muted-foreground">Platform API console</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="gap-2 rounded-xl font-bold" onClick={loadAttendance} disabled={isLoading || !companyId}>
                        {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                        Refresh
                    </Button>
                    <Button className="gap-2 rounded-xl font-bold" onClick={processDaily} disabled={isProcessing || !companyId}>
                        {isProcessing ? <IconLoader className="size-4 animate-spin" /> : <IconActivity className="size-4" />}
                        Process
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
                    <div className="space-y-2 xl:col-span-2">
                        <Label>Company</Label>
                        <NativeSelect value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="h-10">
                            <option value="">Select company</option>
                            {companies.map((company) => (
                                <option key={company.entityId} value={company.entityId}>
                                    {company.companyNameEn}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="space-y-2">
                        <Label>From</Label>
                        <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>To</Label>
                        <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                    </div>
                    <div className="space-y-2 xl:col-span-2">
                        <Label>Employee ID</Label>
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={employeeID} onChange={(event) => setEmployeeID(event.target.value)} placeholder="e.g. EMP-0001" className="pl-9" />
                        </div>
                    </div>
                    <div className="space-y-2 xl:col-span-2">
                        <Label>Admin GUID</Label>
                        <Input value={adminId} onChange={(event) => setAdminId(event.target.value)} placeholder={emptyGuid} />
                    </div>
                    <div className="flex items-end xl:col-span-4">
                        <Button variant="secondary" className="h-10 w-full gap-2 rounded-xl font-bold md:w-auto" onClick={loadAttendance} disabled={isLoading}>
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Present" value={totals.present.toString()} icon={IconUserCheck} className="text-emerald-700" />
                <MetricCard title="Absent" value={totals.absent.toString()} icon={IconUserOff} className="text-red-700" />
                <MetricCard title="Late" value={totals.late.toString()} icon={IconClock} className="text-amber-700" />
                <MetricCard title="Overtime" value={minutesToHours(totals.otMinutes)} icon={IconCalendar} className="text-primary" />
            </div>

            <Tabs defaultValue="records" className="space-y-4">
                <TabsList className="h-11 rounded-xl bg-muted/60 p-1">
                    <TabsTrigger value="records" className="h-9 gap-2 rounded-lg px-4">
                        <IconFingerprint className="size-4" />
                        Attendance
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="h-9 gap-2 rounded-lg px-4">
                        <IconShieldCheck className="size-4" />
                        Summary
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="records" className="m-0">
                    <Card className="overflow-hidden border-none shadow-sm">
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="text-base font-black">Daily Attendance</CardTitle>
                            <CardDescription>{records.length} record(s)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={records}
                                columns={attendanceColumns}
                                showActions={false}
                                showTabs={false}
                                searchKey="employeeID"
                                isLoading={isLoading}
                                getRowId={(row) => row.id}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="m-0">
                    <Card className="overflow-hidden border-none shadow-sm">
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="text-base font-black">Attendance Summary</CardTitle>
                            <CardDescription>{summary.length} employee(s)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={summary}
                                columns={summaryColumns}
                                showActions={false}
                                showTabs={false}
                                searchKey="employeeID"
                                isLoading={isLoading}
                                getRowId={(row) => row.id}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Adjust Attendance</DialogTitle>
                        <DialogDescription>{editingRecord?.employeeID} (punch {editingRecord?.punchNumber})</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>In Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={adjustment.inTime}
                                    onChange={(event) => setAdjustment((current) => ({ ...current, inTime: event.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Out Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={adjustment.outTime}
                                    onChange={(event) => setAdjustment((current) => ({ ...current, outTime: event.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Textarea
                                value={adjustment.remarks}
                                onChange={(event) => setAdjustment((current) => ({ ...current, remarks: event.target.value }))}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
                        <Button onClick={saveAdjustment} disabled={isSavingAdjustment} className="gap-2">
                            {isSavingAdjustment ? <IconLoader className="size-4 animate-spin" /> : <IconEdit className="size-4" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function MetricCard({
    title,
    value,
    icon: Icon,
    className,
}: {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    className?: string
}) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</p>
                    <h3 className={cn("mt-2 text-2xl font-black tracking-tight", className)}>{value}</h3>
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted/50">
                    <Icon className="size-5 text-muted-foreground" />
                </div>
            </CardContent>
        </Card>
    )
}
