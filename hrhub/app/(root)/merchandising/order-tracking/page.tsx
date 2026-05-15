"use client"

import * as React from "react"
import {
    IconTimeline,
    IconSearch,
    IconRefresh,
    IconLayoutList,
    IconChevronRight,
    IconLoader2,
    IconAlertTriangle,
    IconCalendarTime,
    IconCheck,
    IconProgress
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { merchandisingService, StyleOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function OrderTrackingPage() {
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load tracking data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconTimeline className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Order Tracking</h1>
                        <p className="text-muted-foreground text-sm">Milestone monitoring from development to ex-factory</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 font-bold h-9 bg-muted/20 border-none">
                        <IconRefresh className="size-4" />
                        Refresh
                    </Button>
                    <Button size="sm" className="gap-2 font-bold h-9">
                        <IconLayoutList className="size-4" />
                        T&A Dashboard
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6">
                <KPICard title="On-Track" value="48" icon={IconCheck} color="text-emerald-600" />
                <KPICard title="At Risk" value="12" icon={IconAlertTriangle} color="text-amber-600" />
                <KPICard title="Delayed" value="04" icon={IconCalendarTime} color="text-rose-600" />
                <KPICard title="Efficiency" value="92%" icon={IconProgress} color="text-blue-600" />
            </div>

            {/* Content Container */}
            <div className="px-6 space-y-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Milestone Status</CardTitle>
                                <CardDescription>Registry of active order progressions</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by PO..."
                                        className="pl-9 h-9 w-48 bg-muted/20 border-none"
                                    />
                                </div>
                                <Button variant="secondary" size="sm" className="gap-2 font-bold h-9 bg-muted/20 border-none">
                                    Critical Path
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="border-t overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-32 gap-3 bg-muted/5">
                                <IconLoader2 className="size-10 animate-spin text-primary" />
                                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Fetching tracking data...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Order Detail</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10">Current Milestone</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider h-10 text-center">Lead Time Health</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order, i) => {
                                        const perc = 40 + (i * 15) % 60
                                        return (
                                            <TableRow key={i} className="group border-muted/30">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight text-primary">{order.poNumber}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">{order.style?.styleNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "size-2 rounded-full",
                                                            perc > 80 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                                        )} />
                                                        <span className="text-xs font-bold uppercase tracking-tight">
                                                            {i % 3 === 0 ? "Production Start" : i % 3 === 1 ? "In-Wash" : "Packing Started"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5 w-32 mx-auto">
                                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                                            <span className={perc > 80 ? "text-emerald-600" : "text-amber-600"}>{perc}%</span>
                                                            <span className="text-muted-foreground">{100 - perc}% Left</span>
                                                        </div>
                                                        <Progress value={perc} className="h-1" indicatorClassName={perc > 80 ? "bg-emerald-500" : "bg-amber-500"} />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                        <IconChevronRight className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
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
