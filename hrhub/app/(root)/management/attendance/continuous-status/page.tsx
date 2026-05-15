"use client"

import * as React from "react"
import { IconActivity, IconInfoCircle, IconArrowLeft } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function ContinuousStatusPage() {
    const router = useRouter()
    const columns: ColumnDef<any>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "employeeName",
            header: "Employee Name",
            cell: ({ row }) => (
                <span className="font-medium text-gray-900">{row.original.employeeName}</span>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant="outline" className={cn(
                        "font-semibold px-2 py-0.5 rounded-full",
                        status === "Absent" ? "bg-red-50 text-red-600 border-red-200" : "bg-orange-50 text-orange-600 border-orange-200"
                    )}>
                        {status}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "consecutiveDays",
            header: "Consecutive Days",
            cell: ({ row }) => (
                <span className="text-sm font-medium">{row.original.consecutiveDays} days</span>
            )
        },
        {
            accessorKey: "since",
            header: "Effective From",
            cell: ({ row }) => (
                <span className="text-sm text-gray-500">{row.original.since}</span>
            )
        },
    ]

    const data = [
        { id: "1", employeeName: "Alice Wonderland", status: "Absent", consecutiveDays: 3, since: "18 May 2024" },
        { id: "2", employeeName: "Bob Builder", status: "Late", consecutiveDays: 4, since: "17 May 2024" },
    ]

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Persistence Pulse</h1>
                        <p className="text-sm text-gray-500">Monitoring repeated absence and punctuality patterns</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border shadow-none">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Critical Employees</p>
                            <h3 className="text-2xl font-bold mt-1">2</h3>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-400">
                            <IconActivity size={24} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-none">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Maximum Streak</p>
                            <h3 className="text-2xl font-bold mt-1 text-red-600">4 Days</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-red-400">
                            <IconInfoCircle size={24} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-none overflow-hidden">
                <CardHeader className="bg-gray-50 border-b py-4">
                    <CardTitle className="text-base font-semibold">Continuous Patterns</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={data}
                        showColumnCustomizer={false}
                        showActions={false}
                        showTabs={false}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
