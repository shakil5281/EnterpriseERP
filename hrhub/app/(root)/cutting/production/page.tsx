"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { IconScissors, IconPlus } from "@tabler/icons-react"

type CuttingProduction = {
    id: string
    date: string
    shift: string
    cuttingNumber: string
    styleNo: string
    orderNo: string
    totalParts: number
    rejectParts: number
    supervisor: string
    status: string
}

const columns: ColumnDef<CuttingProduction>[] = [
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "cuttingNumber",
        header: "Cut No",
        cell: ({ row }) => <div className="font-medium">{row.getValue("cuttingNumber")}</div>,
    },
    {
        accessorKey: "styleNo",
        header: "Style",
    },
    {
        accessorKey: "orderNo",
        header: "PO #",
    },
    {
        accessorKey: "totalParts",
        header: "Total Parts",
        cell: ({ row }) => <div className="font-bold">{row.getValue("totalParts")}</div>,
    },
    {
        accessorKey: "rejectParts",
        header: "Rejects",
        cell: ({ row }) => <div className="text-red-500">{row.getValue("rejectParts")}</div>,
    },
    {
        accessorKey: "supervisor",
        header: "Supervisor",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Approved" ? "default" : status === "Pending" ? "secondary" : "destructive"}>
                    {status}
                </Badge>
            )
        },
    },
]

const data: CuttingProduction[] = [
    {
        id: "1",
        date: "2023-10-25",
        shift: "A",
        cuttingNumber: "CN-2001",
        styleNo: "ST-5050",
        orderNo: "PO-9988",
        totalParts: 1200,
        rejectParts: 5,
        supervisor: "John Doe",
        status: "Approved"
    },
    {
        id: "2",
        date: "2023-10-25",
        shift: "B",
        cuttingNumber: "CN-2002",
        styleNo: "ST-5051",
        orderNo: "PO-9989",
        totalParts: 850,
        rejectParts: 2,
        supervisor: "Mike Smith",
        status: "Pending"
    },
]

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconActivity, IconAlertCircle, IconCheck } from "@tabler/icons-react"

export default function CuttingProductionPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconScissors className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Production Entry</h1>
                    <p className="text-sm text-muted-foreground">
                        Daily cutting production logs and output tracking.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 px-4 lg:px-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Output</CardTitle>
                        <IconActivity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2,050</div>
                        <p className="text-xs text-muted-foreground">Parts cut today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejects</CardTitle>
                        <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">7</div>
                        <p className="text-xs text-muted-foreground text-red-500">0.3% Defect Rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                        <IconCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92%</div>
                        <p className="text-xs text-muted-foreground">Above target</p>
                    </CardContent>
                </Card>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Production"
                onAddClick={() => toast.info("Add Production clicked")}
                onEditClick={(row) => toast.info(`Edit ${row.cuttingNumber}`)}
                onDelete={(row) => toast.success(`Deleted ${row.cuttingNumber}`)}
                showTabs={true}
                searchKey="styleNo"
                filters={[
                    {
                        columnId: "status",
                        title: "Status",
                        options: [
                            { label: "Approved", value: "Approved" },
                            { label: "Pending", value: "Pending" },
                        ]
                    }
                ]}
            />
        </div>
    )
}
