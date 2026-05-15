"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// IconRoll might not exist in standard tabler set used here, fallback to generic
import { IconCircleDashed } from "@tabler/icons-react"

type FabricRoll = {
    id: string
    fabricType: string
    color: string
    pattern: string
    width: string
    length: number
    status: string
}

const columns: ColumnDef<FabricRoll>[] = [
    {
        accessorKey: "id",
        header: "Roll ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
    },
    {
        accessorKey: "fabricType",
        header: "Fabric Type",
    },
    {
        accessorKey: "color",
        header: "Color",
    },
    {
        accessorKey: "width",
        header: "Width",
    },
    {
        accessorKey: "length",
        header: "Available Length",
        cell: ({ row }) => <div>{row.getValue("length")} yds</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "In Stock" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

const data: FabricRoll[] = [
    { id: "RL-1001", fabricType: "100% Cotton", color: "White", pattern: "Solid", width: '60"', length: 120, status: "In Stock" },
    { id: "RL-1002", fabricType: "Denim", color: "Indigo", pattern: "Twill", width: '58"', length: 85, status: "Reserved" },
]

export default function FabricRollsPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconCircleDashed className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Fabric Rolls</h1>
                    <p className="text-sm text-muted-foreground">
                        Inventory of fabric rolls available for cutting.
                    </p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Roll"
                onAddClick={() => toast.info("Add Roll clicked")}
                onEditClick={(row) => toast.info(`Edit ${row.id}`)}
                onDelete={(row) => toast.success(`Deleted ${row.id}`)}
                showTabs={true}
            />
        </div>
    )
}
