"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { IconLayersDifference, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

type SpreadingRecord = {
    id: string
    layNumber: string
    markerId: string
    fabricRollId: string
    layerLength: number
    plies: number
    totalFabricUsed: number
    status: string
    table: string
}

const columns: ColumnDef<SpreadingRecord>[] = [
    {
        accessorKey: "layNumber",
        header: "Lay #",
        cell: ({ row }) => <div className="font-medium">{row.getValue("layNumber")}</div>,
    },
    {
        accessorKey: "markerId",
        header: "Marker ID",
    },
    {
        accessorKey: "fabricRollId",
        header: "Roll ID",
    },
    {
        accessorKey: "table",
        header: "Table No",
    },
    {
        accessorKey: "layerLength",
        header: "Length (yds)",
    },
    {
        accessorKey: "plies",
        header: "No. of Plies",
    },
    {
        accessorKey: "totalFabricUsed",
        header: "Total Used (yds)",
        cell: ({ row }) => <div className="font-bold">{row.getValue("totalFabricUsed")}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Completed" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

const data: SpreadingRecord[] = [
    {
        id: "1",
        layNumber: "L-101",
        markerId: "MK-5001",
        fabricRollId: "RL-1001",
        layerLength: 6.5,
        plies: 50,
        totalFabricUsed: 325,
        status: "Completed",
        table: "Table-01"
    },
    {
        id: "2",
        layNumber: "L-102",
        markerId: "MK-5002",
        fabricRollId: "RL-1004",
        layerLength: 7.2,
        plies: 20,
        totalFabricUsed: 144,
        status: "In Progress",
        table: "Table-02"
    },
]

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconActivity, IconBoxSeam, IconCheck } from "@tabler/icons-react"

export default function SpreadingPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconLayersDifference className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Spreading / Lay</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage fabric spreading, lay entries, and ply tracking.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 px-4 lg:px-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Lays</CardTitle>
                        <IconActivity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 from last hour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Fabric Used</CardTitle>
                        <IconBoxSeam className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,250 yds</div>
                        <p className="text-xs text-muted-foreground">+15% from yesterday</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Plies</CardTitle>
                        <IconCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-muted-foreground">Target: 50</p>
                    </CardContent>
                </Card>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="New Lay"
                onAddClick={() => toast.info("Create New Lay clicked")}
                onEditClick={(row) => toast.info(`Edit ${row.layNumber}`)}
                onDelete={(row) => toast.success(`Deleted ${row.layNumber}`)}
                showTabs={true}
                searchKey="layNumber"
                filters={[
                    {
                        columnId: "status",
                        title: "Status",
                        options: [
                            { label: "Completed", value: "Completed" },
                            { label: "In Progress", value: "In Progress" },
                        ]
                    }
                ]}
            />
        </div>
    )
}
