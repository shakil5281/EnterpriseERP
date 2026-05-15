"use client"

import * as React from "react"
import { IconTruckDelivery } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type MaterialReceipt = {
    id: string
    supplier: string
    date: string
    itemsCount: number
    totalValue: number
    status: string
}

const columns: ColumnDef<MaterialReceipt>[] = [
    {
        accessorKey: "id",
        header: "Receipt ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
    },
    {
        accessorKey: "supplier",
        header: "Supplier",
    },
    {
        accessorKey: "date",
        header: "Date Received",
    },
    {
        accessorKey: "itemsCount",
        header: "Items",
    },
    {
        accessorKey: "totalValue",
        header: "Total Value",
        cell: ({ row }) => <div>${(row.getValue("totalValue") as number).toLocaleString()}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Verified" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

const data: MaterialReceipt[] = [
    { id: "RCV-2001", supplier: "Global Fabrics Ltd.", date: "Jan 28, 2026", itemsCount: 5, totalValue: 2500, status: "Verified" },
    { id: "RCV-2002", supplier: "Accessory World", date: "Jan 29, 2026", itemsCount: 12, totalValue: 450, status: "Pending Inspection" },
]

export default function MaterialReceivePage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconTruckDelivery className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Material Receive</h1>
                    <p className="text-sm text-muted-foreground">
                        Log and verify incoming material shipments.
                    </p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="New Receipt"
                onAddClick={() => toast.info("New Receipt clicked")}
                onEditClick={(row) => toast.info(`View ${row.id}`)}
                onDelete={(row) => toast.success(`Deleted ${row.id}`)}
                showTabs={true}
            />
        </div>
    )
}
