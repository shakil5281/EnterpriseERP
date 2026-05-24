"use client"

import * as React from "react"
import {
    IconTimeline,
    IconSearch,
    IconRefresh,
    IconLoader2,
    IconAlertTriangle,
    IconCalendarTime,
    IconCheck,
    IconChevronRight,
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
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, Buyer, Style, TnaCalendar } from "@/lib/types/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"

type TrackedOrder = Order & {
    buyerName: string
    styleNo: string
    tna: TnaCalendar | null
}

export default function OrderTrackingPage() {
    const router = useRouter()
    const [orders, setOrders] = React.useState<TrackedOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const status = statusFilter === "all" ? undefined : statusFilter
            const [ordersData, buyersData, stylesData] = await Promise.all([
                merchandisingService.getOrders(undefined, undefined, status),
                merchandisingService.getBuyers(),
                merchandisingService.getStyles(),
            ])
            const buyerMap = new Map(buyersData.map(b => [b.id, b.buyerName]))
            const styleMap = new Map(stylesData.map(s => [s.id, s.styleNo]))

            const withTna = await Promise.all(
                ordersData.map(async (order) => {
                    let tna: TnaCalendar | null = null
                    try {
                        tna = await merchandisingService.getTnaByOrder(order.id)
                    } catch {
                        tna = null
                    }
                    return {
                        ...order,
                        buyerName: buyerMap.get(order.buyerId) ?? "—",
                        styleNo: styleMap.get(order.styleId) ?? "—",
                        tna,
                    }
                })
            )
            setOrders(withTna)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load tracking data")
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filtered = orders.filter(o =>
        o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.styleNo.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const milestoneProgress = (tna: TnaCalendar | null) => {
        const milestones = tna?.milestones ?? []
        if (milestones.length === 0) return { pct: 0, label: "No TNA", status: "pending" as const }
        const completed = milestones.filter(m => m.status === "Completed" || m.actualDate).length
        const pct = Math.round((completed / milestones.length) * 100)
        const delayed = milestones.some(m => m.status === "Delayed")
        return {
            pct,
            label: milestones.find(m => !m.actualDate)?.milestoneName ?? "Complete",
            status: delayed ? "delayed" as const : pct >= 80 ? "on-track" as const : "at-risk" as const,
        }
    }

    const onTrack = filtered.filter(o => milestoneProgress(o.tna).status === "on-track").length
    const atRisk = filtered.filter(o => milestoneProgress(o.tna).status === "at-risk").length
    const delayed = filtered.filter(o => milestoneProgress(o.tna).status === "delayed").length

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconTimeline className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Order Tracking</h1>
                        <p className="text-muted-foreground text-sm">TNA milestone monitoring by order</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                        <IconRefresh className="size-4" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6">
                <KPICard title="On-Track" value={onTrack.toString()} icon={IconCheck} color="text-emerald-600" />
                <KPICard title="At Risk" value={atRisk.toString()} icon={IconAlertTriangle} color="text-amber-600" />
                <KPICard title="Delayed" value={delayed.toString()} icon={IconCalendarTime} color="text-rose-600" />
                <KPICard title="Total Orders" value={filtered.length.toString()} icon={IconTimeline} color="text-blue-600" />
            </div>

            <div className="px-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Milestone Status</CardTitle>
                                <CardDescription>Orders with TNA calendar progress</CardDescription>
                            </div>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input placeholder="Search by order, buyer, style..." className="pl-9 h-9 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                    </CardHeader>
                    <div className="border-t overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-32 gap-3">
                                <IconLoader2 className="size-10 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold text-[10px] uppercase">Order</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase">Status</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase">Current Milestone</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-center">Progress</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((order) => {
                                        const { pct, label, status } = milestoneProgress(order.tna)
                                        return (
                                            <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/merchandising/orders/details/${order.id}`)}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-primary">{order.orderNo}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{order.buyerName} · {order.styleNo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase">{order.orderStatus}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("size-2 rounded-full", status === "on-track" ? "bg-emerald-500" : status === "delayed" ? "bg-rose-500" : "bg-amber-500")} />
                                                        <span className="text-xs font-bold uppercase">{label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5 w-32 mx-auto">
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span>{pct}%</span>
                                                        </div>
                                                        <Progress value={pct} className="h-1" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/merchandising/orders/details/${order.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><IconChevronRight className="size-4" /></Button>
                                                    </Link>
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

function KPICard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
    return (
        <Card className="border-none shadow-sm">
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
