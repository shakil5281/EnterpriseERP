"use client"

import * as React from "react"
import { IconRefresh, IconSearch, IconChevronRight } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order } from "@/lib/types/merchandising"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AccessoriesSummaryPage() {
    const router = useRouter()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders()
            setOrders(data)
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

    const columns: ColumnDef<Order>[] = [
        { accessorKey: "orderNo", header: "Order No", meta: { className: "py-3" } },
        { accessorKey: "orderStatus", header: "Status", meta: { className: "py-3" } },
        {
            accessorKey: "totalOrderQty",
            header: "Quantity",
            meta: { className: "py-3" },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/merchandising/accessories/summary/details/${row.original.id}`)}
                >
                    View <IconChevronRight className="ml-1 size-4" />
                </Button>
            ),
        },
    ]

    const filtered = orders.filter((o) =>
        o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Accessories Summary</CardTitle>
                        <CardDescription>Order-wise material booking overview</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={loading ? "animate-spin" : ""} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4 max-w-sm">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DataTable columns={columns} data={filtered} />
                </CardContent>
            </Card>
        </div>
    )
}
