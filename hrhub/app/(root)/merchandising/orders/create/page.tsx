"use client"

import * as React from "react"
import {
    IconFileDescription,
    IconLoader2,
    IconDeviceFloppy as IconSave,
    IconArrowLeft,
    IconPlus,
    IconTrash,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Buyer, Style, CreateColorSizeBreakdownRequest } from "@/lib/types/merchandising"
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BreakdownRow = { id: string; colorName: string; sizeName: string; quantity: number }

export default function CreateOrderPage() {
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)
    const [pageLoading, setPageLoading] = React.useState(true)
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [styles, setStyles] = React.useState<Style[]>([])
    const [orderDate, setOrderDate] = React.useState<Date | undefined>(new Date())
    const [shipmentDate, setShipmentDate] = React.useState<Date | undefined>()
    const [form, setForm] = React.useState({
        orderNo: "",
        buyerId: "",
        styleId: "",
        totalOrderQty: 0,
        unitPrice: 0,
        currencyCode: "USD",
    })
    const [breakdowns, setBreakdowns] = React.useState<BreakdownRow[]>([
        { id: "1", colorName: "", sizeName: "M", quantity: 0 },
    ])

    React.useEffect(() => {
        merchandisingService.getBuyers()
            .then(setBuyers)
            .catch(() => toast.error("Failed to load buyers"))
            .finally(() => setPageLoading(false))
    }, [])

    const handleBuyerChange = async (buyerId: string) => {
        setForm(prev => ({ ...prev, buyerId, styleId: "" }))
        if (buyerId) {
            try {
                setStyles(await merchandisingService.getStyles(undefined, buyerId))
            } catch {
                toast.error("Failed to load styles")
                setStyles([])
            }
        } else {
            setStyles([])
        }
    }

    const breakdownTotal = breakdowns.reduce((sum, r) => sum + (r.quantity || 0), 0)

    const handleSubmit = async () => {
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId || !form.orderNo.trim() || !form.buyerId || !form.styleId) {
            toast.error("Order number, buyer, and style are required")
            return
        }
        const totalQty = breakdownTotal > 0 ? breakdownTotal : form.totalOrderQty
        if (totalQty <= 0) {
            toast.error("Total quantity must be greater than zero")
            return
        }
        try {
            setLoading(true)
            const order = await merchandisingService.createOrder({
                companyId,
                buyerId: form.buyerId,
                styleId: form.styleId,
                orderNo: form.orderNo.trim(),
                orderDate: (orderDate ?? new Date()).toISOString().slice(0, 10),
                shipmentDate: shipmentDate?.toISOString().slice(0, 10),
                totalOrderQty: totalQty,
                unitPrice: form.unitPrice,
                currencyCode: form.currencyCode,
            })

            const validRows = breakdowns.filter(r => r.colorName.trim() && r.sizeName.trim() && r.quantity > 0)
            for (const row of validRows) {
                const payload: CreateColorSizeBreakdownRequest = {
                    companyId,
                    colorName: row.colorName.trim(),
                    sizeName: row.sizeName.trim(),
                    quantity: row.quantity,
                }
                await merchandisingService.createColorSizeBreakdown(order.id, payload)
            }

            toast.success("Order created")
            router.push(`/merchandising/orders/details/${order.id}`)
        } catch (error) {
            console.error(error)
            toast.error("Failed to create order")
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <IconLoader2 className="animate-spin text-primary size-8" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 w-full bg-background min-h-screen">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/merchandising/orders")}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">New Order</h1>
                        <p className="text-xs text-muted-foreground">Create a merchandising order with color/size breakdown</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? <IconLoader2 className="animate-spin mr-2" /> : <IconSave className="mr-2" />}
                    Save Order
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <IconFileDescription className="size-4" /> Order Header
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Order No</Label>
                        <Input value={form.orderNo} onChange={e => setForm({ ...form, orderNo: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Buyer</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.buyerId} onChange={e => handleBuyerChange(e.target.value)}>
                            <option value="">Select Buyer</option>
                            {buyers.map(b => <option key={b.id} value={b.id}>{b.buyerName}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Style</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.styleId} disabled={!form.buyerId} onChange={e => setForm({ ...form, styleId: e.target.value })}>
                            <option value="">Select Style</option>
                            {styles.map(s => <option key={s.id} value={s.id}>{s.styleNo}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Order Date</Label>
                        <DatePicker date={orderDate} setDate={setOrderDate} className="h-9 w-full" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Shipment Date</Label>
                        <DatePicker date={shipmentDate} setDate={setShipmentDate} className="h-9 w-full" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Unit Price</Label>
                        <Input type="number" min="0" step="0.01" value={form.unitPrice || ""} onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Currency</Label>
                        <Input value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Total Qty (if no breakdown)</Label>
                        <Input type="number" min="0" value={form.totalOrderQty || ""} onChange={e => setForm({ ...form, totalOrderQty: parseInt(e.target.value) || 0 })} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Color / Size Breakdown</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setBreakdowns(prev => [...prev, { id: Math.random().toString(36).slice(2), colorName: "", sizeName: "M", quantity: 0 }])}>
                        <IconPlus className="size-3 mr-1" /> Add Row
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {breakdowns.map((row, idx) => (
                        <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                            <Input className="col-span-4" placeholder="Color" value={row.colorName} onChange={e => setBreakdowns(prev => prev.map((r, i) => i === idx ? { ...r, colorName: e.target.value } : r))} />
                            <Input className="col-span-3" placeholder="Size" value={row.sizeName} onChange={e => setBreakdowns(prev => prev.map((r, i) => i === idx ? { ...r, sizeName: e.target.value } : r))} />
                            <Input className="col-span-3" type="number" min="0" placeholder="Qty" value={row.quantity || ""} onChange={e => setBreakdowns(prev => prev.map((r, i) => i === idx ? { ...r, quantity: parseInt(e.target.value) || 0 } : r))} />
                            <Button variant="ghost" size="icon" className="col-span-2" disabled={breakdowns.length === 1} onClick={() => setBreakdowns(prev => prev.filter((_, i) => i !== idx))}>
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-2">Breakdown total: <strong>{breakdownTotal.toLocaleString()}</strong> PCS</p>
                </CardContent>
            </Card>
        </div>
    )
}
