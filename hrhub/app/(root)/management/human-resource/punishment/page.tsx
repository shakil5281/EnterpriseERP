"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    IconGavel,
    IconFilter,
    IconPlus,
    IconDownload,
    IconSearch,
    IconLoader,
    IconAlertTriangle,
    IconCurrencyTaka,
    IconUserExclamation,
    IconHistory
} from "@tabler/icons-react"
import { type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import { punishmentService, type EmployeePunishment, type PunishmentSummary } from "@/lib/services/punishment"
import { SummaryCard } from "@/components/summary-card"
import { PunishmentDialog } from "@/app/(root)/management/human-resource/punishment/punishment-dialog"
import { type DateRange } from "react-day-picker"

export default function PunishmentPage() {
    const [records, setRecords] = React.useState<EmployeePunishment[]>([])
    const [summary, setSummary] = React.useState<PunishmentSummary | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [selectedPunishment, setSelectedPunishment] = React.useState<EmployeePunishment | undefined>(undefined)

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState("")
    const [punishmentType, setPunishmentType] = React.useState("all")
    const [status, setStatus] = React.useState("all")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

    const fetchPunishments = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (searchTerm) params.searchTerm = searchTerm
            if (punishmentType !== "all") params.punishmentType = punishmentType
            if (status !== "all") params.status = status
            if (dateRange?.from) params.fromDate = dateRange.from.toISOString()
            if (dateRange?.to) params.toDate = dateRange.to.toISOString()

            const data = await punishmentService.getPunishments(params)
            setRecords(data.records)
            setSummary(data.summary)
        } catch (error) {
            console.error("Failed to load punishments", error)
            toast.error("Failed to load punishment records")
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, punishmentType, status, dateRange])

    React.useEffect(() => {
        fetchPunishments()
    }, [fetchPunishments])

    const columns: ColumnDef<EmployeePunishment>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "employeeCard",
            header: "EMP ID",
            cell: ({ row }) => <span className="font-mono text-xs font-bold text-primary">{row.original.employeeCard}</span>,
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.employeeName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.designation} | {row.original.department}</span>
                </div>
            ),
        },
        {
            accessorKey: "punishmentType",
            header: "Type",
            cell: ({ row }) => {
                const type = row.original.punishmentType
                return (
                    <Badge variant="outline" className={
                        type === "Termination" ? "border-red-500 text-red-600 bg-red-50" :
                        type === "Suspension" ? "border-amber-500 text-amber-600 bg-amber-50" :
                        "border-blue-500 text-blue-600 bg-blue-50"
                    }>
                        {type}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => <span className="text-xs max-w-[200px] truncate block" title={row.original.reason}>{row.original.reason}</span>,
        },
        {
            accessorKey: "fineAmount",
            header: "Penalty",
            cell: ({ row }) => (
                <div className="flex flex-col text-right">
                    {row.original.fineAmount > 0 && (
                        <span className="font-mono text-xs font-bold text-red-600">৳{row.original.fineAmount.toLocaleString()}</span>
                    )}
                    {row.original.suspensionDays > 0 && (
                        <span className="text-[10px] text-amber-600">{row.original.suspensionDays} Days Susp.</span>
                    )}
                    {row.original.fineAmount === 0 && row.original.suspensionDays === 0 && <span className="text-muted-foreground">-</span>}
                </div>
            ),
        },
        {
            accessorKey: "punishmentDate",
            header: "Date",
            cell: ({ row }) => <span className="text-xs">{format(new Date(row.original.punishmentDate), "dd MMM yyyy")}</span>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant={status === "Active" ? "default" : status === "Revoked" ? "destructive" : "secondary"} className="text-[10px] h-5">
                        {status}
                    </Badge>
                )
            },
        },
    ]

    const handleEdit = (punishment: EmployeePunishment) => {
        setSelectedPunishment(punishment)
        setIsDialogOpen(true)
    }

    const handleDelete = async (punishment: EmployeePunishment) => {
        if (!confirm(`Are you sure you want to delete this record for ${punishment.employeeName}?`)) return
        try {
            await punishmentService.deletePunishment(punishment.id)
            toast.success("Record deleted successfully")
            fetchPunishments()
        } catch (error) {
            toast.error("Failed to delete record")
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 bg-muted/20 min-h-screen px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                        <IconGavel className="size-7 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Disciplinary Actions</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage employee punishments, fines, and warnings.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setSelectedPunishment(undefined); setIsDialogOpen(true); }} className="gap-2 bg-red-600 hover:bg-red-700">
                        <IconPlus className="size-4" />
                        Record Punishment
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Actions"
                    value={summary?.totalRecords || 0}
                    icon={IconHistory}
                    status="info"
                    trend={{ value: "All time", label: "records in system", isUp: true }}
                />
                <SummaryCard
                    title="Active Cases"
                    value={summary?.activePunishments || 0}
                    icon={IconAlertTriangle}
                    status="warning"
                    trend={{ value: "Live", label: "pending completion", isUp: false }}
                />
                <SummaryCard
                    title="Total Fines"
                    value={`৳${summary?.totalFineAmount.toLocaleString() || 0}`}
                    icon={IconCurrencyTaka}
                    status="error"
                    trend={{ value: "Collected", label: "from penalties", isUp: true }}
                />
                <SummaryCard
                    title="Suspensions"
                    value={summary?.suspensions || 0}
                    icon={IconUserExclamation}
                    status="primary"
                    trend={{ value: "Impact", label: "on productivity", isUp: false }}
                />
            </div>

            {/* Filters */}
            <Card className="border-none bg-background/60 backdrop-blur-sm overflow-hidden">
                <div className="h-1 bg-red-500/20 w-full" />
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <IconFilter className="size-4 text-red-600" />
                        <CardTitle className="text-sm font-medium uppercase tracking-wider">Search Filters</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Search Employee</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or employee ID..."
                                    className="pl-9 h-10 bg-muted/30 border-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Type</Label>
                            <NativeSelect className="h-10 bg-muted/30 border-none" value={punishmentType} onChange={(e) => setPunishmentType(e.target.value)}>
                                <option value="all">All Types</option>
                                <option value="Warning">Warning</option>
                                <option value="Fine">Fine</option>
                                <option value="Suspension">Suspension</option>
                                <option value="Termination">Termination</option>
                                <option value="Demotion">Demotion</option>
                            </NativeSelect>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Status</Label>
                            <NativeSelect className="h-10 bg-muted/30 border-none" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Revoked">Revoked</option>
                                <option value="Completed">Completed</option>
                            </NativeSelect>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Period</Label>
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border-none rounded-2xl overflow-hidden bg-background/60 backdrop-blur-sm flex-1">
                <CardContent className="p-0">
                    <DataTable
                        data={records}
                        columns={columns}
                        isLoading={isLoading}
                        showActions={true}
                        showTabs={false}
                        onEditClick={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>

            <PunishmentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                punishment={selectedPunishment}
                onSuccess={() => {
                    setIsDialogOpen(false)
                    fetchPunishments()
                }}
            />
        </div>
    )
}
