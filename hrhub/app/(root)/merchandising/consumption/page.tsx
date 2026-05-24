"use client"

import * as React from "react"
import {
    IconScale,
    IconSearch,
    IconLoader2,
    IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { NativeSelect } from "@/components/ui/native-select"
import { merchandisingService } from "@/lib/services/merchandising"
import type { BomItem, Order } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"

export default function ConsumptionPage() {
    const { activeCompanyId } = useCompanyContext()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [selectedOrderId, setSelectedOrderId] = React.useState("")
    const [bomItems, setBomItems] = React.useState<BomItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchOrders = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(activeCompanyId)
            setOrders(data)
            if (!selectedOrderId && data.length > 0) setSelectedOrderId(data[0].id)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load orders")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId, selectedOrderId])

    const fetchBom = React.useCallback(async (orderId: string) => {
        if (!orderId) return
        try {
            setLoading(true)
            const data = await merchandisingService.getBomItems(orderId)
            setBomItems(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load BOM consumption")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    React.useEffect(() => {
        if (selectedOrderId) fetchBom(selectedOrderId)
    }, [selectedOrderId, fetchBom])

    const filtered = bomItems.filter(
        (item) =>
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemType.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const fabricItems = filtered.filter((i) => i.itemType === "Fabric")
    const trimItems = filtered.filter((i) => i.itemType !== "Fabric")
    const selectedOrder = orders.find((o) => o.id === selectedOrderId)

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconScale className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Consumption Logic</h1>
                        <p className="text-muted-foreground text-sm">BOM-based fabric and trim requirements</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <NativeSelect
                        className="h-9 w-56"
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                    >
                        <option value="">Select order</option>
                        {orders.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.orderNo}
                            </option>
                        ))}
                    </NativeSelect>
                    <Button size="sm" className="gap-2 font-bold" onClick={() => fetchBom(selectedOrderId)}>
                        <IconRefresh className="size-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
                <ConsumptionTable
                    title="Fabric Consumption"
                    description={selectedOrder?.orderNo ?? ""}
                    items={fabricItems}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />
                <ConsumptionTable
                    title="Trims & Accessories"
                    description={`${trimItems.length} items`}
                    items={trimItems}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    showSearch={false}
                />
            </div>
        </div>
    )
}

function ConsumptionTable({
    title,
    description,
    items,
    loading,
    searchQuery,
    onSearchChange,
    showSearch = true,
}: {
    title: string
    description: string
    items: BomItem[]
    loading: boolean
    searchQuery: string
    onSearchChange: (v: string) => void
    showSearch?: boolean
}) {
    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    {showSearch && (
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter..."
                                className="h-9 w-40 pl-9 bg-muted/20 border-none"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <IconLoader2 className="size-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-bold text-xs">Item</TableHead>
                                <TableHead className="font-bold text-xs text-center">Consumption</TableHead>
                                <TableHead className="font-bold text-xs text-center">Wastage</TableHead>
                                <TableHead className="font-bold text-xs text-right">Required</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                                        No items
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{item.itemName}</span>
                                                <Badge variant="outline" className="w-fit text-[10px] mt-1">
                                                    {item.itemType}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-bold">
                                            {item.consumption} {item.unitName}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-primary/10 text-primary font-bold border-none text-[10px]">
                                                {item.wastagePercent}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-sm">
                                            {item.requiredQty.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
