"use client"

import * as React from "react"
import { IconTruckDelivery, IconPlus, IconFileInvoice, IconPrinter } from "@tabler/icons-react"
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
import { GrnForm } from "@/components/store/grn-form"

type GrnRecord = {
    id: string
    grnNo: string
    date: string
    supplier: string
    poReference: string
    itemsCount: number
    totalAmount: number
    status: string
}

const columns: ColumnDef<GrnRecord>[] = [
    {
        accessorKey: "grnNo",
        header: "GRN No",
        cell: ({ row }) => <div className="font-mono font-bold">{row.getValue("grnNo")}</div>,
    },
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "supplier",
        header: "Supplier",
    },
    {
        accessorKey: "poReference",
        header: "Ref PO/Invoice",
    },
    {
        accessorKey: "itemsCount",
        header: "Items",
        cell: ({ row }) => <div className="text-center">{row.getValue("itemsCount")}</div>,
    },
    {
        accessorKey: "totalAmount",
        header: "Amount (৳)",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"))
            const formatted = new Intl.NumberFormat("en-BD", {
                style: "currency",
                currency: "BDT",
                minimumFractionDigits: 0,
            }).format(amount)
            return <div className="font-bold text-right">{formatted}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" title="Print GRN">
                    <IconPrinter className="size-4 text-muted-foreground" />
                </Button>
            </div>
        )
    }
]

const initialData: GrnRecord[] = [
    { id: "1", grnNo: "GRN-2026-001", date: "Jan 30, 2026", supplier: "TexFab Suppliers Ltd", poReference: "PO-098", itemsCount: 3, totalAmount: 145000, status: "Received" },
    { id: "2", grnNo: "GRN-2026-002", date: "Jan 28, 2026", supplier: "Global Chemicals", poReference: "INV-5542", itemsCount: 1, totalAmount: 25000, status: "Received" },
]

export default function GrnPage() {
    const [data, setData] = React.useState<GrnRecord[]>(initialData)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    const handleAddClick = () => {
        setIsSheetOpen(true)
    }

    const handleFormSubmit = (values: any) => {
        const newRecord: GrnRecord = {
            id: Math.random().toString(),
            grnNo: `GRN-2026-${Math.floor(Math.random() * 1000)}`,
            date: "Jan 30, 2026", // Mock date format
            supplier: values.supplier,
            poReference: values.poReference || "-",
            itemsCount: values.items.length,
            totalAmount: values.items.reduce((sum: number, i: any) => sum + (i.quantity * i.rate), 0),
            status: "Received"
        }
        setData(prev => [newRecord, ...prev])
        toast.success("GRN created successfully")
        setIsSheetOpen(false)
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconTruckDelivery className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Goods Receive Notes (GRN)</h1>
                        <p className="text-sm text-muted-foreground">
                            Record and track incoming inventory and materials.
                        </p>
                    </div>
                </div>
                <Button onClick={handleAddClick}>
                    <IconPlus className="mr-2 size-4" />
                    Create GRN
                </Button>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Create GRN"
                onAddClick={handleAddClick}
                searchKey="supplier"
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[900px] w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Create New GRN</SheetTitle>
                        <SheetDescription>
                            Enter details of the received goods.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <GrnForm
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
