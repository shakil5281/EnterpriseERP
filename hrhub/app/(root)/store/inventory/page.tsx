"use client"

import * as React from "react"
import { IconBoxSeam } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type InventoryItem = {
    id: string
    name: string
    category: string
    location: string
    quantity: number
    unit: string
    reorderLevel: number
    status: string
}

const columns: ColumnDef<InventoryItem>[] = [
    {
        accessorKey: "id",
        header: "Item ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
    },
    {
        accessorKey: "name",
        header: "Item Name",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "location",
        header: "Location",
    },
    {
        accessorKey: "quantity",
        header: "Stock",
        cell: ({ row }) => <div>{row.getValue("quantity")} {row.original.unit}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "In Stock" ? "default" : status === "Low Stock" ? "destructive" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

const data: InventoryItem[] = [
    { id: "ITM-001", name: "Sewing Thread - White", category: "Consumables", location: "Shelf A-1", quantity: 500, unit: "spools", reorderLevel: 50, status: "In Stock" },
    { id: "ITM-002", name: "Button - 15mm Plastic", category: "Accessories", location: "Bin B-4", quantity: 40, unit: "gross", reorderLevel: 100, status: "Low Stock" },
]

export default function InventoryPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconBoxSeam className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Stock List</h1>
                    <p className="text-sm text-muted-foreground">
                        Master inventory of all materials and assets.
                    </p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Item"
                onAddClick={() => toast.info("Add Item clicked")}
                onEditClick={(row) => toast.info(`Edit ${row.name}`)}
                onDelete={(row) => toast.success(`Deleted ${row.name}`)}
                showTabs={true}
            />
        </div>
    )
}
