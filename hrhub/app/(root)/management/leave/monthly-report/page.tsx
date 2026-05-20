"use client"

import * as React from "react"
import { IconFileAnalytics, IconDownload, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { leaveService } from "@/lib/services/leave"
import { buildMonthlyLeaveReport, type MonthlyLeaveReportRow } from "@/lib/services/leave-helpers"
import { employeeService } from "@/lib/services/employee"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { useCompanyContext } from "@/components/providers/company-context"
import { LeaveCompanyBar } from "@/components/leave/leave-company-bar"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

export default function MonthlyLeaveReportPage() {
    const { activeCompanyId } = useCompanyContext()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [isLoading, setIsLoading] = React.useState(false)
    const [reportData, setReportData] = React.useState<MonthlyLeaveReportRow[]>([])

    const loadReport = React.useCallback(async () => {
        if (!activeCompanyId) return
        setIsLoading(true)
        try {
            const [apps, employees, types] = await Promise.all([
                leaveService.listLeaveApplications(activeCompanyId),
                employeeService.getEmployees(),
                leaveService.listLeaveTypes(activeCompanyId),
            ])
            setReportData(buildMonthlyLeaveReport(apps, employees, types, { year, month }))
        } catch {
            toast.error("Failed to generate leave report")
        } finally {
            setIsLoading(false)
        }
    }, [activeCompanyId, year, month])

    React.useEffect(() => {
        loadReport()
    }, [loadReport])

    const columns: ColumnDef<MonthlyLeaveReportRow>[] = [
        { accessorKey: "employeeId", header: "ID" },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.department}</span>
                </div>
            ),
        },
        { accessorKey: "sickLeave", header: "Sick" },
        { accessorKey: "casualLeave", header: "Casual" },
        { accessorKey: "earnedLeave", header: "Earned" },
        { accessorKey: "paternityLeave", header: "Paternity" },
        { accessorKey: "maternityLeave", header: "Maternity" },
        { accessorKey: "lwp", header: "LWP" },
        { accessorKey: "otherLeave", header: "Other" },
        {
            accessorKey: "totalDays",
            header: "Total",
            cell: ({ row }) => <Badge variant="secondary">{row.original.totalDays} Days</Badge>,
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <IconFileAnalytics className="size-7" /> Monthly Leave Report
                </h1>
                <p className="text-muted-foreground text-sm">Approved leave days by type</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-end">
                    <LeaveCompanyBar year={year} onYearChange={setYear} onRefresh={loadReport} isLoading={isLoading} showYear />
                    <div className="space-y-1">
                        <Label className="text-xs">Month</Label>
                        <NativeSelect value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
                            {MONTHS.map((label, i) => (
                                <option key={label} value={i + 1}>{label}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <Button onClick={loadReport} disabled={isLoading}>
                        {isLoading ? <IconLoader className="size-4 animate-spin mr-2" /> : null}
                        Generate
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Report — {MONTHS[month - 1]} {year}</CardTitle>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                        <IconDownload className="size-4" /> Print
                    </Button>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={reportData} isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>
        </div>
    )
}
