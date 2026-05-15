"use client"

import * as React from "react"
import {
    IconFileAnalytics,
    IconDownload,
    IconFilter,
    IconLoader,
    IconCalendar,
    IconPrinter,
    IconSearch
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { leaveService } from "@/lib/services/leave"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

const MONTHS = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
]

export default function MonthlyLeaveReportPage() {
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [isLoading, setIsLoading] = React.useState(false)
    const [reportData, setReportData] = React.useState<any[]>([])

    const loadReport = async () => {
        setIsLoading(true)
        try {
            const data = await leaveService.getMonthlyReport({ year, month })
            setReportData(data)
        } catch (error) {
            toast.error("Failed to generate leave report")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        loadReport()
    }, [])

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.department}</span>
                </div>
            )
        },
        {
            accessorKey: "sickLeave",
            header: "Sick",
            cell: ({ row }) => <span className="font-medium">{row.original.sickLeave || 0}</span>
        },
        {
            accessorKey: "casualLeave",
            header: "Casual",
            cell: ({ row }) => <span className="font-medium">{row.original.casualLeave || 0}</span>
        },
        {
            accessorKey: "earnedLeave",
            header: "Earned",
            cell: ({ row }) => <span className="font-medium">{row.original.earnedLeave || 0}</span>
        },
        {
            accessorKey: "paternityLeave",
            header: "Paternity",
            cell: ({ row }) => <span className="font-medium">{row.original.paternityLeave || 0}</span>
        },
        {
            accessorKey: "maternityLeave",
            header: "Maternity",
            cell: ({ row }) => <span className="font-medium">{row.original.maternityLeave || 0}</span>
        },
        {
            accessorKey: "lwp",
            header: "LWP",
            cell: ({ row }) => <span className="font-medium">{row.original.lwp || 0}</span>
        },
        {
            accessorKey: "otherLeave",
            header: "Other",
            cell: ({ row }) => <span className="font-medium">{row.original.otherLeave || 0}</span>
        },
        {
            accessorKey: "totalDays",
            header: "Total Taken",
            cell: ({ row }) => <Badge variant="secondary" className="font-normal">{row.original.totalDays} Days</Badge>
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Monthly Leave Report</h1>
                    <p className="text-muted-foreground text-sm">Aggregated leave utilization by employee</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 h-9">
                        <IconDownload className="size-4" /> Export CSV
                    </Button>
                    <Button variant="outline" className="gap-2 h-9">
                        <IconPrinter className="size-4" /> Print
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <IconFilter className="size-4 opacity-70" />
                            Report Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Report Month</Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-9">
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Fiscal Year</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-9">
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </NativeSelect>
                        </div>
                        <Button
                            className="w-full gap-2"
                            onClick={loadReport}
                            disabled={isLoading}
                        >
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                            Generate Report
                        </Button>
                    </CardContent>
                </Card>

                {/* Report Table */}
                <Card className="md:col-span-3">
                    <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Leave Utilization</CardTitle>
                            <CardDescription>
                                Activity for {MONTHS.find(m => m.value === month)?.label} {year}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="font-normal">
                            {reportData.length} Records
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={reportData}
                            showColumnCustomizer={false}
                            searchKey="employeeName"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
