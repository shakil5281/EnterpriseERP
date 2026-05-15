"use client"

import * as React from "react"
import {
    IconTestPipe,
    IconPlus,
    IconRefresh,
    IconScissors,
    IconCircleCheck,
    IconAlertCircle,
    IconHistory
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { merchandisingService, StyleOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export default function SamplingPage() {
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load sampling data")
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
            id: "styleNumber",
            accessorKey: "style.styleNumber",
            header: "Style Identification",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold tracking-tight text-foreground uppercase">{row.original.style?.styleNumber || "GLOBAL-PROTO-882"}</span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-bold">{row.original.buyer?.name}</span>
                </div>
            )
        },
        {
            id: "stage",
            header: "Iteration Stage",
            cell: ({ row }) => {
                const stage = row.index % 3 === 0 ? "Proto-01" : row.index % 3 === 1 ? "Fit-02" : "Salesman-01"
                return (
                    <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-border text-muted-foreground uppercase tracking-tight">
                        {stage}
                    </div>
                )
            }
        },
        {
            id: "terminus",
            header: "Deadline",
            cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">2026-03-{15 + row.index}</span>
        },
        {
            id: "sequence",
            header: "Progress",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((row.index % 3 + 1) / 3) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-indigo-600 dark:text-indigo-400 uppercase">Step 0{row.index % 3 + 1}</span>
                </div>
            )
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const isApproved = row.index % 3 !== 0
                return (
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
                        isApproved 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                            : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                    )}>
                        {isApproved ? "Approved" : "Feedback Req."}
                    </div>
                )
            }
        }
    ]

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Sample Tracking</h1>
                    <p className="text-sm text-muted-foreground font-medium">Development cycle monitoring and iterative approval tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-border rounded-lg text-muted-foreground"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="h-10 px-6 font-semibold shadow-sm shadow-indigo-200">
                        <IconPlus className="size-4 mr-2 text-white" />
                        Initialize Sample
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Active Proto" value="12" icon={IconScissors} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" />
                <KPICard title="Approval Rate" value="82%" icon={IconCircleCheck} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KPICard title="Rework Load" value="4" icon={IconAlertCircle} color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400" />
                <KPICard title="MTD Complete" value="48" icon={IconHistory} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" />
            </div>

            {/* Content Table */}
            <div className="flex-1">
                <DataTable
                    columns={columns}
                    data={orders}
                    isLoading={loading}
                    searchKey="styleNumber"
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
