"use client"

import * as React from "react"
import { IconArrowLeft, IconChartBar, IconSearch, IconPackage, IconClipboardList } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, OrderPipelineReportRow } from "@/lib/types/merchandising"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrderSummaryPage() {
    const router = useRouter()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [pipeline, setPipeline] = React.useState<OrderPipelineReportRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [orderList, pipelineRows] = await Promise.all([
                merchandisingService.getOrders(),
                merchandisingService.getOrderPipelineReport(),
            ])
            setOrders(orderList)
            setPipeline(pipelineRows)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load order summary")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const totalQty = orders.reduce((s, o) => s + o.totalOrderQty, 0)
    const filtered = orders.filter((o) =>
        o.orderNo.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <IconArrowLeft />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Order Summary</h1>
                    <p className="text-muted-foreground text-sm">Global order analytics</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalQty.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pipeline.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconClipboardList className="size-5" /> Recent Orders
                    </CardTitle>
                    <CardDescription>Click an order for details</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4 max-w-sm">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        {filtered.map((o) => (
                            <Link
                                key={o.id}
                                href={`/merchandising/orders/details/${o.id}`}
                                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                            >
                                <div>
                                    <p className="font-medium">{o.orderNo}</p>
                                    <p className="text-xs text-muted-foreground">{o.orderStatus}</p>
                                </div>
                                <div className="text-right text-sm">
                                    <p>{o.totalOrderQty.toLocaleString()} pcs</p>
                                    <p className="text-muted-foreground">{o.currencyCode} {o.totalValue}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
