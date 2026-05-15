const fs = require('fs');
const path = require('path');

const items = [
    { title: "Button", slug: "button" },
    { title: "Care Label", slug: "care-label" },
    { title: "Drawcord", slug: "drawcord" },
    { title: "Drawstring", slug: "drawstring" },
    { title: "Elastic", slug: "elastic" },
    { title: "Eyelet", slug: "eyelet" },
    { title: "Main Label", slug: "main-label" },
    { title: "Poly Booking", slug: "poly-booking" },
    { title: "Polyhang Tag", slug: "polyhang-tag" },
    { title: "Price Tag", slug: "price-tag" },
    { title: "Snap Button", slug: "snap-button" },
    { title: "Sewing Thread", slug: "sewing-thread" },
    { title: "Side Label", slug: "side-label" },
    { title: "Solid Twill Tape", slug: "solid-twill-tape" },
    { title: "Tissue Paper", slug: "tissue-paper" },
    { title: "Zipper", slug: "zipper" }
];

const basePath = path.join(__dirname, 'app', '(root)', 'merchandising', 'accessories');

if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}

items.forEach(item => {
    const dirPath = path.join(basePath, item.slug);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const componentName = item.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';

    const content = `"use client"

import * as React from "react"
import {
    IconPlus,
    IconRefresh,
    IconShoppingCart,
    IconCheck,
    IconClock,
    IconAlertCircle,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconPackage,
    IconSearch,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, AccessoriesBooking, StyleOrder } from "@/lib/services/merchandising"
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

export default function ${componentName}() {
    const [allBookings, setAllBookings] = React.useState<AccessoriesBooking[]>([])
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingBooking, setEditingBooking] = React.useState<AccessoriesBooking | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    const emptyForm: Partial<AccessoriesBooking> = {
        orderId: 0,
        itemName: "${item.title}",
        quantity: 0,
        unit: "Pcs",
        status: "Pending",
        supplier: "",
        deliveryDate: new Date().toISOString(),
    }

    const [formData, setFormData] = React.useState<Partial<AccessoriesBooking>>(emptyForm)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [bookingData, orderData] = await Promise.all([
                merchandisingService.getAllAccessoriesBookings(1),
                merchandisingService.getOrders(1)
            ])
            setAllBookings(bookingData)
            setOrders(orderData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load accessories data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const bookings = allBookings.filter(b => b.itemName.toLowerCase().includes("${item.title.toLowerCase()}"))

    const handleOpenDialog = (booking?: AccessoriesBooking) => {
        if (booking) {
            setEditingBooking(booking)
            setFormData({
                ...booking,
                deliveryDate: booking.deliveryDate || new Date().toISOString()
            })
        } else {
            setEditingBooking(null)
            setFormData({
                ...emptyForm,
                orderId: orders[0]?.id || 0
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        try {
            if (!formData.orderId || formData.orderId === 0) {
                toast.error("Please select a Target Order")
                return
            }
            if (!formData.itemName?.trim()) {
                toast.error("Item Name is required")
                return
            }
            if (!formData.quantity || formData.quantity <= 0) {
                toast.error("Quantity must be greater than 0")
                return
            }

            setLoading(true)
            if (editingBooking) {
                await merchandisingService.updateAccessoriesBooking(editingBooking.id, formData)
                toast.success("Record updated")
            } else {
                await merchandisingService.createAccessoriesBooking(formData)
                toast.success("New booking created successfully")
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save record.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this booking?")) return
        try {
            await merchandisingService.deleteAccessoriesBooking(id)
            toast.success("Booking deleted")
            fetchData()
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    const columns: ColumnDef<AccessoriesBooking>[] = [
        {
            accessorKey: "itemName",
            header: "Accessories Item",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">\${row.original.itemName}</span>
                    <span className="text-xs text-muted-foreground">\${row.original.supplier || "N/A"}</span>
                </div>
            )
        },
        {
            accessorKey: "styleOrder.poNumber",
            header: "PO / Style",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm text-foreground">\${row.original.styleOrder?.poNumber || "N/A"}</span>
                    <span className="text-xs text-muted-foreground">\${row.original.styleOrder?.style?.styleNumber || "No Style Ref"}</span>
                </div>
            )
        },
        {
            accessorKey: "quantity",
            header: "Qty",
            cell: ({ row }) => (
                <span className="text-sm text-foreground font-medium">
                    \${row.original.quantity.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">\${row.original.unit}</span>
                </span>
            )
        },
        {
            accessorKey: "deliveryDate",
            header: "Delivery Date",
            cell: ({ row }) => {
                const date = row.original.deliveryDate ? new Date(row.original.deliveryDate) : null
                return (
                    <span className="text-sm text-muted-foreground font-medium">
                        {date ? date.toLocaleDateString() : "Not Set"}
                    </span>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                const variantMap = {
                    "Pending": "yellow",
                    "Approved": "blue",
                    "In-House": "green",
                    "Cancelled": "red"
                }
                const color = variantMap[status] || "gray"
                
                return (
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "font-medium text-xs capitalize",
                            color === "yellow" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
                            color === "blue" && "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
                            color === "green" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                            color === "red" && "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
                            color === "gray" && "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400"
                        )}
                    >
                        {status}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <IconDotsVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)}>
                                <IconEdit className="size-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
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

    const filteredBookings = bookings.filter(b => 
        b.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.styleOrder?.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const metrics = [
        { title: "Total Bookings", value: bookings.length.toString(), icon: IconPackage, color: "blue" },
        { title: "Pending", value: bookings.filter(b => b.status === "Pending").length.toString(), icon: IconClock, color: "yellow" },
        { title: "Approved", value: bookings.filter(b => b.status === "Approved").length.toString(), icon: IconCheck, color: "green" },
        { title: "Alerts", value: "0", icon: IconAlertCircle, color: "red" },
    ]

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-10 bg-background min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wider uppercase">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        Accessory Control
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">${item.title} Booking</h1>
                    <p className="text-muted-foreground text-base">Manage procurement lifecycle for ${item.title.toLowerCase()} materials</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-11 w-11 rounded-xl shadow-sm"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={cn("size-5", loading && "animate-spin")} />
                    </Button>
                    <Button 
                        onClick={() => handleOpenDialog()}
                        className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98]"
                    >
                        <IconPlus className="size-5 mr-2" />
                        Create ${item.title} Booking
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <KPICard key={i} {...m} />
                ))}
            </div>

            {/* Main Content Card */}
            <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="border-b bg-muted/30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search inventory records..." 
                                className="pl-10 h-10 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="px-2 pb-2">
                        <DataTable
                            columns={columns}
                            data={filteredBookings}
                            isLoading={loading}
                            searchKey="itemName"
                            showTabs={false}
                            showActions={false}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 pt-6 pb-4 bg-muted/50 border-b">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {editingBooking ? \`Edit ${item.title} Record\` : \`New ${item.title} Booking\`}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Provide acquisition details for the merchandising inventory</p>
                    </DialogHeader>

                    <div className="grid gap-6 p-6">
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">Order / PO Reference</Label>
                            <NativeSelect
                                value={formData.orderId?.toString()}
                                className="h-11 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-colors"
                                onChange={(e) => setFormData({ ...formData, orderId: parseInt(e.target.value) })}
                            >
                                <NativeSelectOption value="0">Select target order...</NativeSelectOption>
                                {orders.map(o => (
                                    <NativeSelectOption key={o.id} value={o.id.toString()}>
                                        {o.poNumber} — {o.style?.styleNumber}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">Material Details</Label>
                            <Input
                                placeholder="E.g. 40/2 Spun Polyester"
                                className="h-11 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-colors"
                                value={formData.itemName}
                                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">Required Volume</Label>
                                <Input
                                    type="number"
                                    className="h-11 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-colors"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">Measurement Unit</Label>
                                <NativeSelect
                                    value={formData.unit}
                                    className="h-11 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-colors"
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <NativeSelectOption value="Pcs">Pcs</NativeSelectOption>
                                    <NativeSelectOption value="Dzn">Dzn</NativeSelectOption>
                                    <NativeSelectOption value="Roll">Roll</NativeSelectOption>
                                    <NativeSelectOption value="Gross">Gross</NativeSelectOption>
                                    <NativeSelectOption value="Kg">Kg</NativeSelectOption>
                                    <NativeSelectOption value="Mtr">Mtr</NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">Source Supplier</Label>
                            <Input
                                placeholder="Designated vendor name"
                                className="h-11 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-colors"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">ETA Date</Label>
                                <DatePicker
                                    date={formData.deliveryDate ? new Date(formData.deliveryDate) : undefined}
                                    setDate={(d) => setFormData({ ...formData, deliveryDate: d?.toISOString() })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">Workflow Status</Label>
                                <NativeSelect
                                    value={formData.status}
                                    className="h-11 bg-muted/20 border-muted-foreground/10 focus:border-primary transition-colors"
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <NativeSelectOption value="Pending">Pending</NativeSelectOption>
                                    <NativeSelectOption value="Approved">Approved</NativeSelectOption>
                                    <NativeSelectOption value="In-House">In-House</NativeSelectOption>
                                    <NativeSelectOption value="Cancelled">Cancelled</NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 bg-muted/30 border-t gap-2">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6">
                            Discard
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={loading}
                            className="h-11 px-8 rounded-lg shadow-md shadow-primary/10 transition-all hover:shadow-primary/20"
                        >
                            {loading ? "Processing..." : editingBooking ? "Update Record" : "Save Booking"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color }) {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
        yellow: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
        green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
        red: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    }

    return (
        <Card className="border-none shadow-lg shadow-foreground/5 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
                        <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl border transition-all duration-300 group-hover:rotate-12", colorMap[color])}>
                        <Icon className="size-7" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
`;

    fs.writeFileSync(path.join(dirPath, 'page.tsx'), content);
});

console.log('Pages generated successfully!');
