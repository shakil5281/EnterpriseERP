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
import type { Order, ColorSizeBreakdown, UpdateOrderRequest, CreateColorSizeBreakdownRequest } from "@/lib/types/merchandising"
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BreakdownRow = ColorSizeBreakdown | { id: string; colorName: string; sizeName: string; quantity: number; isNew?: boolean }

export default function EditOrderPage() {
    const router = useRouter()
    const { id } = useParams()
    const orderId = id as string
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [order, setOrder] = React.useState<Order | null>(null)
    const [shipmentDate, setShipmentDate] = React.useState<Date | undefined>()
    const [form, setForm] = React.useState({ totalOrderQty: 0, unitPrice: 0, currencyCode: "USD" })
    const [breakdowns, setBreakdowns] = React.useState<BreakdownRow[]>([])

    const fetchData = React.useCallback(async () => {
        if (!orderId) return
        try {
            setLoading(true)
            const [orderData, breakdownData] = await Promise.all([
                merchandisingService.getOrderById(orderId),
                merchandisingService.getColorSizeBreakdown(orderId),
            ])
            setOrder(orderData)
            setForm({
                totalOrderQty: orderData.totalOrderQty,
                unitPrice: orderData.unitPrice,
                currencyCode: orderData.currencyCode,
            })
            setShipmentDate(orderData.shipmentDate ? new Date(orderData.shipmentDate) : undefined)
            setBreakdowns(breakdownData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load order")
            router.replace("/merchandising/orders")
        } finally {
            setLoading(false)
        }
    }, [orderId, router])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async () => {
        if (!order) return
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId) {
            toast.error("No active company selected")
            return
        }
        try {
            setSaving(true)
            const payload: UpdateOrderRequest = {
                shipmentDate: shipmentDate?.toISOString().slice(0, 10),
                totalOrderQty: form.totalOrderQty,
                unitPrice: form.unitPrice,
                currencyCode: form.currencyCode,
            }
            await merchandisingService.updateOrder(order.id, payload)

            for (const row of breakdowns) {
                if ("isNew" in row && row.isNew) {
                    if (!row.colorName.trim() || !row.sizeName.trim() || row.quantity <= 0) continue
                    const createPayload: CreateColorSizeBreakdownRequest = {
                        companyId,
                        colorName: row.colorName.trim(),
                        sizeName: row.sizeName.trim(),
                        quantity: row.quantity,
                    }
                    await merchandisingService.createColorSizeBreakdown(order.id, createPayload)
                } else if ("id" in row && !("isNew" in row)) {
                    await merchandisingService.updateColorSizeBreakdown(row.id, {
                        colorName: row.colorName,
                        sizeName: row.sizeName,
                        quantity: row.quantity,
                    })
                }
            }

            toast.success("Order updated")
            router.push(`/merchandising/orders/details/${orderId}`)
        } catch (error) {
            console.error(error)
            toast.error("Update failed")
        } finally {
            setSaving(false)
        }
    }

    const addBreakdownRow = () => {
        setBreakdowns(prev => [...prev, { id: Math.random().toString(36).slice(2), colorName: "", sizeName: "M", quantity: 0, isNew: true }])
    }

    const removeBreakdownRow = async (row: BreakdownRow, idx: number) => {
        if ("isNew" in row && row.isNew) {
            setBreakdowns(prev => prev.filter((_, i) => i !== idx))
            return
        }
        if (!("isNew" in row)) {
            try {
                await merchandisingService.deleteColorSizeBreakdown(row.id)
                setBreakdowns(prev => prev.filter((_, i) => i !== idx))
            } catch {
                toast.error("Failed to delete breakdown row")
            }
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <IconLoader2 className="animate-spin text-primary size-8" />
            </div>
        )
    }

    if (!order) return null

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 w-full bg-background min-h-screen">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/merchandising/orders/details/${orderId}`)}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Edit Order ({order.orderNo})</h1>
                        <p className="text-xs text-muted-foreground">Update quantities, pricing, and breakdown</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? <IconLoader2 className="animate-spin mr-2" /> : <IconSave className="mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <IconFileDescription className="size-4" /> Order Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Order No</Label>
                        <Input value={order.orderNo} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Status</Label>
                        <Input value={order.orderStatus} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Shipment Date</Label>
                        <DatePicker date={shipmentDate} setDate={setShipmentDate} className="h-9 w-full" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Total Qty</Label>
                        <Input type="number" min="0" value={form.totalOrderQty || ""} onChange={e => setForm({ ...form, totalOrderQty: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Unit Price</Label>
                        <Input type="number" min="0" step="0.01" value={form.unitPrice || ""} onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Currency</Label>
                        <Input value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Color / Size Breakdown</CardTitle>
                    <Button variant="outline" size="sm" onClick={addBreakdownRow}>
                        <IconPlus className="size-3 mr-1" /> Add Row
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {breakdowns.map((row, idx) => (
                        <div key={"isNew" in row ? row.id : row.id} className="grid grid-cols-12 gap-2 items-center">
                            <Input className="col-span-4" placeholder="Color" value={row.colorName} onChange={e => setBreakdowns(prev => prev.map((r, i) => i === idx ? { ...r, colorName: e.target.value } : r))} />
                            <Input className="col-span-3" placeholder="Size" value={row.sizeName} onChange={e => setBreakdowns(prev => prev.map((r, i) => i === idx ? { ...r, sizeName: e.target.value } : r))} />
                            <Input className="col-span-3" type="number" min="0" value={row.quantity || ""} onChange={e => setBreakdowns(prev => prev.map((r, i) => i === idx ? { ...r, quantity: parseInt(e.target.value) || 0 } : r))} />
                            <Button variant="ghost" size="icon" className="col-span-2" onClick={() => removeBreakdownRow(row, idx)}>
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
