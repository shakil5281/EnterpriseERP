"use client"

import * as React from "react"
import {
    IconStack,
    IconSearch,
    IconPlus,
    IconFilter,
    IconDownload,
    IconExternalLink,
    IconCircleCheck,
    IconAlertCircle,
    IconClock,
    IconRefresh
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
import { cn } from "@/lib/utils"

const bookingsData = [
    { id: "BKG-2021", type: "Fabric", item: "100% Cotton Jersey", supplier: "Nice Fabrics Ltd", po: "PO-88210", reqQty: 5000, unit: "kg", status: "Booked", etd: "2026-02-25" },
    { id: "BKG-2022", type: "Trims", item: "YKK Zipper #5", supplier: "YKK BD", po: "PO-88210", reqQty: 12000, unit: "pcs", status: "In-house", etd: "2026-02-10" },
    { id: "BKG-2023", type: "Fabric", item: "Spandex Rib", supplier: "Nice Fabrics Ltd", po: "PO-88211", reqQty: 800, unit: "kg", status: "Pending", etd: "-" },
    { id: "BKG-2024", type: "Accessories", item: "Main Label", supplier: "Top Label", po: "Multiple", reqQty: 50000, unit: "pcs", status: "Partial", etd: "2026-03-01" },
]

export default function BookingsPage() {
    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
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
                    <Button variant="outline" size="sm" className="gap-2 font-bold h-9 bg-muted/20 border-none">
                        <IconDownload className="size-4" />
                        Export
                    </Button>
                    <Button size="sm" className="gap-2 font-bold h-9">
                        <IconPlus className="size-4" />
                        First Booking
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
                <KPICard title="Pending Bookings" value="12" icon={IconClock} color="text-amber-600" />
                <KPICard title="Supplier Delays" value="05" icon={IconAlertCircle} color="text-rose-600" />
                <KPICard title="Performance" value="85%" icon={IconCircleCheck} color="text-emerald-600" />
            </div>

            {/* Content Container */}
            <div className="px-6 space-y-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Booking Registry</CardTitle>
                                <CardDescription>Material commitment and delivery tracking</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search ID, item or supplier..."
                                        className="pl-9 h-9 w-64 bg-muted/20 border-none"
                                    />
                                </div>
                                <Button variant="secondary" size="sm" className="gap-2 font-bold h-9 bg-muted/20 border-none">
                                    <IconFilter className="size-4" />
                                    Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="border-t overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Booking ID</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Item Details</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Supplier</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10 text-right">Quantity</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10 text-right">ETD</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookingsData.map((bkg) => (
                                    <TableRow key={bkg.id} className="group border-muted/30">
                                        <TableCell className="font-bold text-xs text-primary">{bkg.id}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase border-muted">{bkg.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{bkg.item}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-medium">PO: {bkg.po}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold">{bkg.supplier}</TableCell>
                                        <TableCell className="text-right text-xs font-bold tabular-nums">
                                            {bkg.reqQty.toLocaleString()} <span className="text-[9px] text-muted-foreground uppercase font-medium ml-1">{bkg.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] uppercase font-bold",
                                                bkg.status === 'In-house' ? 'text-emerald-600 border-emerald-200 bg-emerald-50/50' :
                                                    bkg.status === 'Booked' ? 'text-blue-600 border-blue-200 bg-blue-50/50' :
                                                        bkg.status === 'Pending' ? 'text-amber-600 border-amber-200 bg-amber-50/50' :
                                                            'text-purple-600 border-purple-200 bg-purple-50/50'
                                            )}>
                                                {bkg.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-[10px] font-bold">
                                            {bkg.etd}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                <IconExternalLink className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-sm overflow-hidden group">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50 transition-colors group-hover:bg-muted", color)}>
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
