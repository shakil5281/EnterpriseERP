"use client"

import * as React from "react"
import { merchandisingService } from "@/lib/services/merchandising"
import type { ProgramOrderWorksheet } from "@/lib/types/merchandising"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import {
    IconArrowLeft,
    IconLoader2,
    IconTableAlias,
    IconSearch,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function OrderWorksheetPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const filterOrderId = searchParams.get("orderId")
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [worksheets, setWorksheets] = React.useState<ProgramOrderWorksheet[]>([])

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const orders = await merchandisingService.getOrders()
            const targetOrders = filterOrderId ? orders.filter(o => o.id === filterOrderId) : orders
            const results = await Promise.all(
                targetOrders.map(async (o) => {
                    try {
                        return await merchandisingService.getOrderWorksheet(o.id)
                    } catch {
                        return null
                    }
                })
            )
            setWorksheets(results.filter((w): w is ProgramOrderWorksheet => w !== null))
        } catch (error) {
            console.error(error)
            toast.error("Failed to load worksheet data")
        } finally {
            setLoading(false)
        }
    }, [filterOrderId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filtered = worksheets.filter(w => {
        if (!searchTerm) return true
        const q = searchTerm.toLowerCase()
        return (
            w.programNumber.toLowerCase().includes(q) ||
            w.buyerName.toLowerCase().includes(q) ||
            w.articles.some(a => a.styleNo.toLowerCase().includes(q))
        )
    })

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <header className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/merchandising/orders">
                        <Button variant="ghost" size="icon"><IconArrowLeft className="size-4" /></Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <IconTableAlias className="size-5 text-primary" />
                        <div>
                            <h1 className="text-sm font-bold">Order Worksheet</h1>
                            <p className="text-[10px] text-muted-foreground uppercase">Program breakdown view</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." className="w-48 pl-8 h-8 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <IconLoader2 className="size-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Loading worksheets...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-20">No worksheet data found.</p>
                ) : (
                    filtered.map((ws) => (
                        <div key={ws.id} className="border rounded-xl overflow-hidden bg-card shadow-sm">
                            <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
                                <div>
                                    <p className="font-bold">{ws.programNumber}</p>
                                    <p className="text-xs text-muted-foreground">{ws.buyerName} · {ws.orderStatus}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => router.push(`/merchandising/orders/details/${ws.id}`)}>
                                    Open Order
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-muted/30 border-b">
                                            <th className="p-2 text-left">Style</th>
                                            <th className="p-2 text-left">Color</th>
                                            <th className="p-2 text-center">Size</th>
                                            <th className="p-2 text-center">Qty</th>
                                            <th className="p-2 text-left">Pack Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ws.articles.flatMap(article =>
                                            article.colors.flatMap(color =>
                                                color.sizeBreakdowns.map((sb, idx) => (
                                                    <tr key={`${ws.id}-${article.styleNo}-${color.colorName}-${sb.sizeName}-${idx}`} className={cn("border-b hover:bg-muted/20")}>
                                                        <td className="p-2 font-medium">{article.styleNo}</td>
                                                        <td className="p-2">{color.colorName}</td>
                                                        <td className="p-2 text-center">{sb.sizeName}</td>
                                                        <td className="p-2 text-center font-bold">{sb.quantity}</td>
                                                        <td className="p-2 text-muted-foreground">{sb.buyerPackingNumber || "—"}</td>
                                                    </tr>
                                                ))
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <footer className="h-8 border-t bg-muted/30 flex items-center px-4 text-[10px] text-muted-foreground shrink-0">
                Displaying {filtered.length} worksheet{filtered.length === 1 ? "" : "s"}
            </footer>
        </div>
    )
}
