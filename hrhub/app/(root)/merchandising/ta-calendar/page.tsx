"use client"

import * as React from "react"
import {
    IconCalendar,
    IconPlus,
    IconRefresh,
    IconLoader2,
    IconCircleCheck,
    IconAlertCircle,
    IconClock,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, TnaCalendar, TnaMilestone } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function TACalendarPage() {
    const { activeCompanyId } = useCompanyContext()
    const [orders, setOrders] = React.useState<Order[]>([])
    const [selectedOrderId, setSelectedOrderId] = React.useState("")
    const [calendar, setCalendar] = React.useState<TnaCalendar | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [generating, setGenerating] = React.useState(false)

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

    const fetchTna = React.useCallback(async (orderId: string) => {
        if (!orderId) return
        try {
            setLoading(true)
            const data = await merchandisingService.getTnaByOrder(orderId)
            setCalendar(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load T&A calendar")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    React.useEffect(() => {
        if (selectedOrderId) fetchTna(selectedOrderId)
    }, [selectedOrderId, fetchTna])

    const handleGenerate = async () => {
        if (!selectedOrderId) return
        try {
            setGenerating(true)
            const data = await merchandisingService.generateTnaForOrder(selectedOrderId)
            setCalendar(data)
            toast.success("T&A calendar generated")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate T&A")
        } finally {
            setGenerating(false)
        }
    }

    const milestones = calendar?.milestones ?? []
    const completed = milestones.filter((m) => m.status === "Completed").length
    const delayed = milestones.filter((m) => m.status === "Delayed").length
    const pending = milestones.length - completed - delayed
    const selectedOrder = orders.find((o) => o.id === selectedOrderId)

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">T&A Calendar</h1>
                    <p className="text-sm text-muted-foreground font-medium">Order milestones and production timeline</p>
                </div>
                <div className="flex items-center gap-3">
                    <NativeSelect
                        className="h-10 w-56"
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
                    <Button variant="ghost" size="icon" className="h-10 w-10 border border-border rounded-lg" onClick={() => fetchTna(selectedOrderId)}>
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button className="h-10 px-6 font-semibold" onClick={handleGenerate} disabled={!selectedOrderId || generating}>
                        <IconPlus className="size-4 mr-2" />
                        {generating ? "Generating..." : "Generate T&A"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Completed" value={completed.toString()} icon={IconCircleCheck} color="text-emerald-600" />
                <KPICard title="Delayed" value={delayed.toString()} icon={IconAlertCircle} color="text-rose-600" />
                <KPICard title="Pending" value={pending.toString()} icon={IconClock} color="text-blue-600" />
                <KPICard title="Calendar Status" value={calendar?.status ?? "None"} icon={IconCalendar} color="text-indigo-600" />
            </div>

            <Card className="border border-border shadow-none">
                <CardHeader className="border-b">
                    <CardTitle className="text-base font-bold">
                        Milestones — {selectedOrder?.orderNo ?? "No order"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <IconLoader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : !calendar ? (
                        <div className="py-16 text-center text-muted-foreground text-sm">
                            No T&A calendar for this order. Click Generate T&A to create one.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {milestones
                                .slice()
                                .sort((a, b) => a.sequenceNo - b.sequenceNo)
                                .map((m) => (
                                    <MilestoneRow key={m.id} milestone={m} />
                                ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function MilestoneRow({ milestone }: { milestone: TnaMilestone }) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-muted/20">
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground w-8">{milestone.sequenceNo}</span>
                <div>
                    <p className="font-bold text-sm">{milestone.milestoneName}</p>
                    <p className="text-xs text-muted-foreground">
                        Planned: {format(new Date(milestone.plannedDate), "MMM dd, yyyy")}
                        {milestone.actualDate && ` · Actual: ${format(new Date(milestone.actualDate), "MMM dd, yyyy")}`}
                    </p>
                </div>
            </div>
            <Badge
                variant="outline"
                className={cn(
                    "text-[10px] font-bold uppercase",
                    milestone.status === "Completed" && "text-emerald-600 border-emerald-200",
                    milestone.status === "Delayed" && "text-rose-600 border-rose-200",
                    milestone.status === "InProgress" && "text-blue-600 border-blue-200"
                )}
            >
                {milestone.status}
            </Badge>
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
        <Card className="border shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center", color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className="text-lg font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
