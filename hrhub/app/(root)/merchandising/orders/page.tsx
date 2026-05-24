"use client"

import * as React from "react"
import {
    IconFileDescription,
    IconPlus,
    IconCalendar,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconEye,
    IconDownload,
    IconUpload,
    IconFilter,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, Buyer, Style } from "@/lib/types/merchandising"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [styles, setStyles] = React.useState<Style[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filters, setFilters] = React.useState({
        orderNo: "",
        buyerId: "all",
        status: "all",
        fromDate: undefined as Date | undefined,
        toDate: undefined as Date | undefined,
        minQty: "",
        maxQty: "",
    })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const status = filters.status === "all" ? undefined : filters.status
            const [ordersData, buyersData, stylesData] = await Promise.all([
                merchandisingService.getOrders(undefined, undefined, status),
                merchandisingService.getBuyers(),
                merchandisingService.getStyles(),
            ])
            setOrders(ordersData)
            setBuyers(buyersData)
            setStyles(stylesData)
        } catch (error) {
            console.error("Order fetch error:", error)
            toast.error("Failed to load orders")
        } finally {
            setLoading(false)
        }
    }, [filters.status])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const buyerName = (buyerId: string) => buyers.find(b => b.id === buyerId)?.buyerName ?? "—"
    const styleNo = (styleId: string) => styles.find(s => s.id === styleId)?.styleNo ?? "—"

    const filteredOrders = React.useMemo(() => {
        return orders.filter((order) => {
            const orderNo = order.orderNo.toLowerCase()
            const orderDate = order.orderDate ? new Date(order.orderDate) : null
            const matchesOrderNo = !filters.orderNo || orderNo.includes(filters.orderNo.toLowerCase())
            const matchesBuyer = filters.buyerId === "all" || order.buyerId === filters.buyerId
            const fromDate = filters.fromDate ?? null
            const toDate = filters.toDate ?? null
            const matchesFromDate = !fromDate || (orderDate !== null && orderDate >= fromDate)
            const matchesToDate = !toDate || (orderDate !== null && orderDate <= toDate)
            const minQty = filters.minQty ? Number(filters.minQty) : null
            const maxQty = filters.maxQty ? Number(filters.maxQty) : null
            const matchesMinQty = minQty === null || order.totalOrderQty >= minQty
            const matchesMaxQty = maxQty === null || order.totalOrderQty <= maxQty
            return matchesOrderNo && matchesBuyer && matchesFromDate && matchesToDate && matchesMinQty && matchesMaxQty
        })
    }, [orders, filters])

    const handleCancel = async (id: string) => {
        if (!confirm("Cancel this order?")) return
        try {
            await merchandisingService.cancelOrder(id)
            setOrders(prev => prev.filter(o => o.id !== id))
            toast.success("Order cancelled")
        } catch (error) {
            console.error(error)
            toast.error("Cancel failed")
        }
    }

    const handleExport = async (id: string) => {
        try {
            toast.info("Exporting...")
            await merchandisingService.exportOrder(id)
            toast.success("Export started")
        } catch {
            toast.error("Export failed")
        }
    }

    const columns = React.useMemo<ColumnDef<Order>[]>(() => [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => (
                <div data-no-row-click="true">
                    <span className="text-[10px] font-bold text-muted-foreground/60">{(row.index + 1).toString().padStart(2, "0")}</span>
                </div>
            ),
            size: 50,
        },
        {
            accessorKey: "orderNo",
            header: "Order No",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.getValue("orderNo")}</span>
                    <span className="text-[10px] text-muted-foreground">{styleNo(row.original.styleId)}</span>
                </div>
            )
        },
        {
            id: "buyer",
            header: "Buyer",
            cell: ({ row }) => <span className="font-semibold">{buyerName(row.original.buyerId)}</span>
        },
        {
            accessorKey: "orderStatus",
            header: "Status",
            cell: ({ row }) => <Badge variant="outline" className="text-[10px] uppercase">{row.getValue("orderStatus")}</Badge>
        },
        {
            accessorKey: "totalOrderQty",
            header: () => <div className="text-right">Qty</div>,
            cell: ({ row }) => (
                <div className="text-right font-bold">{row.original.totalOrderQty.toLocaleString()} <span className="text-[10px] text-muted-foreground">PCS</span></div>
            )
        },
        {
            accessorKey: "totalValue",
            header: () => <div className="text-right">Value</div>,
            cell: ({ row }) => (
                <div className="text-right text-xs">{row.original.currencyCode} {row.original.totalValue.toLocaleString()}</div>
            )
        },
        {
            accessorKey: "orderDate",
            header: "Date",
            cell: ({ row }) => {
                const d = new Date(row.getValue("orderDate") as string)
                return (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconCalendar className="size-3.5" />
                        {isNaN(d.getTime()) ? "N/A" : format(d, "dd MMM, yy")}
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex justify-end" data-no-row-click="true">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <IconDotsVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/merchandising/orders/details/${order.id}`); }}>
                                    <IconEye className="size-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/merchandising/orders/edit/${order.id}`); }}>
                                    <IconEdit className="size-4 mr-2" /> Edit Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExport(order.id); }}>
                                    <IconDownload className="size-4 mr-2" /> Export
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }} className="text-red-500">
                                    <IconTrash className="size-4 mr-2" /> Cancel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        },
    ], [router, buyers, styles])

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Merchandising Orders</h1>
                    <p className="text-sm text-muted-foreground">Manage production orders and breakdowns</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.push("/merchandising/orders/summary")}>Analytics</Button>
                    <Button variant="outline" onClick={() => router.push("/merchandising/orders/import")}>
                        <IconUpload className="size-4 mr-2" /> Import
                    </Button>
                    <Button onClick={() => router.push("/merchandising/orders/create")}>
                        <IconPlus className="size-4 mr-2" /> Create Order
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconFilter className="size-4 text-primary" /> Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input placeholder="Order No" value={filters.orderNo} onChange={(e) => setFilters(p => ({ ...p, orderNo: e.target.value }))} />
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filters.buyerId} onChange={(e) => setFilters(p => ({ ...p, buyerId: e.target.value }))}>
                            <option value="all">All Buyers</option>
                            {buyers.map(b => <option key={b.id} value={b.id}>{b.buyerName}</option>)}
                        </select>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}>
                            <option value="all">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start font-normal">
                                    <IconCalendar className="mr-2 size-4" />
                                    {filters.fromDate ? format(filters.fromDate, "dd MMM, yyyy") : "From Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.fromDate} onSelect={(date) => setFilters(p => ({ ...p, fromDate: date }))} /></PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start font-normal">
                                    <IconCalendar className="mr-2 size-4" />
                                    {filters.toDate ? format(filters.toDate, "dd MMM, yyyy") : "To Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.toDate} onSelect={(date) => setFilters(p => ({ ...p, toDate: date }))} /></PopoverContent>
                        </Popover>
                        <Input type="number" placeholder="Min Qty" value={filters.minQty} onChange={(e) => setFilters(p => ({ ...p, minQty: e.target.value }))} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Showing {filteredOrders.length} of {orders.length} orders</p>
                </CardContent>
            </Card>

            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                <DataTable
                    data={filteredOrders}
                    columns={columns}
                    isLoading={loading}
                    onRowClick={(row) => router.push(`/merchandising/orders/details/${row.id}`)}
                    enableSelection={true}
                    enableDrag={true}
                />
            </div>
        </div>
    )
}
