"use client"

import * as React from "react"
import {
    IconCurrencyDollar,
    IconPlus,
    IconRefresh,
    IconBuildingBank,
    IconCreditCard,
    IconReceipt2,
    IconHistory
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order } from "@/lib/types/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentSheetPage() {
    const [orders, setOrders] = React.useState<Order[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load payment ledger")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const columns: ColumnDef<Order>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground font-medium">{row.index + 1}</span>,
        },
        {
            id: "node",
            header: "Financial Node",
            cell: ({ row }) => <span className="font-bold tracking-tight text-foreground uppercase">RE-INV/2025/{row.index + 142}</span>
        },
        {
            id: "styleRef",
            accessorKey: "orderNo",
            header: "Order Ref",
            cell: ({ row }) => <span className="font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-2">{row.original.orderNo}</span>
        },
        {
            id: "bank",
            header: "Bank Institution",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconBuildingBank className="size-3.5 text-muted-foreground/60" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">HSBC Global Node</span>
                </div>
            )
        },
        {
            id: "value",
            header: "Invoice Value",
            cell: ({ row }) => <span className="font-bold text-foreground tabular-nums">${row.original.totalValue.toLocaleString()}</span>
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.index % 3 === 0 ? "Realized" : row.index % 3 === 1 ? "Partial" : "In-Transit"
                const colorMap: Record<string, string> = {
                    "Realized": "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                    "Partial": "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                    "In-Transit": "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                }
                return (
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
                        colorMap[status as keyof typeof colorMap]
                    )}>
                        {status}
                    </div>
                )
            }
        },
        {
            id: "realized",
            header: "Realized Funds",
            cell: ({ row }) => (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ${((row.index % 3 === 0 ? row.original.totalOrderQty * 8.5 : row.original.totalOrderQty * 4.2)).toLocaleString()}
                </span>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Payment Sheet</h1>
                    <p className="text-sm text-muted-foreground font-medium">Export realization, financial ledger and L/C tracking</p>
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
                        New Transaction
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Realization" value="$450.2k" icon={IconBuildingBank} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KPICard title="L/C Liability" value="$120.5k" icon={IconCreditCard} color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400" />
                <KPICard title="Incentives" value="$42.5k" icon={IconReceipt2} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" />
                <KPICard title="Avg Days" value="18 Days" icon={IconHistory} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" />
            </div>

            {/* Content Table */}
            <div className="flex-1">
                <DataTable
                    columns={columns}
                    data={orders}
                    isLoading={loading}
                    searchKey="styleRef"
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

