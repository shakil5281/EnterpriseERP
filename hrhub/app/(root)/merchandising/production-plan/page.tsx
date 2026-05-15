"use client"

import * as React from "react"
import {
    IconPlus,
    IconRefresh,
    IconChartBar,
    IconUserPin,
    IconHierarchy,
    IconProgress
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, StyleOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export default function ProductionPlanningPage() {
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load production orders")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const columns: ColumnDef<StyleOrder>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground font-medium">{row.index + 1}</span>,
        },
        {
            id: "styleNumber",
            accessorKey: "style.styleNumber",
            header: "Style Number",
            cell: ({ row }) => <span className="font-bold tracking-tight text-foreground uppercase">{row.original.style?.styleNumber || "N/A"}</span>
        },
        {
            accessorKey: "poNumber",
            header: "PO Number",
            cell: ({ row }) => <span className="font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-2">{row.original.poNumber}</span>
        },
        {
            accessorKey: "orderQuantity",
            header: "Target Qty",
            cell: ({ row }) => <span className="font-bold text-foreground tabular-nums">{row.original.orderQuantity.toLocaleString()} PCS</span>
        },
        {
            id: "line",
            header: "Line Node",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border inline-block uppercase">
                    Line {row.index % 5 + 1}
                </div>
            )
        },
        {
            id: "dates",
            header: "Timeline",
            cell: ({ row }) => (
                <div className="flex flex-col text-[10px] font-bold gap-0.5">
                    <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Start: 2026-03-14</span>
                    <span className="text-rose-600 dark:text-rose-400 uppercase tracking-tighter">End: 2026-04-08</span>
                </div>
            )
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-tight">
                    Active
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Production Planning</h1>
                    <p className="text-sm text-muted-foreground font-medium">Allocation and factory throughput management for active orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 border border-border rounded-lg text-muted-foreground"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="h-10 px-6 font-semibold shadow-sm shadow-indigo-500/20 text-white">
                        <IconPlus className="size-4 mr-2" />
                        New Plan
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Active Lines" value="12" icon={IconHierarchy} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" />
                <KPICard title="Total Target" value="450k" icon={IconChartBar} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KPICard title="Capacity" value="18k" icon={IconUserPin} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" />
                <KPICard title="Avg OEE" value="72%" icon={IconProgress} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" />
            </div>

            {/* Content Table */}
            <div className="flex-1">
                <DataTable
                    columns={columns}
                    data={orders}
                    isLoading={loading}
                    searchKey="styleNumber"
                    showTabs={false}
                    showActions={true}
                    showColumnCustomizer={true}
                />
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-border bg-card shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className="text-lg font-bold text-foreground">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
