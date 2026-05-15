"use client"

import * as React from "react"
import {
    IconRefresh,
    IconPlus,
    IconSearch,
    IconChevronRight,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, ProgramOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AccessoriesSummaryPage() {
    const router = useRouter()
    const [orders, setOrders] = React.useState<ProgramOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getAllProgramOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const columns: ColumnDef<ProgramOrder>[] = [
        {
            accessorKey: "programNumber",
            header: "Program Number",
            meta: { className: "py-3" },
        },
        {
            accessorKey: "buyerName",
            header: "Buyer",
            meta: { className: "py-3" },
        },
        {
            accessorKey: "customerName",
            header: "Customer",
            meta: { className: "py-3" },
        },
        {
            accessorKey: "programName",
            header: "Season",
            meta: { className: "py-3" },
        },
        {
            id: "totalQty",
            header: "Total Qty",
            meta: { className: "py-3" },
            cell: ({ row }) => (row.original.articles?.reduce((a, b) => a + (b.totalQty || 0), 0) || 0).toLocaleString()
        }
    ]

    const filteredOrders = orders.filter(o => 
        o.programNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Accessories Summary</h1>
                    <p className="text-sm text-muted-foreground">List of all accessories procurement programs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={`size-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => router.push("/merchandising/orders/create")}>
                        <IconPlus className="size-4 mr-1" />
                        Add New
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryItem label="Total Orders" value={orders.length} />
                <SummaryItem label="Total Season" value={new Set(orders.map(o => o.programName)).size} />
                <SummaryItem label="Total Quantity" value={orders.reduce((acc, o) => acc + (o.articles?.reduce((a, b) => a + (b.totalQty || 0), 0) || 0), 0).toLocaleString()} />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle>Program Orders</CardTitle>
                        <CardDescription>View and manage your accessories bookings</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                        <input 
                            placeholder="Search..." 
                            className="w-full pl-8 h-9 bg-background border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="px-1 border-t">
                        <DataTable
                            columns={columns}
                            data={filteredOrders}
                            isLoading={loading}
                            onRowClick={(row) => router.push(`/merchandising/accessories/summary/details/${row.id}`)}
                            showTabs={false}
                            showActions={false}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SummaryItem({ label, value }: { label: string, value: string | number }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </CardContent>
        </Card>
    )
}
