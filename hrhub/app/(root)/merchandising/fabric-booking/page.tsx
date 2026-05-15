"use client"

import * as React from "react"
import {
    IconPlus,
    IconRefresh,
    IconTruckDelivery,
    IconAlertTriangle,
    IconBuildingWarehouse,
    IconFileInvoice,
    IconDownload,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconSearch,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, FabricBooking, StyleOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    NativeSelect,
    NativeSelectOption,
} from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function FabricBookingPage() {
    const [bookings, setBookings] = React.useState<FabricBooking[]>([])
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingBooking, setEditingBooking] = React.useState<FabricBooking | null>(null)

    // Form State
    const [formData, setFormData] = React.useState<Partial<FabricBooking>>({
        orderId: 0,
        fabricType: "",
        requiredQuantity: 0,
        issuedQuantity: 0,
        unit: "Kg",
        status: "Pending",
        supplier: "",
        deliveryDate: new Date().toISOString(),
    })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [bookingData, orderData] = await Promise.all([
                merchandisingService.getAllFabricBookings(1),
                merchandisingService.getOrders(1)
            ])
            setBookings(bookingData)
            setOrders(orderData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load fabric data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleOpenDialog = (booking?: FabricBooking) => {
        if (booking) {
            setEditingBooking(booking)
            setFormData(booking)
        } else {
            setEditingBooking(null)
            setFormData({
                orderId: orders[0]?.id || 0,
                fabricType: "",
                requiredQuantity: 0,
                issuedQuantity: 0,
                unit: "Kg",
                status: "Pending",
                supplier: "",
                deliveryDate: new Date().toISOString(),
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        try {
            if (editingBooking) {
                await merchandisingService.updateFabricBooking(editingBooking.id, formData)
                toast.success("Booking updated successfully")
            } else {
                await merchandisingService.createFabricBooking(formData)
                toast.success("Booking created successfully")
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Operation failed")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this booking?")) return
        try {
            await merchandisingService.deleteFabricBooking(id)
            toast.success("Booking deleted")
            fetchData()
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    const columns: ColumnDef<FabricBooking>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: "styleOrder.poNumber",
            header: "Order / PO",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{row.original.styleOrder?.poNumber || "N/A"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.styleOrder?.style?.styleNumber || "No Style"}</span>
                </div>
            )
        },
        {
            accessorKey: "fabricType",
            header: "Material",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-muted uppercase text-[10px] text-muted-foreground">
                    {row.original.fabricType || "N/A"}
                </Badge>
            )
        },
        {
            accessorKey: "requiredQuantity",
            header: "Requirement",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground tabular-nums">
                        {row.original.requiredQuantity.toLocaleString()} {row.original.unit}
                    </span>
                    <div className="w-24 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${Math.min((row.original.issuedQuantity / row.original.requiredQuantity) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            accessorKey: "issuedQuantity",
            header: "Issued",
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-muted-foreground/80">
                    {row.original.issuedQuantity.toLocaleString()} {row.original.unit}
                </span>
            )
        },
        {
            accessorKey: "supplier",
            header: "Supplier",
            cell: ({ row }) => <span className="text-xs font-medium text-muted-foreground">{row.original.supplier || "TBA"}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                const variantMap: Record<string, any> = {
                    "Pending": "warning",
                    "Confirmed": "info",
                    "Issued": "success",
                    "Cancelled": "destructive"
                }
                return (
                    <Badge variant={variantMap[status] || "outline"} className="uppercase text-[10px] tracking-wider">
                        {status}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50">
                                <IconDotsVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)}>
                                <IconEdit className="size-4 mr-2" /> Edit Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-rose-600"
                                onClick={() => handleDelete(row.original.id)}
                            >
                                <IconTrash className="size-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ]

    // Summary Metrics
    const metrics = [
        { title: "Total Booked", value: bookings.reduce((a, b) => a + b.requiredQuantity, 0).toLocaleString() + " KG", icon: IconTruckDelivery, color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
        { title: "Efficiency", value: "94.2%", icon: IconAlertTriangle, color: "text-rose-600", bgColor: "bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400" },
        { title: "Total Issued", value: bookings.reduce((a, b) => a + b.issuedQuantity, 0).toLocaleString() + " KG", icon: IconBuildingWarehouse, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
        { title: "Total Bookings", value: bookings.length.toString(), icon: IconFileInvoice, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Fabric Procurement Sheet</h1>
                    <p className="text-sm text-muted-foreground font-medium">Manage fabric bookings and supply chain tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-border rounded-xl text-muted-foreground"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="h-10 px-6 font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-lg shadow-foreground/10 transition-all active:scale-95"
                    >
                        <IconPlus className="size-4 mr-2" />
                        New Booking
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <KPICard key={i} {...m} />
                ))}
            </div>

            {/* Content Table */}
            <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-1">
                <DataTable
                    columns={columns}
                    data={bookings}
                    isLoading={loading}
                    searchKey="fabricType"
                    showTabs={false}
                    showActions={false}
                />
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            {editingBooking ? "Edit Fabric Booking" : "New Fabric Booking"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="order" className="text-xs font-bold uppercase text-muted-foreground/60">Target Order</Label>
                            <NativeSelect
                                value={formData.orderId?.toString()}
                                onChange={(e) => setFormData({ ...formData, orderId: parseInt(e.target.value) })}
                                className="h-11 bg-background border-border w-full text-foreground"
                            >
                                <NativeSelectOption value="0">Select PO Number</NativeSelectOption>
                                {orders.map(o => (
                                    <NativeSelectOption key={o.id} value={o.id.toString()}>
                                        {o.poNumber} ({o.style?.styleNumber})
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fabricType" className="text-xs font-bold uppercase text-muted-foreground/60">Fabric Type</Label>
                                <Input
                                    id="fabricType"
                                    className="h-11 bg-background border-border"
                                    placeholder="e.g. 100% Cotton"
                                    value={formData.fabricType}
                                    onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="supplier" className="text-xs font-bold uppercase text-muted-foreground/60">Supplier</Label>
                                <Input
                                    id="supplier"
                                    className="h-11 bg-background border-border"
                                    placeholder="Supplier Name"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reqQty" className="text-xs font-bold uppercase text-muted-foreground/60">Required Qty</Label>
                                <Input
                                    id="reqQty"
                                    type="number"
                                    className="h-11 bg-background border-border"
                                    value={formData.requiredQuantity}
                                    onChange={(e) => setFormData({ ...formData, requiredQuantity: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit" className="text-xs font-bold uppercase text-muted-foreground/60">Unit</Label>
                                <NativeSelect
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="h-11 bg-background border-border w-full"
                                >
                                    <NativeSelectOption value="Kg">Kilograms (Kg)</NativeSelectOption>
                                    <NativeSelectOption value="Yds">Yards (Yds)</NativeSelectOption>
                                    <NativeSelectOption value="Mtrs">Meters (Mtrs)</NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground/60">Expected Delivery</Label>
                            <DatePicker
                                date={formData.deliveryDate ? new Date(formData.deliveryDate) : undefined}
                                setDate={(d) => setFormData({ ...formData, deliveryDate: d?.toISOString() })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground/60">Booking Status</Label>
                            <NativeSelect
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="h-11 bg-background border-border w-full"
                            >
                                <NativeSelectOption value="Pending">Pending</NativeSelectOption>
                                <NativeSelectOption value="Confirmed">Confirmed</NativeSelectOption>
                                <NativeSelectOption value="Issued">Issued</NativeSelectOption>
                                <NativeSelectOption value="Cancelled">Cancelled</NativeSelectOption>
                            </NativeSelect>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="font-bold text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-500/20"
                        >
                            {editingBooking ? "Update Booking" : "Save Booking"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-border bg-card shadow-sm hover:border-indigo-500 transition-colors group">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bgColor, color)}>
                    <Icon className="size-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className="text-xl font-bold text-foreground">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
