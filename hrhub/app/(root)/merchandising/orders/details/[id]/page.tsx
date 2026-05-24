"use client"

import * as React from "react"
import { merchandisingService } from "@/lib/services/merchandising"
import type { OrderDetails, ProgramOrderWorksheet } from "@/lib/types/merchandising"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    IconPrinter,
    IconDownload,
    IconLoader2,
    IconArrowLeft,
    IconEdit,
    IconTrash,
    IconAlertCircle,
    IconTableAlias,
} from "@tabler/icons-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const [details, setDetails] = React.useState<OrderDetails | null>(null)
    const [worksheet, setWorksheet] = React.useState<ProgramOrderWorksheet | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [detailsData, worksheetData] = await Promise.all([
                merchandisingService.getOrderDetails(orderId),
                merchandisingService.getOrderWorksheet(orderId),
            ])
            setDetails(detailsData)
            setWorksheet(worksheetData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch order details")
        } finally {
            setLoading(false)
        }
    }, [orderId])

    React.useEffect(() => {
        if (orderId) fetchData()
    }, [fetchData, orderId])

    const handleCancel = async () => {
        try {
            setIsDeleting(true)
            await merchandisingService.cancelOrder(orderId)
            toast.success("Order cancelled")
            router.push("/merchandising/orders")
        } catch {
            toast.error("Failed to cancel order")
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-screen">
                <IconLoader2 className="size-10 animate-spin text-orange-600" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading order...</p>
            </div>
        )
    }

    if (!details || !worksheet) return null

    const { order } = details
    const programTotal = worksheet.articles.reduce((acc, item) => acc + item.totalQty, 0)

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/merchandising/orders">
                        <Button variant="outline" size="icon" className="rounded-full size-9">
                            <IconArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase">Order Details</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Order: {order.orderNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/merchandising/orders/edit/${orderId}`}>
                        <Button variant="outline" size="sm"><IconEdit className="mr-2 size-4" /> Edit</Button>
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600"><IconTrash className="mr-2 size-4" /> Cancel</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2"><IconAlertCircle className="text-red-600" /> Cancel Order</AlertDialogTitle>
                                <AlertDialogDescription>Cancel order <b>{order.orderNo}</b>? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancel}>{isDeleting ? "Processing..." : "Confirm Cancel"}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" size="sm" onClick={() => window.print()}><IconPrinter className="mr-2 size-4" /> Print</Button>
                    <Button variant="outline" size="sm" onClick={() => merchandisingService.exportOrder(orderId)}><IconDownload className="mr-2 size-4" /> Export</Button>
                    <Link href={`/merchandising/orders/worksheet?orderId=${orderId}`}>
                        <Button variant="outline" size="sm"><IconTableAlias className="mr-2 size-4" /> Worksheet</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-6 bg-card rounded-2xl border">
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Order No</Label><p className="font-black uppercase">{order.orderNo}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Buyer</Label><p className="font-black uppercase">{worksheet.buyerName}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Status</Label><Badge variant="outline">{order.orderStatus}</Badge></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Order Date</Label><p className="font-black">{order.orderDate ? format(new Date(order.orderDate), "dd MMM yyyy") : "N/A"}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Total Qty</Label><p className="font-black">{order.totalOrderQty.toLocaleString()} PCS</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Unit Price</Label><p className="font-black">{order.currencyCode} {order.unitPrice.toLocaleString()}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Total Value</Label><p className="font-black">{order.currencyCode} {order.totalValue.toLocaleString()}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Fabric</Label><p className="text-sm">{worksheet.fabricDescription || "—"}</p></div>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-sm uppercase tracking-wider">Worksheet Matrix</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-primary text-primary-foreground font-black uppercase text-[10px]">
                                <th className="p-2 border-r">SL</th>
                                <th className="p-2 border-r">Style</th>
                                <th className="p-2 border-r">Color</th>
                                <th className="p-2 border-r">Size</th>
                                <th className="p-2 border-r">Qty</th>
                                <th className="p-2">Pack Ref</th>
                            </tr>
                        </thead>
                        <tbody>
                            {worksheet.articles.flatMap((article, articleIdx) =>
                                article.colors.flatMap(color =>
                                    color.sizeBreakdowns.map((sb, sbIdx) => (
                                        <tr key={`${article.styleNo}-${color.colorName}-${sb.sizeName}-${sbIdx}`} className="border-b hover:bg-muted/30">
                                            <td className="p-2 text-center">{articleIdx + 1}</td>
                                            <td className="p-2 font-bold">{article.styleNo}</td>
                                            <td className="p-2">{color.colorName}</td>
                                            <td className="p-2 text-center">{sb.sizeName}</td>
                                            <td className="p-2 text-center font-bold">{sb.quantity}</td>
                                            <td className="p-2 text-center text-muted-foreground">{sb.buyerPackingNumber || "—"}</td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted font-black">
                                <td colSpan={4} className="p-3 text-right uppercase text-[10px]">Grand Total</td>
                                <td className="p-3 text-center">{programTotal.toLocaleString()}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>

            {details.colorSizeBreakdowns.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-sm uppercase tracking-wider">Color / Size Breakdown (API)</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b"><th className="p-2 text-left">Color</th><th className="p-2 text-left">Size</th><th className="p-2 text-right">Qty</th></tr></thead>
                            <tbody>
                                {details.colorSizeBreakdowns.map(row => (
                                    <tr key={row.id} className="border-b">
                                        <td className="p-2">{row.colorName}</td>
                                        <td className="p-2">{row.sizeName}</td>
                                        <td className="p-2 text-right font-bold">{row.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
