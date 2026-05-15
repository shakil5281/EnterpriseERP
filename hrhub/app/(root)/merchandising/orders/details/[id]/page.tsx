"use client"

import * as React from "react"
import { merchandisingService, ProgramOrder, ProgramArticle } from "@/lib/services/merchandising"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    IconFileDescription,
    IconPrinter,
    IconDownload,
    IconLoader2,
    IconArrowLeft,
    IconBuildingFactory,
    IconInfoCircle,
    IconTableAlias,
    IconEdit,
    IconTrash,
    IconAlertCircle,
    IconCalculator,
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
import { ButtonGroup } from "@/components/ui/button-group"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = React.useState<ProgramOrder | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleDelete = async () => {
        if (!order) return
        try {
            setIsDeleting(true)
            await merchandisingService.deleteProgramOrder(order.id)
            toast.success("Order deleted successfully")
            router.push("/merchandising/orders")
        } catch {
            toast.error("Failed to delete order")
        } finally {
            setIsDeleting(false)
        }
    }

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getProgramOrder(parseInt(params.id as string))
            setOrder(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch order details")
        } finally {
            setLoading(false)
        }
    }, [params.id])

    React.useEffect(() => {
        if (params.id) fetchData()
    }, [fetchData, params.id])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-screen">
                <IconLoader2 className="size-10 animate-spin text-orange-600" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading Order Analysis...</p>
            </div>
        )
    }

    if (!order) return null

    const programTotal = order.articles?.reduce((acc: number, item: ProgramArticle) => acc + item.totalQty, 0) || 0

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 bg-background min-h-screen print:p-0 transition-colors duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-border print:hidden gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/merchandising/orders">
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:translate-x-[-1px] transition-all border-border bg-card text-foreground shrink-0 size-8 md:size-9">
                            <IconArrowLeft className="size-3.5 md:size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-sm md:text-xl font-black tracking-tight text-foreground uppercase leading-tight">Order Analysis View</h1>
                        <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-tighter">Program Ref: {order.programNumber}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Mobile Actions Dropdown */}
                    <div className="flex md:hidden w-full">
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full justify-between font-black uppercase text-[10px] h-8 border-primary/20 bg-primary/5 text-primary">
                                        Action Menu
                                        <IconLoader2 className="ml-2 size-3 animate-spin hidden" />
                                        <IconEdit className="ml-2 size-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/merchandising/orders/edit/${params.id}`} className="flex items-center">
                                            <IconEdit className="mr-2 size-4 text-primary" /> Edit Order
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.print()}>
                                        <IconPrinter className="mr-2 size-4 text-orange-600" /> Print Order
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => merchandisingService.exportOrder(order.id)}>
                                        <IconDownload className="mr-2 size-4 text-green-600" /> Export Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/merchandising/orders/worksheet">
                                            <IconTableAlias className="mr-2 size-4 text-orange-400" /> Worksheet
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem variant="destructive">
                                            <IconTrash className="mr-2 size-4" /> Delete Order
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent className="max-w-[90vw] bg-card border-border">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="uppercase font-black flex items-center gap-2 text-foreground text-sm">
                                        <IconAlertCircle className="text-red-600 dark:text-red-500 size-5" /> Confirm Deletion
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground font-medium text-xs">
                                        Are you sure you want to delete <b className="text-foreground">{order.programNumber}</b>? This will permanently erase all article breakdowns and size matrices.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col gap-2">
                                    <AlertDialogCancel className="font-bold uppercase text-[10px] bg-muted border-border mt-0">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 font-bold uppercase text-[10px] rounded-lg shadow-lg shadow-red-600/20">
                                        {isDeleting ? "Processing..." : "Confirm Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Desktop Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link href={`/merchandising/orders/edit/${params.id}`}>
                            <Button variant="outline" size="sm" className="border-border font-bold uppercase text-xs h-9 hover:bg-muted">
                                <IconEdit className="mr-2 size-4 text-primary" /> Edit
                            </Button>
                        </Link>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold uppercase text-xs h-9">
                                    <IconTrash className="mr-2 size-4" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md bg-card border-border">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="uppercase font-black flex items-center gap-2 text-foreground">
                                        <IconAlertCircle className="text-red-600 dark:text-red-500 size-5" /> Confirm Deletion
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground font-medium">
                                        Are you sure you want to delete <b className="text-foreground">{order.programNumber}</b>? This will permanently erase all article breakdowns and size matrices.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col md:flex-row gap-2">
                                    <AlertDialogCancel className="font-bold uppercase text-xs bg-muted border-border mt-0">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 font-bold uppercase text-xs rounded-lg shadow-lg shadow-red-600/20">
                                        {isDeleting ? "Processing..." : "Confirm Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" size="sm" onClick={() => window.print()} className="border-border font-bold uppercase text-xs h-9 hover:bg-muted">
                            <IconPrinter className="mr-2 size-4 text-orange-600" /> Print
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs h-9 border-none shadow-md"
                            onClick={() => merchandisingService.exportOrder(order.id)}
                        >
                            <IconDownload className="mr-2 size-4" /> Export
                        </Button>
                        <Link href="/merchandising/orders/worksheet">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-slate-900 text-slate-100 hover:bg-slate-800 font-bold uppercase text-xs h-9 border-none shadow-md"
                            >
                                <IconTableAlias className="mr-2 size-4 text-orange-400" /> Worksheet
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Professional Production Sheet Layout */}
            <div className="w-full">
                {/* Visual Header */}
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className="text-lg md:text-2xl font-black text-foreground tracking-tight leading-none uppercase">{order.factoryName}</h2>
                    <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[.2em] leading-tight">{order.factoryAddress}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-12 gap-y-6 mt-6 p-4 md:p-6 bg-card rounded-2xl border border-border">
                        <div className="space-y-0.5">
                            <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Program #</Label>
                            <p className="text-xs md:text-sm font-black text-foreground uppercase">{order.programNumber}</p>
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Buyer Entity</Label>
                            <p className="text-xs md:text-sm font-black text-foreground uppercase">{order.buyerName}</p>
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Customer</Label>
                            <p className="text-xs md:text-sm font-black text-foreground uppercase">{order.customerName || "---"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Order Date</Label>
                            <p className="text-xs md:text-sm font-black text-foreground uppercase">
                                {order.orderDate ? (
                                    (() => {
                                        const d = new Date(order.orderDate);
                                        return isNaN(d.getTime()) ? "N/A" : format(d, 'dd MMM yyyy');
                                    })()
                                ) : "N/A"}
                            </p>
                        </div>
                        <div className="col-span-2 space-y-0.5">
                            <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Fabric Composition</Label>
                            <p className="text-xs md:text-sm font-bold text-foreground/80">{order.fabricDescription}</p>
                        </div>
                        <div className="col-span-2 space-y-0.5">
                            <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Program Cycle</Label>
                            <p className="text-xs md:text-sm font-bold text-foreground/80 uppercase">{order.programName}</p>
                        </div>
                    </div>
                </div>

                {/* Mobile Scroll Hint */}
                <div className="flex items-center gap-2 mb-2 md:hidden text-[10px] font-bold text-orange-600 uppercase animate-pulse">
                    <IconInfoCircle className="size-3" />
                    <span>Scroll horizontally to view full matrix</span>
                </div>

                {/* Multiple Data Sheets Table */}
                <div className="border border-border rounded-lg overflow-hidden shadow-sm overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    <table className="w-full text-xs border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest text-center">
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>SL</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Old Art</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>New Art</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Label</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Pack</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Item</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Total Qty</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Color</th>
                                <th className="p-2 border-b border-primary-foreground/10" colSpan={9}>Size Breakdown Matrix</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>Row Qty</th>
                                <th className="p-3 border-r border-primary-foreground/10" rowSpan={2}>G.Total</th>
                                <th className="p-3" rowSpan={2}>Buyer Order#</th>
                            </tr>
                            <tr className="bg-primary/90 text-primary-foreground/80 font-bold text-[9px]">
                                {['M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL', '5XL', '6XL'].map(s => (
                                    <th key={s} className="p-2 border-r border-primary-foreground/10">{s}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {order.articles?.map((item: any, itemIdx: number) => {
                                // Count all breakdowns across all colors for this item
                                const totalRows = item.colors.reduce((acc: number, color: any) => acc + color.sizeBreakdowns.length, 0);
                                let rowCounter = 0;

                                return item.colors.map((color: any, colorIdx: number) => {
                                    return color.sizeBreakdowns.map((sb: any, sbIdx: number) => {
                                        const isFirstRowOfItem = rowCounter === 0;
                                        rowCounter++;

                                        return (
                                            <tr key={`${item.id}-${color.id}-${sb.id}`} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                 {isFirstRowOfItem && (
                                                    <>
                                                        <td className="p-3 text-center font-black border-r border-border align-middle bg-muted/30 text-foreground" rowSpan={totalRows}>{itemIdx + 1}</td>
                                                        <td className="p-3 text-center font-bold border-r border-border align-middle uppercase text-foreground" rowSpan={totalRows}>{item.oldArticleNo}</td>
                                                        <td className="p-3 text-center font-bold border-r border-border align-middle uppercase text-blue-600 dark:text-blue-400" rowSpan={totalRows}>{item.newArticleNo}</td>
                                                        <td className="p-3 text-center font-bold border-r border-border align-middle uppercase opacity-60 text-foreground" rowSpan={totalRows}>{order.customerName || "RIFLE"}</td>
                                                         <td className="p-3 text-center border-r border-border align-middle" rowSpan={totalRows}>
                                                            <Badge variant="outline" className="text-[9px] font-black rounded-sm border-orange-200 dark:border-orange-950 text-orange-600 dark:text-orange-400 uppercase">
                                                                {item.packType === 1 ? 'A' : item.packType === 2 ? 'B' : 'A-B'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-center font-black border-r border-border align-middle uppercase text-[10px] text-foreground" rowSpan={totalRows}>{item.itemName}</td>
                                                        <td className="p-3 text-center font-black border-r border-border align-middle text-foreground bg-muted/20" rowSpan={totalRows}>{item.totalQty.toLocaleString()}</td>
                                                    </>
                                                )}

                                                 <td className="p-2 border-r border-border font-black uppercase text-[10px] text-muted-foreground pl-4">{color.colorName}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.sizeM || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.sizeL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.sizeXL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.sizeXXL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.sizeXXXL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.size3XL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.size4XL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.size5XL || "0"}</td>
                                                <td className="p-2 border-r border-border text-center font-medium text-foreground">{sb.size6XL || "0"}</td>

                                                <td className="p-2 border-r border-border text-center font-black bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400">{sb.rowTotal}</td>

                                                {isFirstRowOfItem && (
                                                    <td className="p-3 text-center font-black border-r border-border align-middle bg-primary text-primary-foreground" rowSpan={totalRows}>
                                                        {item.totalQty.toLocaleString()}
                                                    </td>
                                                )}

                                                <td className="p-2 text-center text-[10px] opacity-60 text-muted-foreground italic">{sb.buyerPackingNumber || "--"}</td>
                                            </tr>
                                        );
                                    });
                                });
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted font-black uppercase text-[10px] border-t border-border">
                                <td colSpan={7} className="p-4 text-left border-r border-border tracking-widest text-muted-foreground">Summary Aggregation</td>
                                <td colSpan={11} className="p-4 text-right border-r border-border opacity-50 text-foreground">Grand Program Accumulation</td>
                                <td className="p-4 text-center bg-orange-600 text-white shadow-inner">{programTotal.toLocaleString()} PCS</td>
                                <td className="p-4 bg-muted"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Notes */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 print:mt-24">
                    <div className="border-t border-border pt-4 flex flex-col items-center">
                        <div className="h-16 w-32 border-b border-dashed border-border mb-2"></div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Merchandiser Signature</p>
                    </div>
                    <div className="border-t border-border pt-4 flex flex-col items-center">
                        <div className="h-16 w-32 border-b border-dashed border-border mb-2"></div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Production Manager</p>
                    </div>
                    <div className="border-t border-border pt-4 flex flex-col items-center">
                        <div className="h-16 w-32 border-b border-dashed border-border mb-2"></div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Authorized Approval</p>
                    </div>
                </div>
            </div>
        </div>
    )
}