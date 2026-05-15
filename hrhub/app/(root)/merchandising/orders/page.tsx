"use client"

import * as React from "react"
import {
    IconFileDescription,
    IconPlus,
    IconCalendar,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconEye,
    IconDownload,
    IconUpload,
    IconFilter,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { merchandisingService, ProgramOrder, Buyer } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
    const router = useRouter()
    const [orderSheets, setOrderSheets] = React.useState<ProgramOrder[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filters, setFilters] = React.useState({
        programNumber: "",
        buyerId: "all",
        customerName: "",
        programName: "",
        factoryName: "",
        fromDate: undefined as Date | undefined,
        toDate: undefined as Date | undefined,
        minQty: "",
        maxQty: "",
    })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [ordersData, buyersData] = await Promise.all([
                merchandisingService.getAllProgramOrders(1),
                merchandisingService.getBuyers(1),
            ])
            setOrderSheets(ordersData)
            setBuyers(buyersData)
        } catch (error) {
            // Silently handle 404 if the list endpoint isn't ready, but log other serious errors
            console.error("Order fetch error:", error)
            toast.error("Failed to load production orders")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredOrders = React.useMemo(() => {
        const parseQty = (order: ProgramOrder) =>
            order.articles?.reduce((a, b) => a + (b.totalQty || 0), 0) || 0

        return orderSheets.filter((order) => {
            const orderProgramNo = (order.programNumber || "").toLowerCase()
            const orderBuyer = (order.buyerName || "").toLowerCase()
            const orderCustomer = (order.customerName || "").toLowerCase()
            const orderProgramName = (order.programName || "").toLowerCase()
            const orderFactory = (order.factoryName || "").toLowerCase()
            const orderDate = order.orderDate ? new Date(order.orderDate) : null
            const totalQty = parseQty(order)

            const matchesProgramNo =
                !filters.programNumber || orderProgramNo.includes(filters.programNumber.toLowerCase())
            const selectedBuyerName =
                filters.buyerId === "all"
                    ? ""
                    : (buyers.find((b) => b.id === Number(filters.buyerId))?.name || "").toLowerCase()
            const matchesBuyer =
                filters.buyerId === "all" ||
                order.buyerId === Number(filters.buyerId) ||
                (selectedBuyerName !== "" && orderBuyer === selectedBuyerName)
            const matchesCustomer =
                !filters.customerName || orderCustomer.includes(filters.customerName.toLowerCase())
            const matchesProgramName =
                !filters.programName || orderProgramName.includes(filters.programName.toLowerCase())
            const matchesFactory =
                !filters.factoryName || orderFactory.includes(filters.factoryName.toLowerCase())

            const fromDate = filters.fromDate ?? null
            const toDate = filters.toDate ?? null
            const matchesFromDate = !fromDate || (orderDate !== null && orderDate >= fromDate)
            const matchesToDate = !toDate || (orderDate !== null && orderDate <= toDate)

            const minQty = filters.minQty ? Number(filters.minQty) : null
            const maxQty = filters.maxQty ? Number(filters.maxQty) : null
            const matchesMinQty = minQty === null || totalQty >= minQty
            const matchesMaxQty = maxQty === null || totalQty <= maxQty

            return (
                matchesProgramNo &&
                matchesBuyer &&
                matchesCustomer &&
                matchesProgramName &&
                matchesFactory &&
                matchesFromDate &&
                matchesToDate &&
                matchesMinQty &&
                matchesMaxQty
            )
        })
    }, [orderSheets, filters, buyers])

    const handleDelete = async (id: number) => {
        try {
            await merchandisingService.deleteProgramOrder(id)
            setOrderSheets(prev => prev.filter(o => o.id !== id))
            toast.success("Order deleted")
        } catch (error) {
            console.error(error)
            toast.error("Delete failed")
        }
    }

    const handleExport = async (id: number) => {
        try {
            toast.info("Exporting...")
            await merchandisingService.exportOrder(id)
            toast.success("Excel exported")
        } catch {
            toast.error("Export failed")
        }
    }

    const columns = React.useMemo<ColumnDef<ProgramOrder>[]>(() => [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => (
                <div data-no-row-click="true">
                    <span className="text-[10px] font-bold text-muted-foreground/60">
                        {(row.index + 1).toString().padStart(2, '0')}
                    </span>
                </div>
            ),
            size: 50,
        },
        {
            accessorKey: "programNumber",
            header: "Program ID",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{row.getValue("programNumber")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.articles?.length || 0} Articles</span>
                </div>
            )
        },
        {
            accessorKey: "buyerName",
            header: "Buyer / Customer",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground/90">{row.getValue("buyerName")}</span>
                    <span className="text-[11px] text-muted-foreground/70">{row.original.customerName}</span>
                </div>
            )
        },
        {
            accessorKey: "programName",
            header: "Season",
            cell: ({ row }) => (
                <span className="text-xs font-medium text-muted-foreground uppercase italic">
                    {row.getValue("programName") || "N/A"}
                </span>
            )
        },
        {
            id: "totalQty",
            header: () => <div className="text-right">Ordered Qty</div>,
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
                    {row.getValue("orderDate") ? (
                        (() => {
                            const d = new Date(row.getValue("orderDate"));
                            return isNaN(d.getTime()) ? "N/A" : format(d, 'dd MMM, yy');
                        })()
                    ) : "N/A"}
                </div>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex justify-end" data-no-row-click="true">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-foreground">
                                    <IconDotsVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/merchandising/orders/details/${order.id}`); }}>
                                    <IconEye className="size-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/merchandising/orders/edit/${order.id}`); }}>
                                     <IconEdit className="size-4 mr-2" /> Edit Order
                                 </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExport(order.id); }}>
                                    <IconDownload className="size-4 mr-2" /> Export Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                    <IconTrash className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        },
    ], [router])

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Merchandising Orders</h1>
                    <p className="text-sm text-muted-foreground">Manage production programs and size breakdowns</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/merchandising/orders/summary")}
                        className="font-semibold"
                    >
                        Analytics
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/merchandising/orders/import")}
                        className="font-semibold"
                    >
                        <IconUpload className="size-4 mr-2" /> Import Excel
                    </Button>
                    <Button
                        onClick={() => router.push("/merchandising/orders/create")}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    >
                        <IconPlus className="size-4 mr-2" /> Create Order
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconFilter className="size-4 text-primary" />
                        Advanced Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Program Number</Label>
                            <Input
                                placeholder="e.g. PRG-1001"
                                value={filters.programNumber}
                                onChange={(e) => setFilters((prev) => ({ ...prev, programNumber: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Buyer</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={filters.buyerId}
                                onChange={(e) => setFilters((prev) => ({ ...prev, buyerId: e.target.value }))}
                            >
                                <option value="all">All Buyers</option>
                                {buyers.map((buyer) => (
                                    <option key={buyer.id} value={buyer.id}>
                                        {buyer.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Customer Name</Label>
                            <Input
                                placeholder="e.g. Europe Region"
                                value={filters.customerName}
                                onChange={(e) => setFilters((prev) => ({ ...prev, customerName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Season / Program Name</Label>
                            <Input
                                placeholder="e.g. SS26"
                                value={filters.programName}
                                onChange={(e) => setFilters((prev) => ({ ...prev, programName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Factory Name</Label>
                            <Input
                                placeholder="e.g. Unit A"
                                value={filters.factoryName}
                                onChange={(e) => setFilters((prev) => ({ ...prev, factoryName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">From Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <IconCalendar className="mr-2 size-4" />
                                        {filters.fromDate ? format(filters.fromDate, "dd MMM, yyyy") : "Select From Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.fromDate}
                                        onSelect={(date) => setFilters((prev) => ({ ...prev, fromDate: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">To Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <IconCalendar className="mr-2 size-4" />
                                        {filters.toDate ? format(filters.toDate, "dd MMM, yyyy") : "Select To Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.toDate}
                                        onSelect={(date) => setFilters((prev) => ({ ...prev, toDate: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Min Ordered Qty</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={filters.minQty}
                                onChange={(e) => setFilters((prev) => ({ ...prev, minQty: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Max Ordered Qty</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="999999"
                                value={filters.maxQty}
                                onChange={(e) => setFilters((prev) => ({ ...prev, maxQty: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Showing {filteredOrders.length} of {orderSheets.length} orders
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setFilters({
                                    programNumber: "",
                                    buyerId: "all",
                                    customerName: "",
                                    programName: "",
                                    factoryName: "",
                                    fromDate: undefined,
                                    toDate: undefined,
                                    minQty: "",
                                    maxQty: "",
                                })
                            }
                        >
                            Reset Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <DataTable
                    data={filteredOrders}
                    columns={columns}
                    isLoading={loading}
                    className="border-none"
                    onRowClick={(row) => router.push(`/merchandising/orders/details/${row.id}`)}
                    enableSelection={true}
                    enableDrag={true}
                    onDeleteSelected={async (rows) => {
                        try {
                            await Promise.all(rows.map(r => merchandisingService.deleteProgramOrder(r.id)));
                            setOrderSheets(prev => prev.filter(o => !rows.find(r => r.id === o.id)));
                            toast.success(`${rows.length} orders deleted`);
                        } catch {
                            toast.error("Bulk delete failed");
                        }
                    }}
                />
            </div>
        </div>
    )
}
