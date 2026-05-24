"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { merchandisingService } from "@/lib/services/merchandising"
import type { ProgramOrderWorksheet, MasterDataDto } from "@/lib/types/merchandising"
import { format } from "date-fns"
import { toast } from "sonner"
import {
    IconArrowLeft,
    IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AccessoryProcurementMatrixProps {
    title: string;
    accessoryType: string;
}

export default function AccessoryProcurementMatrix({ title }: AccessoryProcurementMatrixProps) {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const [worksheet, setWorksheet] = React.useState<ProgramOrderWorksheet | null>(null)
    const [masterColors, setMasterColors] = React.useState<MasterDataDto[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [worksheetData, colorsData] = await Promise.all([
                merchandisingService.getOrderWorksheet(orderId),
                merchandisingService.getMasterData("colors"),
            ])
            setWorksheet(worksheetData)
            setMasterColors(colorsData)
        } catch (error) {
            console.error(error)
            toast.error(`Failed to fetch ${title} data`)
        } finally {
            setLoading(false)
        }
    }, [orderId, title])

    React.useEffect(() => {
        if (orderId) fetchData()
    }, [fetchData, orderId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-screen">
                <IconLoader2 className="size-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading {title} Sheet...</p>
            </div>
        )
    }

    if (!worksheet) return null

    const programTotal = worksheet.articles.reduce((acc, item) => acc + item.totalQty, 0)

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => router.back()}>
                        <IconArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase">{title} Procurement Matrix</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Order: {worksheet.programNumber} | {worksheet.buyerName}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-card rounded-2xl border">
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Program #</Label><p className="text-sm font-black">{worksheet.programNumber}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Buyer</Label><p className="text-sm font-black">{worksheet.buyerName}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Status</Label><p className="text-sm font-black">{worksheet.orderStatus}</p></div>
                <div><Label className="text-[10px] font-black uppercase text-muted-foreground">Order Date</Label><p className="text-sm font-black">{worksheet.orderDate ? format(new Date(worksheet.orderDate), "dd MMM yyyy") : "N/A"}</p></div>
            </div>

            <div className="border rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-primary text-primary-foreground font-black uppercase text-[10px] text-center">
                            <th className="p-3 border-r">Style</th>
                            <th className="p-3 border-r">Garment Color</th>
                            <th className="p-3 border-r">Size</th>
                            <th className="p-3 border-r">Qty to Book</th>
                            <th className="p-3 border-r">{title} Color Spec</th>
                        </tr>
                    </thead>
                    <tbody>
                        {worksheet.articles.flatMap(article =>
                            article.colors.flatMap(color =>
                                color.sizeBreakdowns.map((sb, idx) => (
                                    <tr key={`${article.styleNo}-${color.colorName}-${sb.sizeName}-${idx}`} className="border-b hover:bg-muted/50">
                                        <td className="p-2 text-center font-bold uppercase text-blue-600">{article.styleNo}</td>
                                        <td className="p-2 font-black uppercase pl-4">{color.colorName}</td>
                                        <td className="p-2 text-center">{sb.sizeName}</td>
                                        <td className="p-2 text-center font-black bg-orange-50 dark:bg-orange-950/20 text-orange-700">{sb.quantity}</td>
                                        <td className="p-2">
                                            <Select disabled>
                                                <SelectTrigger className="h-8 text-[10px] font-black uppercase">
                                                    <SelectValue placeholder="SELECT COLOR" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {masterColors.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-muted font-black uppercase text-[10px]">
                            <td colSpan={3} className="p-4 text-left">Total Order Quantity</td>
                            <td className="p-4 text-center bg-orange-600 text-white">{programTotal.toLocaleString()} PCS</td>
                            <td />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}
