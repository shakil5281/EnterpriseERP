"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    IconStack,
    IconSearch,
    IconPlus,
    IconDownload,
    IconRefresh,
    IconLoader2,
    IconClock,
    IconCircleCheck,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"
import { merchandisingService } from "@/lib/services/merchandising"
import type { MaterialBooking, Order } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"

type BookingTab = "fabric" | "trims"

function resolveTab(typeParam: string | null): BookingTab {
    return typeParam?.toLowerCase() === "trims" ? "trims" : "fabric"
}

function bookingTypeForTab(tab: BookingTab): string {
    return tab === "fabric" ? "Fabric" : "Trims"
}

export default function BookingsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { activeCompanyId } = useCompanyContext()

    const initialTab = resolveTab(searchParams.get("type"))
    const urlSubType = searchParams.get("subType") ?? searchParams.get("trimsSubType") ?? ""

    const [activeTab, setActiveTab] = React.useState<BookingTab>(initialTab)
    const [trimsSubType, setTrimsSubType] = React.useState(urlSubType)
    const [bookings, setBookings] = React.useState<MaterialBooking[]>([])
    const [orders, setOrders] = React.useState<Order[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [orderFilter, setOrderFilter] = React.useState("")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [creating, setCreating] = React.useState(false)
    const [newBooking, setNewBooking] = React.useState({
        orderId: "",
        bookingNo: "",
    })

    React.useEffect(() => {
        setActiveTab(resolveTab(searchParams.get("type")))
        setTrimsSubType(searchParams.get("subType") ?? searchParams.get("trimsSubType") ?? "")
    }, [searchParams])

    const syncUrl = React.useCallback(
        (tab: BookingTab, subType?: string) => {
            const params = new URLSearchParams()
            params.set("type", tab)
            if (tab === "trims" && subType) params.set("subType", subType)
            router.replace(`/merchandising/bookings?${params.toString()}`, { scroll: false })
        },
        [router]
    )

    const fetchData = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const [bookingRows, orderRows] = await Promise.all([
                merchandisingService.getMaterialBookings(
                    activeCompanyId,
                    orderFilter || undefined,
                    bookingTypeForTab(activeTab)
                ),
                merchandisingService.getOrders(activeCompanyId),
            ])
            setBookings(bookingRows)
            setOrders(orderRows)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load material bookings")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId, activeTab, orderFilter])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredBookings = React.useMemo(() => {
        let rows = bookings
        if (activeTab === "trims" && trimsSubType.trim()) {
            const needle = trimsSubType.trim().toLowerCase()
            rows = rows.filter(
                (b) =>
                    b.bookingNo.toLowerCase().includes(needle) ||
                    b.bookingType.toLowerCase().includes(needle)
            )
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            rows = rows.filter(
                (b) =>
                    b.bookingNo.toLowerCase().includes(q) ||
                    b.status.toLowerCase().includes(q) ||
                    orders.find((o) => o.id === b.orderId)?.orderNo.toLowerCase().includes(q)
            )
        }
        return rows
    }, [bookings, activeTab, trimsSubType, searchQuery, orders])

    const pendingCount = filteredBookings.filter((b) => b.status === "Draft" || b.status === "Pending").length
    const confirmedCount = filteredBookings.filter((b) => b.status === "Confirmed" || b.status === "FullyAllocated").length

    const handleTabChange = (value: string) => {
        const tab = value as BookingTab
        setActiveTab(tab)
        syncUrl(tab, tab === "trims" ? trimsSubType : undefined)
    }

    const handleCreate = async () => {
        if (!activeCompanyId || !newBooking.orderId || !newBooking.bookingNo.trim()) {
            toast.error("Order and booking number are required")
            return
        }
        try {
            setCreating(true)
            const prefix = activeTab === "trims" && trimsSubType ? `${trimsSubType}-` : ""
            await merchandisingService.createMaterialBooking({
                companyId: activeCompanyId,
                orderId: newBooking.orderId,
                bookingNo: `${prefix}${newBooking.bookingNo.trim()}`,
                bookingType: bookingTypeForTab(activeTab),
            })
            toast.success("Material booking created")
            setIsCreateOpen(false)
            setNewBooking({ orderId: "", bookingNo: "" })
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create booking")
        } finally {
            setCreating(false)
        }
    }

    const handleExport = async () => {
        if (!activeCompanyId) return
        try {
            await merchandisingService.exportBookingStatusReport(
                activeCompanyId,
                orderFilter || undefined
            )
            toast.success("Report downloaded")
        } catch (error) {
            console.error(error)
            toast.error("Export failed")
        }
    }

    const orderLabel = (orderId: string) => orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8)

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconStack className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Material Booking</h1>
                        <p className="text-muted-foreground text-sm">Fabric, trims, and accessories scheduling</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 font-bold h-9" onClick={handleExport}>
                        <IconDownload className="size-4" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 font-bold h-9" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 font-bold h-9">
                                <IconPlus className="size-4" />
                                New Booking
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Material Booking</DialogTitle>
                                <DialogDescription>
                                    {bookingTypeForTab(activeTab)} booking
                                    {activeTab === "trims" && trimsSubType ? ` — ${trimsSubType}` : ""}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-2">
                                <div className="space-y-2">
                                    <Label className="text-xs">Order</Label>
                                    <NativeSelect
                                        value={newBooking.orderId}
                                        onChange={(e) => setNewBooking((p) => ({ ...p, orderId: e.target.value }))}
                                    >
                                        <option value="">Select order</option>
                                        {orders.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.orderNo}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Booking Number</Label>
                                    <Input
                                        placeholder="e.g. BKG-2026-001"
                                        value={newBooking.bookingNo}
                                        onChange={(e) => setNewBooking((p) => ({ ...p, bookingNo: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating ? "Creating..." : "Create Booking"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
                <KPICard title="Total Bookings" value={filteredBookings.length.toString()} icon={IconStack} color="text-primary" />
                <KPICard title="Pending" value={pendingCount.toString()} icon={IconClock} color="text-amber-600" />
                <KPICard title="Confirmed" value={confirmedCount.toString()} icon={IconCircleCheck} color="text-emerald-600" />
            </div>

            <div className="px-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList>
                            <TabsTrigger value="fabric" className="font-bold text-xs uppercase">
                                Fabric
                            </TabsTrigger>
                            <TabsTrigger value="trims" className="font-bold text-xs uppercase">
                                Trims
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex flex-wrap items-center gap-2">
                        <NativeSelect
                            className="h-9 w-48"
                            value={orderFilter}
                            onChange={(e) => setOrderFilter(e.target.value)}
                        >
                            <option value="">All orders</option>
                            {orders.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.orderNo}
                                </option>
                            ))}
                        </NativeSelect>
                        {activeTab === "trims" && (
                            <Input
                                placeholder="Trims sub-type filter"
                                className="h-9 w-48 bg-muted/20 border-none"
                                value={trimsSubType}
                                onChange={(e) => {
                                    setTrimsSubType(e.target.value)
                                    syncUrl("trims", e.target.value)
                                }}
                            />
                        )}
                    </div>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Booking Registry</CardTitle>
                                <CardDescription>
                                    {activeTab === "fabric" ? "Fabric commitments" : "Trims and accessories"}
                                    {trimsSubType ? ` · ${trimsSubType}` : ""}
                                </CardDescription>
                            </div>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search booking no or status..."
                                    className="pl-9 h-9 w-64 bg-muted/20 border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <div className="border-t overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <IconLoader2 className="size-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Booking No</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Order</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Type</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10 text-right">Total Qty</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10 text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBookings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                                                No bookings found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBookings.map((bkg) => (
                                            <TableRow key={bkg.id} className="border-muted/30">
                                                <TableCell className="font-bold text-xs text-primary">{bkg.bookingNo}</TableCell>
                                                <TableCell className="text-xs font-semibold">{orderLabel(bkg.orderId)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                                        {bkg.bookingType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-bold tabular-nums">
                                                    {bkg.totalQty.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] uppercase font-bold",
                                                            bkg.status === "FullyAllocated" || bkg.status === "Confirmed"
                                                                ? "text-emerald-600 border-emerald-200 bg-emerald-50/50"
                                                                : bkg.status === "Draft" || bkg.status === "Pending"
                                                                  ? "text-amber-600 border-amber-200 bg-amber-50/50"
                                                                  : "text-blue-600 border-blue-200 bg-blue-50/50"
                                                        )}
                                                    >
                                                        {bkg.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}

function KPICard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}) {
    return (
        <Card className="border-none shadow-sm overflow-hidden group">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50", color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className="text-lg font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
