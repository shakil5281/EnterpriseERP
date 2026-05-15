"use client"

import * as React from "react"
import {
    IconLayoutDashboard,
    IconCurrencyDollar,
    IconRefresh,
    IconPackage,
    IconAlertCircle,
    IconTrendingUp,
    IconArrowRight,
    IconHistory
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { merchandisingService, ProgramOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function MerchandisingDashboard() {
    const router = useRouter()
    const [programs, setPrograms] = React.useState<ProgramOrder[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getAllProgramOrders(1)
            setPrograms(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const totalOrderQty = programs.reduce((acc, p) => 
        acc + (p.articles?.reduce((articleAcc, a) => articleAcc + (a.totalQty || 0), 0) || 0), 0)
    
    const activeArticles = programs.reduce((acc, p) => acc + (p.articles?.length || 0), 0)

    return (
        <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Simple Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Merchandising Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">Summary of active production programs and article volume.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
                    <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Simple Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SimpleStatCard
                    title="Total Programs"
                    value={programs.length.toString()}
                    icon={IconLayoutDashboard}
                    description="Active production orders"
                />
                <SimpleStatCard
                    title="Total Article Qty"
                    value={totalOrderQty.toLocaleString()}
                    icon={IconPackage}
                    description="PCS current production"
                />
                <SimpleStatCard
                    title="Articles Tracked"
                    value={activeArticles.toString()}
                    icon={IconAlertCircle}
                    description="Unique article specifications"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                {/* Recent Programs List */}
                <Card className="border shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-bold">Recent Programs</CardTitle>
                        <Button variant="link" size="sm" onClick={() => router.push("/merchandising/orders")} className="h-auto p-0 text-primary">
                            View All <IconArrowRight className="size-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                        {loading ? (
                            <div className="p-10 text-center"><IconRefresh className="animate-spin inline mr-2 text-muted-foreground" /> Loading...</div>
                        ) : programs.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground italic">No programs found</div>
                        ) : programs.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                <div>
                                    <p className="font-bold text-sm tracking-tight">{p.programNumber}</p>
                                    <p className="text-xs text-muted-foreground">{p.buyerName || "No Buyer"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{(p.articles?.reduce((a, b) => a + (b.totalQty || 0), 0) || 0).toLocaleString()} PCS</p>
                                    <p className="text-xs text-muted-foreground">{p.orderDate ? new Date(p.orderDate).toLocaleDateString() : "N/A"}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* System Activity Hub */}
                <Card className="border shadow-none bg-muted/10">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">System Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-background border p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <IconTrendingUp className="text-emerald-500 size-5" />
                                <div>
                                    <p className="text-xs font-bold">Relational Health</p>
                                    <p className="text-[10px] text-muted-foreground">Masters are correctly linked.</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">ACTIVE</span>
                        </div>
                        <div className="bg-background border p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <IconHistory className="text-blue-500 size-5" />
                                <div>
                                    <p className="text-xs font-bold">Last Synchronized</p>
                                    <p className="text-[10px] text-muted-foreground">Just now</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold" onClick={fetchData}>RESYNC</Button>
                        </div>
                        <div className="pt-2">
                           <Button className="w-full font-bold h-10" onClick={() => router.push("/merchandising/orders/import")}>
                               <IconPackage className="size-4 mr-2" /> Import New Orders
                           </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function SimpleStatCard({ title, value, icon: Icon, description }: any) {
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
