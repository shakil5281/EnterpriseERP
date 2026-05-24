"use client"

import * as React from "react"
import {
    IconLayoutDashboard,
    IconRefresh,
    IconPackage,
    IconArrowRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { merchandisingService } from "@/lib/services/merchandising"
import type { OrderPipelineReportRow } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function MerchandisingDashboard() {
    const router = useRouter()
    const { activeCompanyId } = useCompanyContext()
    const [pipeline, setPipeline] = React.useState<OrderPipelineReportRow[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const data = await merchandisingService.getOrderPipelineReport(activeCompanyId)
            setPipeline(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const totalOrders = pipeline.reduce((acc, row) => acc + row.orderCount, 0)
    const totalQty = pipeline.reduce((acc, row) => acc + row.totalQuantity, 0)
    const totalValue = pipeline.reduce((acc, row) => acc + row.totalValue, 0)

    return (
        <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Merchandising Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">Order pipeline by status</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
                    <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SimpleStatCard title="Total Orders" value={totalOrders.toLocaleString()} icon={IconLayoutDashboard} description="Across all statuses" />
                <SimpleStatCard title="Total Quantity" value={totalQty.toLocaleString()} icon={IconPackage} description="PCS in pipeline" />
                <SimpleStatCard title="Pipeline Value" value={`$${totalValue.toLocaleString()}`} icon={IconPackage} description="Combined order value" />
            </div>

            <Card className="border shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-base font-bold">Order Pipeline</CardTitle>
                    <Button variant="link" size="sm" onClick={() => router.push("/merchandising/orders")} className="h-auto p-0 text-primary">
                        View Orders <IconArrowRight className="size-3 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-10 text-center text-muted-foreground">Loading...</div>
                    ) : pipeline.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground italic">No pipeline data</div>
                    ) : (
                        <div className="divide-y">
                            {pipeline.map((row) => (
                                <div key={row.orderStatus} className="flex items-center justify-between p-4 hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="font-bold text-xs uppercase">
                                            {row.orderStatus}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{row.orderCount} orders</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{row.totalQuantity.toLocaleString()} PCS</p>
                                        <p className="text-xs text-muted-foreground">${row.totalValue.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function SimpleStatCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    description?: string
}) {
    return (
        <Card className="border shadow-none">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                        {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
                    </div>
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
