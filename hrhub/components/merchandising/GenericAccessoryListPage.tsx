"use client"

import * as React from "react"
import {
    IconPlus,
    IconRefresh,
    IconSearch,
    IconEye,
    IconCalendar,
    IconFileImport,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, ProgramOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

export default function GenericAccessoryListPage({ title, slug }: { title: string, slug: string }) {
    const router = useRouter()
    const [programOrders, setProgramOrders] = React.useState<ProgramOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getAllProgramOrders(1)
            setProgramOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load program orders")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const columns: ColumnDef<ProgramOrder>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-muted-foreground/60">
                    {(row.index + 1).toString().padStart(2, '0')}
                </span>
            ),
            size: 50,
        },
        {
            accessorKey: "programNumber",
            header: "Program ID",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{row.original.programNumber}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.articles?.length || 0} Articles</span>
                </div>
            )
        },
        {
            accessorKey: "buyerName",
            header: "Buyer / Customer",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground/90">{row.original.buyerName}</span>
                    <span className="text-[11px] text-muted-foreground/70">{row.original.customerName}</span>
                </div>
            )
        },
        {
            accessorKey: "programName",
            header: "Season",
            cell: ({ row }) => (
                <span className="text-xs font-medium text-muted-foreground uppercase italic">
                    {row.original.programName || "N/A"}
                </span>
            )
        },
        {
            id: "totalQty",
            header: () => <div className="text-right">Total Order Qty</div>,
            cell: ({ row }) => {
                const total = row.original.articles?.reduce((a, b) => a + (b.totalQty || 0), 0) || 0
                return (
                    <div className="text-right">
                        <span className="font-bold text-foreground">{total.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-bold">PCS</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "orderDate",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconCalendar className="size-3.5" />
                    {row.original.orderDate ? format(new Date(row.original.orderDate), 'dd MMM, yy') : "N/A"}
                </div>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 gap-1.5 text-xs font-semibold hover:text-primary"
                        onClick={() => router.push(`/merchandising/accessories/${slug}/${row.original.id}`)}
                    >
                        <IconEye className="size-3.5" />
                        Enter Booking
                    </Button>
                </div>
            )
        }
    ]

    const filteredOrders = programOrders.filter(o => 
        o.programNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-10 bg-background min-h-screen">
            <div className="flex items-center justify-between gap-4 py-4 px-6 border-b bg-card rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">{title} Booking Orders</h1>
                        <p className="text-xs text-muted-foreground font-medium">Select a program to manage {title.toLowerCase()} bookings</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                    <Button 
                        size="sm"
                        onClick={() => router.push("/merchandising/orders/create")}
                        className="text-xs h-9 px-4 gap-1.5 font-semibold shadow-sm"
                    >
                        <IconPlus className="size-4" />
                        Create New Order
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="border-b bg-muted/30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by Program ID or Buyer..." 
                                className="pl-10 h-10 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="px-2 pb-2">
                        <DataTable
                            columns={columns}
                            data={filteredOrders}
                            isLoading={loading}
                            onRowClick={(row) => router.push(`/merchandising/accessories/${slug}/${row.id}`)}
                            showTabs={false}
                            showActions={false}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
