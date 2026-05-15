"use client"

import * as React from "react"
import {
    IconArrowLeft,
    IconChartBar,
    IconSearch,
    IconLayoutGrid,
    IconPackage,
    IconClipboardList,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { merchandisingService } from "@/lib/services/merchandising"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface GlobalSummary {
    totalPieces: number;
    totalPrograms: number;
    totalBuyers: number;
    buyerDistribution: any[];
    sizeDistribution: any[];
    recentPrograms: any[];
}

export default function OrderSummaryPage() {
    const router = useRouter()
    const [summary, setSummary] = React.useState<GlobalSummary | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getGlobalOrderSummary(1)
            setSummary(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load analytics data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredRecent = summary?.recentPrograms.filter(p =>
        p.programNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        )
    }

    if (!summary) return null;

    return (
        <div className="flex flex-col py-0 bg-background min-h-screen">
            {/* Top Action Bar */}
            <div className="bg-card border-b border-border px-4 lg:px-8 py-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            onClick={() => router.push("/merchandising/orders")}
                        >
                            <IconArrowLeft className="size-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                                Order Summary
                            </h1>
                            <p className="text-[11px] font-medium text-muted-foreground mt-1">Global performance and distributions</p>
                        </div>
                    </div>
                    <div className="relative max-w-sm w-full">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search programs..."
                            className="pl-9 h-10 bg-card border-border rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 px-4 lg:px-8 max-w-[1600px] mx-auto w-full pb-10">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card p-5 rounded-lg border border-border shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Quantity</p>
                            <p className="text-2xl font-bold text-foreground mt-0.5">{summary.totalPieces.toLocaleString()}</p>
                        </div>
                        <IconPackage className="size-6 text-muted-foreground/20" />
                    </div>
                    <div className="bg-card p-5 rounded-lg border border-border shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Orders</p>
                            <p className="text-2xl font-bold text-foreground mt-0.5">{summary.totalPrograms}</p>
                        </div>
                        <IconClipboardList className="size-6 text-muted-foreground/20" />
                    </div>
                    <div className="bg-card p-5 rounded-lg border border-border shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Buyers</p>
                            <p className="text-2xl font-bold text-foreground mt-0.5">{summary.totalBuyers}</p>
                        </div>
                        <IconChartBar className="size-6 text-muted-foreground/20" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border shadow-sm rounded-lg">
                        <CardHeader className="pb-3 px-6 pt-6">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <IconChartBar className="size-4 text-muted-foreground" /> Buyer Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-5">
                            {summary.buyerDistribution.map((buyer, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-foreground/80">{buyer.buyerName}</span>
                                        <span className="text-xs font-bold text-foreground">{buyer.totalQty.toLocaleString()} PCS</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${buyer.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm rounded-lg">
                        <CardHeader className="pb-3 px-6 pt-6">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <IconLayoutGrid className="size-4 text-muted-foreground" /> Size Matrix Aggregate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="grid grid-cols-3 gap-3">
                                {summary.sizeDistribution.map((size, idx) => (
                                    <div key={idx} className="bg-muted/30 p-3 rounded-md border border-border text-center">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{size.sizeName}</p>
                                        <p className="text-sm font-bold text-foreground mt-0.5">{size.totalQty.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border px-6 py-4">
                        <CardTitle className="text-sm font-bold">Recent Orders</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-muted-foreground uppercase text-[10px]">Order ID</th>
                                    <th className="px-6 py-3 font-bold text-muted-foreground uppercase text-[10px]">Buyer</th>
                                    <th className="px-6 py-3 font-bold text-muted-foreground uppercase text-[10px] text-center">Date</th>
                                    <th className="px-6 py-3 font-bold text-muted-foreground uppercase text-[10px] text-right">Qty</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {filteredRecent.length > 0 ? (
                                    filteredRecent.map((p) => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4 font-bold text-foreground">{p.programNumber}</td>
                                            <td className="px-6 py-4 text-muted-foreground font-medium">{p.buyerName}</td>
                                            <td className="px-6 py-4 text-center text-muted-foreground text-xs">
                                                {p.orderDate ? (
                                                    (() => {
                                                        const d = new Date(p.orderDate);
                                                        return isNaN(d.getTime()) ? "N/A" : format(d, 'dd MMM, yyyy');
                                                    })()
                                                ) : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-foreground">{p.totalQty.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/merchandising/orders/details/${p.id}`}>
                                                    <Button variant="outline" size="sm" className="h-7 text-[11px] font-bold">Details</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No results</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
