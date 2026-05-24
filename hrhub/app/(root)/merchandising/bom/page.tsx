"use client"

import * as React from "react"
import {
    IconLayersLinked,
    IconSearch,
    IconLoader2,
    IconPlus,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { merchandisingService } from "@/lib/services/merchandising"
import type { BomItem, Order } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"

export default function BOMPage() {
    const { activeCompanyId } = useCompanyContext()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [selectedOrderId, setSelectedOrderId] = React.useState("")
    const [bomItems, setBomItems] = React.useState<BomItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [bomLoading, setBomLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [newItem, setNewItem] = React.useState({
        itemType: "Fabric",
        itemName: "",
        unitName: "KG",
        consumption: "",
        wastagePercent: "5",
        unitPrice: "",
    })

    const fetchOrders = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(activeCompanyId)
            setOrders(data)
            if (!selectedOrderId && data.length > 0) setSelectedOrderId(data[0].id)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load orders for BOM")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId, selectedOrderId])

    const fetchBom = React.useCallback(async (orderId: string) => {
        if (!orderId) return
        try {
            setBomLoading(true)
            const data = await merchandisingService.getBomItems(orderId)
            setBomItems(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load BOM items")
        } finally {
            setBomLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    React.useEffect(() => {
        if (selectedOrderId) fetchBom(selectedOrderId)
    }, [selectedOrderId, fetchBom])

    const filteredItems = bomItems.filter(
        (item) =>
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemType.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = async () => {
        if (!activeCompanyId || !selectedOrderId || !newItem.itemName.trim()) {
            toast.error("Item name is required")
            return
        }
        try {
            await merchandisingService.createBomItem(selectedOrderId, {
                companyId: activeCompanyId,
                itemType: newItem.itemType,
                itemName: newItem.itemName.trim(),
                unitName: newItem.unitName,
                consumption: Number(newItem.consumption || 0),
                wastagePercent: Number(newItem.wastagePercent || 0),
                unitPrice: Number(newItem.unitPrice || 0),
            })
            toast.success("BOM item added")
            setIsCreateOpen(false)
            setNewItem({
                itemType: "Fabric",
                itemName: "",
                unitName: "KG",
                consumption: "",
                wastagePercent: "5",
                unitPrice: "",
            })
            fetchBom(selectedOrderId)
        } catch (error) {
            console.error(error)
            toast.error("Failed to add BOM item")
        }
    }

    const selectedOrder = orders.find((o) => o.id === selectedOrderId)

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconLayersLinked className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bill of Materials</h1>
                        <p className="text-muted-foreground text-sm">Define raw material requirements per order</p>
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
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search items..."
                            className="pl-9 h-9 w-48 bg-muted/20 border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button size="sm" variant="secondary" className="font-bold" onClick={() => fetchBom(selectedOrderId)}>
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button size="sm" className="gap-2 font-bold" onClick={() => setIsCreateOpen(true)} disabled={!selectedOrderId}>
                        <IconPlus className="size-4" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="px-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">
                            BOM — {selectedOrder?.orderNo ?? "No order selected"}
                        </CardTitle>
                        <CardDescription>{filteredItems.length} line items</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        {loading || bomLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <IconLoader2 className="size-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Type</TableHead>
                                        <TableHead className="font-bold text-xs">Item</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Consumption</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Wastage %</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Required Qty</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Unit Price</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                No BOM items yet
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                                        {item.itemType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-sm">{item.itemName}</TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {item.consumption} {item.unitName}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">{item.wastagePercent}%</TableCell>
                                                <TableCell className="text-right font-bold">{item.requiredQty.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-sm">${item.unitPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold">${item.totalCost.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add BOM Item</DialogTitle>
                        <DialogDescription>Order: {selectedOrder?.orderNo}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs">Item Type</Label>
                            <NativeSelect
                                value={newItem.itemType}
                                onChange={(e) => setNewItem((p) => ({ ...p, itemType: e.target.value }))}
                            >
                                <option value="Fabric">Fabric</option>
                                <option value="Trims">Trims</option>
                                <option value="Accessories">Accessories</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Item Name</Label>
                            <Input
                                value={newItem.itemName}
                                onChange={(e) => setNewItem((p) => ({ ...p, itemName: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Unit</Label>
                                <Input
                                    value={newItem.unitName}
                                    onChange={(e) => setNewItem((p) => ({ ...p, unitName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Consumption</Label>
                                <Input
                                    type="number"
                                    value={newItem.consumption}
                                    onChange={(e) => setNewItem((p) => ({ ...p, consumption: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Wastage %</Label>
                                <Input
                                    type="number"
                                    value={newItem.wastagePercent}
                                    onChange={(e) => setNewItem((p) => ({ ...p, wastagePercent: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Unit Price</Label>
                                <Input
                                    type="number"
                                    value={newItem.unitPrice}
                                    onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Save Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
