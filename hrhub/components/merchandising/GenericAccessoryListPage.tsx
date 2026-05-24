"use client"

import * as React from "react"
import {
    IconPlus,
    IconRefresh,
    IconSearch,
    IconEye,
    IconCalendar,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, Buyer } from "@/lib/types/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

export default function GenericAccessoryListPage({ title, slug }: { title: string; slug: string }) {
    const router = useRouter()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [ordersData, buyersData] = await Promise.all([
                merchandisingService.getOrders(),
                merchandisingService.getBuyers(),
            ])
            setOrders(ordersData)
            setBuyers(buyersData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load orders")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const buyerName = (buyerId: string) => buyers.find(b => b.id === buyerId)?.buyerName ?? "—"

    const columns: ColumnDef<Order>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-[10px] font-bold text-muted-foreground/60">{(row.index + 1).toString().padStart(2, "0")}</span>,
            size: 50,
        },
        {
            accessorKey: "orderNo",
            header: "Order No",
            cell: ({ row }) => <span className="font-bold">{row.getValue("orderNo")}</span>,
        },
        {
            id: "buyer",
            header: "Buyer",
            cell: ({ row }) => <span className="font-semibold">{buyerName(row.original.buyerId)}</span>,
        },
        {
            accessorKey: "orderStatus",
            header: "Status",
            cell: ({ row }) => <span className="text-xs uppercase text-muted-foreground">{row.getValue("orderStatus")}</span>,
        },
        {
            accessorKey: "totalOrderQty",
            header: () => <div className="text-right">Total Qty</div>,
            cell: ({ row }) => <div className="text-right font-bold">{row.original.totalOrderQty.toLocaleString()} PCS</div>,
        },
        {
            accessorKey: "orderDate",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconCalendar className="size-3.5" />
                    {row.original.orderDate ? format(new Date(row.original.orderDate), "dd MMM, yy") : "N/A"}
                </div>
            ),
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-xs" onClick={() => router.push(`/merchandising/accessories/${slug}/${row.original.id}`)}>
                        <IconEye className="size-3.5" /> Enter Booking
                    </Button>
                </div>
            ),
        },
    ]

    const filteredOrders = orders.filter(o =>
        o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buyerName(o.buyerId).toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-10 bg-background min-h-screen">
            <div className="flex items-center justify-between gap-4 py-4 px-6 border-b bg-card rounded-xl shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{title} Booking Orders</h1>
                    <p className="text-xs text-muted-foreground">Select an order to manage {title.toLowerCase()} bookings</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                    <Button size="sm" onClick={() => router.push("/merchandising/orders/create")}>
                        <IconPlus className="size-4 mr-1" /> Create Order
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="border-b bg-muted/30 px-6 py-4">
                        <div className="relative w-full md:w-80">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input placeholder="Search by order or buyer..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                    <div className="px-2 pb-2">
                        <DataTable
                            columns={columns}
                            data={filteredOrders}
                            isLoading={loading}
                            onRowClick={(row) => router.push(`/merchandising/accessories/${slug}/${row.id}`)}
                            showTabs={false}
                            showActions={false}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
