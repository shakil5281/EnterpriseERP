"use client"

import * as React from "react"
import { IconReceiptTax } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type ProfitLoss = {
    id: string
    period: string
    revenue: number
    cost: number
    profit: number
    margin: number
}

const columns: ColumnDef<ProfitLoss>[] = [
    {
        accessorKey: "period",
        header: "Period",
    },
    {
        accessorKey: "revenue",
        header: "Revenue",
        cell: ({ row }) => <div className="font-medium">${(row.getValue("revenue") as number).toLocaleString()}</div>,
    },
    {
        accessorKey: "cost",
        header: "Operational Cost",
        cell: ({ row }) => <div className="text-red-500">${(row.getValue("cost") as number).toLocaleString()}</div>,
    },
    {
        accessorKey: "profit",
        header: "Net Profit",
        cell: ({ row }) => <div className="font-bold text-green-600">${(row.getValue("profit") as number).toLocaleString()}</div>,
    },
    {
        accessorKey: "margin",
        header: "Margin (%)",
        cell: ({ row }) => <div>{row.getValue("margin")}%</div>,
    },
]

const data: ProfitLoss[] = [
    { id: "1", period: "Jan 2026", revenue: 500000, cost: 350000, profit: 150000, margin: 30 },
    { id: "2", period: "Dec 2025", revenue: 480000, cost: 340000, profit: 140000, margin: 29 },
]

export default function ProfitLossPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-muted/30 min-h-screen">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconReceiptTax className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Profit & Loss</h1>
                    <p className="text-sm text-muted-foreground">
                        Financial performance of production operations.
                    </p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Download Statement"
                onAddClick={() => toast.info("Download Statement clicked")}
                onEditClick={(row) => toast.info(`View details for ${row.period}`)}
                onDelete={(row) => toast.success(`Deleted ${row.period}`)}
                showTabs={true}
            />
        </div>
    )
}
