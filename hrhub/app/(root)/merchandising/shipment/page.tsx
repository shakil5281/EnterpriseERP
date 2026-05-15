"use client"

import * as React from "react"
import {
    IconTruck,
    IconPlus,
    IconRefresh,
    IconMapPin,
    IconAnchor,
    IconPlaneTilt,
    IconCurrencyDollar,
    IconWorldDownload,
    IconArchive,
    IconFileCheck
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, StyleOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export default function ShipmentPage() {
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load shipment data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const columns: ColumnDef<StyleOrder>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground font-medium">{row.index + 1}</span>,
        },
        {
            id: "invoice",
            header: "Invoice Reference",
            cell: ({ row }) => <span className="font-bold tracking-tight text-foreground">X-INV/2025/{100 + row.index}</span>
        },
        {
            accessorKey: "poNumber",
            header: "PO Number",
            cell: ({ row }) => <span className="font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-2">{row.original.poNumber}</span>
        },
        {
            id: "terminal",
            header: "Terminal / Port",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconMapPin className="size-3.5 text-muted-foreground/60" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">Hamburg Terminal 4</span>
                </div>
            )
        },
        {
            accessorKey: "orderQuantity",
            header: "Quantity",
            cell: ({ row }) => <span className="font-bold text-foreground tabular-nums">{row.original.orderQuantity.toLocaleString()} PCS</span>
        },
        {
            id: "mode",
            header: "Mode",
            cell: ({ row }) => (
                <div className="flex items-center">
                    {row.index % 2 === 0 ? <IconAnchor className="size-4 text-blue-500 dark:text-blue-400" /> : <IconPlaneTilt className="size-4 text-sky-500 dark:text-sky-400" />}
                </div>
            )
        },
        {
            id: "exFactory",
            header: "Ex-Factory",
            cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">2026-03-{14 + row.index}</span>
        },
        {
            id: "value",
            header: "Value (USD)",
            cell: ({ row }) => <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">${(row.original.orderQuantity * 8.45).toLocaleString()}</span>
        }
    ]

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Shipment Sheet</h1>
                    <p className="text-sm text-muted-foreground font-medium">Consignment monitoring and logistics synchronization for global exports</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 border border-border rounded-lg text-muted-foreground"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="h-10 px-6 font-semibold shadow-sm shadow-indigo-500/20 text-white">
                        <IconPlus className="size-4 mr-2" />
                        Book Consignment
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="MTD Export" value="$1.28M" icon={IconCurrencyDollar} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KPICard title="Total Orders" value={orders.length.toString()} icon={IconArchive} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" />
                <KPICard title="Invoices" value="42" icon={IconFileCheck} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" />
                <KPICard title="Terminals" value="8" icon={IconWorldDownload} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" />
            </div>

            {/* Content Table */}
            <div className="flex-1">
                <DataTable
                    columns={columns}
                    data={orders}
                    isLoading={loading}
                    searchKey="poNumber"
                    showTabs={false}
                    showActions={true}
                    showColumnCustomizer={true}
                />
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-border bg-card shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className="text-lg font-bold text-foreground">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
