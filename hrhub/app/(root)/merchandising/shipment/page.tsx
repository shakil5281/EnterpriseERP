"use client"

import * as React from "react"
import {
    IconTruck,
    IconPlus,
    IconRefresh,
    IconMapPin,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, ShipmentPlan } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function ShipmentPage() {
    const { activeCompanyId } = useCompanyContext()
    const [plans, setPlans] = React.useState<ShipmentPlan[]>([])
    const [orders, setOrders] = React.useState<Order[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const [planRows, orderRows] = await Promise.all([
                merchandisingService.getShipmentPlans(activeCompanyId),
                merchandisingService.getOrders(activeCompanyId),
            ])
            setPlans(planRows)
            setOrders(orderRows)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load shipment plans")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const orderNo = (orderId: string) => orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8)

    const columns: ColumnDef<ShipmentPlan>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            id: "orderNo",
            header: "Order",
            cell: ({ row }) => <span className="font-bold text-indigo-600">{orderNo(row.original.orderId)}</span>,
        },
        {
            accessorKey: "plannedShipmentDate",
            header: "Planned Date",
            cell: ({ row }) => (
                <span className="text-xs font-bold text-muted-foreground uppercase">
                    {format(new Date(row.original.plannedShipmentDate), "MMM dd, yyyy")}
                </span>
            ),
        },
        {
            id: "destination",
            header: "Destination",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconMapPin className="size-3.5 text-muted-foreground/60" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                        {row.original.destination ?? "TBD"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "plannedQty",
            header: "Quantity",
            cell: ({ row }) => (
                <span className="font-bold tabular-nums">{row.original.plannedQty.toLocaleString()} PCS</span>
            ),
        },
        {
            accessorKey: "shipmentMode",
            header: "Mode",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {row.original.shipmentMode ?? "Sea"}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge className="text-[10px] font-bold uppercase border-none bg-muted text-foreground">
                    {row.original.status}
                </Badge>
            ),
        },
    ]

    const totalQty = plans.reduce((acc, p) => acc + p.plannedQty, 0)

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Shipment Sheet</h1>
                    <p className="text-sm text-muted-foreground font-medium">Consignment planning and logistics tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-9 w-9 border border-border rounded-lg" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Shipment Plans" value={plans.length.toString()} icon={IconTruck} />
                <StatCard title="Planned Qty" value={totalQty.toLocaleString()} icon={IconPlus} />
                <StatCard title="Orders Linked" value={new Set(plans.map((p) => p.orderId)).size.toString()} icon={IconMapPin} />
            </div>

            <DataTable
                columns={columns}
                data={plans}
                isLoading={loading}
                searchKey="status"
                showTabs={false}
                showActions={false}
                showColumnCustomizer={true}
            />
        </div>
    )
}

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <div className="border border-border bg-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Icon className="size-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                <h3 className="text-lg font-bold">{value}</h3>
            </div>
        </div>
    )
}
