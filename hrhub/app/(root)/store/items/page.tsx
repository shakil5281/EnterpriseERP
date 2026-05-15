"use client"

import * as React from "react"
import { IconBoxSeam, IconPlus, IconFilter } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { ItemForm } from "@/components/store/item-form"

type ItemMaster = {
    id: string
    code: string
    name: string
    category: string
    unit: string
    currentStock: number
    minStock: number
    status: string
}

const columns: ColumnDef<ItemMaster>[] = [
    {
        accessorKey: "code",
        header: "Item Code",
        cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("code")}</div>,
    },
    {
        accessorKey: "name",
        header: "Item Name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("unit")}</div>,
    },
    {
        accessorKey: "currentStock",
        header: "Current Stock",
        cell: ({ row }) => {
            const stock = row.getValue("currentStock") as number
            // Highlight low stock if needed logic here, but keeping simple for now
            return <div className="font-bold">{stock}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Active" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

const initialData: ItemMaster[] = [
    { id: "1", code: "RM-001", name: "Cotton Yarn 80/1", category: "Raw Material", unit: "kg", currentStock: 5000, minStock: 1000, status: "Active" },
    { id: "2", code: "RM-002", name: "Polyester Fabric", category: "Raw Material", unit: "yds", currentStock: 12000, minStock: 2000, status: "Active" },
    { id: "3", code: "ACC-001", name: "Plastic Buttons 14L", category: "Accessories", unit: "pcs", currentStock: 50000, minStock: 10000, status: "Active" },
    { id: "4", code: "ACC-002", name: "YKK Zipper 5 inch", category: "Accessories", unit: "pcs", currentStock: 4500, minStock: 500, status: "Active" },
    { id: "5", code: "CHEM-001", name: "Reactive Red Dye", category: "Chemicals", unit: "kg", currentStock: 450, minStock: 100, status: "Active" },
    { id: "6", code: "SPR-001", name: "Needle 14/90", category: "Spares", unit: "box", currentStock: 50, minStock: 10, status: "Active" },
    { id: "7", code: "PKG-001", name: "Poly Bag 12x18", category: "Packaging", unit: "pcs", currentStock: 25000, minStock: 5000, status: "Active" },
]

export default function ItemsMasterPage() {
    const [data, setData] = React.useState<ItemMaster[]>(initialData)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<ItemMaster | null>(null)

    const handleAddClick = () => {
        setSelectedItem(null)
        setIsSheetOpen(true)
    }

    const handleEditClick = (item: ItemMaster) => {
        setSelectedItem(item)
        setIsSheetOpen(true)
    }

    const handleDeleteClick = (item: ItemMaster) => {
        setData(prev => prev.filter(i => i.id !== item.id))
        toast.success("Item deleted successfully")
    }

    const handleFormSubmit = (values: any) => {
        if (selectedItem) {
            setData(prev => prev.map(item => item.id === selectedItem.id ? { ...values, id: item.id, currentStock: item.currentStock } : item))
            toast.success("Item updated successfully")
        } else {
            const newItem = {
                ...values,
                id: Math.random().toString(36).substr(2, 9),
                currentStock: 0, // New items start with 0 stock
            }
            setData(prev => [newItem, ...prev])
            toast.success("Item added successfully")
        }
        setIsSheetOpen(false)
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconBoxSeam className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Items Master</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage inventory items, codes, and stock levels.
                        </p>
                    </div>
                </div>
                <Button onClick={handleAddClick}>
                    <IconPlus className="mr-2 size-4" />
                    Add New Item
                </Button>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Item"
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDelete={handleDeleteClick}
                searchKey="name"
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{selectedItem ? "Edit Item" : "Create New Item"}</SheetTitle>
                        <SheetDescription>
                            Define item details and properties.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <ItemForm
                            initialData={selectedItem || undefined}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
