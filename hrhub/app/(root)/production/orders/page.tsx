"use client"

import * as React from "react"
import {
    IconClipboardList,
    IconSearch,
    IconFilter,
    IconPlus,
    IconReload,
    IconPackage,
    IconTrendingUp,
    IconAlertCircle,
    IconCheck
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Mock Data Type
interface OrderItem {
    id: string
    orderNumber: string
    buyer: string
    product: string
    quantity: number
    deliveryDate: string
    value: number
    status: string
}

// Mock Data
const MOCK_ORDERS: OrderItem[] = [
    { id: "1", orderNumber: "ORD-2026-001", buyer: "ZARA", product: "Basic T-Shirt", quantity: 5000, deliveryDate: "2026-05-15", value: 12500, status: "In Progress" },
    { id: "2", orderNumber: "ORD-2026-002", buyer: "H&M", product: "Denim Jeans", quantity: 3000, deliveryDate: "2026-05-20", value: 45000, status: "Pending" },
    { id: "3", orderNumber: "ORD-2026-003", buyer: "Levi's", product: "Cotton Jacket", quantity: 1500, deliveryDate: "2026-05-10", value: 37500, status: "Completed" },
    { id: "4", orderNumber: "ORD-2026-004", buyer: "UNIQLO", product: "Polo Shirt", quantity: 8000, deliveryDate: "2026-06-01", value: 32000, status: "In Progress" },
    { id: "5", orderNumber: "ORD-2026-005", buyer: "GAP", product: "Summer Shorts", quantity: 4500, deliveryDate: "2026-05-25", value: 22500, status: "Pending" },
]

export default function OrderListPage() {
    const [data, setData] = React.useState<OrderItem[]>(MOCK_ORDERS)
    const [isLoading, setIsLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const handleRefresh = () => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 800)
    }

    const filteredData = React.useMemo(() => {
        return data.filter(item => 
            item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.buyer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [data, searchQuery])

    const columns: ColumnDef<OrderItem>[] = [
        {
            accessorKey: "orderNumber",
            header: "Order Number",
            cell: ({ row }) => <div className="font-mono text-xs font-bold text-primary">{row.getValue("orderNumber")}</div>,
        },
        {
            accessorKey: "buyer",
            header: "Buyer",
            cell: ({ row }) => <div className="font-black text-foreground uppercase">{row.getValue("buyer")}</div>,
        },
        {
            accessorKey: "product",
            header: "Product",
            cell: ({ row }) => <div className="font-medium">{row.getValue("product")}</div>,
        },
        {
            accessorKey: "quantity",
            header: "Quantity",
            cell: ({ row }) => <div className="text-right font-bold tabular-nums">{row.getValue("quantity")}</div>,
        },
        {
            accessorKey: "deliveryDate",
            header: "Delivery Date",
            cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{row.getValue("deliveryDate")}</div>,
        },
        {
            accessorKey: "value",
            header: "Value ($)",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("value"))
                return <div className="text-right font-black text-emerald-600 dark:text-emerald-400">${amount.toLocaleString()}</div>
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge className="font-bold px-3 py-1 shadow-sm" variant={
                        status === "Completed" ? "default" :
                        status === "In Progress" ? "secondary" :
                        "outline"
                    }>
                        {status}
                    </Badge>
                )
            },
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                        <IconClipboardList className="size-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Order Management</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Track and manage production orders seamlessly
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="rounded-full shadow-sm hover:shadow-md transition-all">
                        <IconReload className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button className="gap-2 font-bold shadow-lg shadow-primary/20 rounded-full px-6 transition-all hover:scale-105">
                        <IconPlus className="size-4" />
                        Create Order
                    </Button>
                </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative group transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IconPackage className="size-20" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900 dark:text-white">1,248</div>
                        <p className="text-xs font-semibold text-emerald-500 mt-2 flex items-center gap-1">
                            <IconTrendingUp className="size-3" /> +12% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-3xl overflow-hidden relative group transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <IconClipboardList className="size-20" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/80">Active Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tabular-nums">$149.5k</div>
                        <p className="text-xs font-semibold text-white/70 mt-2 flex items-center gap-1">
                            Current production pipeline
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative group transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 group-hover:opacity-10 transition-opacity">
                        <IconAlertCircle className="size-20" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-500">42</div>
                        <p className="text-xs font-semibold text-slate-500 mt-2 flex items-center gap-1">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative group transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 group-hover:opacity-10 transition-opacity">
                        <IconCheck className="size-20" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-emerald-500">856</div>
                        <p className="text-xs font-semibold text-slate-500 mt-2 flex items-center gap-1">
                            Successfully delivered
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar & Data Table */}
            <div className="px-4 lg:px-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="relative w-full sm:w-96">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search orders by number or buyer..."
                            className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-0 shadow-inner rounded-xl w-full focus-visible:ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="rounded-xl h-11 px-5 border-slate-200 dark:border-slate-800 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                            <IconFilter className="size-4 mr-2 text-slate-500" />
                            More Filters
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <DataTable
                        data={filteredData}
                        columns={columns}
                        isLoading={isLoading}
                        searchKey="orderNumber"
                    />
                </div>
            </div>
        </div>
    )
}
