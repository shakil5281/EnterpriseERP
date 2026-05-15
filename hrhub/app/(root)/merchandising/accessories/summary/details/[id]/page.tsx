"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
    merchandisingService, 
    AccessoryOrderSummary 
} from "@/lib/services/merchandising"
import {
    IconArrowLeft,
    IconLoader2,
    IconPackage,
    IconClipboardList,
    IconPalette,
    IconScale,
    IconChevronRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function AccessoryOrderSummaryDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [summary, setSummary] = React.useState<AccessoryOrderSummary | null>(null)
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const id = parseInt(params.id as string)
            const data = await merchandisingService.getAccessoryOrderSummary(id)
            setSummary(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch order summary")
        } finally {
            setLoading(false)
        }
    }, [params.id])

    React.useEffect(() => {
        if (params.id) fetchData()
    }, [fetchData, params.id])

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "accessoryType",
            header: "Accessory Type",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                        <IconPackage className="size-4.5 text-primary" />
                    </div>
                    <span className="font-bold text-foreground uppercase tracking-tight">{row.original.accessoryType}</span>
                </div>
            )
        },
        {
            accessorKey: "totalRequiredQuantity",
            header: "Total Required",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-foreground">{row.original.totalRequiredQuantity.toLocaleString()}</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Units Requested</span>
                </div>
            )
        },
        {
            accessorKey: "mappedColors",
            header: "Color Mapping",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Badge variant={row.original.mappedColors === row.original.totalSizeBreakdowns ? "success" : "warning"} className="font-bold">
                        {row.original.mappedColors} / {row.original.totalSizeBreakdowns}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Colors Linked</span>
                </div>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const slug = row.original.accessoryType.toLowerCase().replace(/\s+/g, '-')
                const orderId = params.id
                return (
                    <div className="flex justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 group text-xs font-bold gap-1 hover:text-primary transition-all"
                            onClick={() => router.push(`/merchandising/accessories/${slug}/${orderId}`)}
                        >
                            Review Matrix <IconChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                )
            }
        }
    ]

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-screen">
                <IconLoader2 className="size-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Generating Summary...</p>
            </div>
        )
    }

    if (!summary) return null

    return (
        <div className="flex flex-col gap-6 py-8 px-4 lg:px-10 bg-background min-h-screen">
            {/* Header Area */}
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" size="icon" className="rounded-xl shadow-sm hover:translate-x-[-2px] transition-all"
                        onClick={() => router.back()}
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-2 py-0 h-5 text-[10px] font-black uppercase tracking-tighter">
                                Order Summary
                            </Badge>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Program {summary.programNumber}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
                            Material Procurement Breakdown
                        </h1>
                    </div>
                </div>
                
                <div className="hidden md:flex items-center gap-3">
                     <SummaryStat icon={IconClipboardList} label="Accessory Variants" value={summary.accessories.length.toString()} />
                     <SummaryStat icon={IconScale} label="Total Units" value={summary.accessories.reduce((a, b) => a + b.totalRequiredQuantity, 0).toLocaleString()} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-none shadow-2xl shadow-foreground/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="px-6 py-4 border-b bg-muted/20">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
                                <IconPalette className="size-4" /> Comprehensive Booking Analytics
                            </h3>
                        </div>
                        <div className="px-2 pb-2">
                            <DataTable
                                columns={columns}
                                data={summary.accessories}
                                isLoading={loading}
                                showTabs={false}
                                showActions={false}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function SummaryStat({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-card rounded-2xl border border-border shadow-sm">
            <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">{label}</p>
                <p className="text-lg font-black text-foreground leading-none">{value}</p>
            </div>
        </div>
    )
}
