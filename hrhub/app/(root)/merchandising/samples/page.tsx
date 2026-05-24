"use client"

import * as React from "react"
import { IconTestPipe, IconPlus, IconRefresh } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Buyer, Sample, Style } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function SamplingPage() {
    const { activeCompanyId } = useCompanyContext()
    const [samples, setSamples] = React.useState<Sample[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [styles, setStyles] = React.useState<Style[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [form, setForm] = React.useState({
        buyerId: "",
        styleId: "",
        sampleType: "Proto",
        requestDate: new Date().toISOString().slice(0, 10),
        remarks: "",
    })

    const fetchData = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const [sampleRows, buyerRows] = await Promise.all([
                merchandisingService.getSamples(activeCompanyId),
                merchandisingService.getBuyers(activeCompanyId),
            ])
            setSamples(sampleRows)
            setBuyers(buyerRows)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load samples")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleBuyerChange = async (buyerId: string) => {
        setForm((p) => ({ ...p, buyerId, styleId: "" }))
        if (!buyerId || !activeCompanyId) {
            setStyles([])
            return
        }
        try {
            const styleRows = await merchandisingService.getStyles(activeCompanyId, buyerId)
            setStyles(styleRows)
        } catch (error) {
            console.error(error)
        }
    }

    const handleCreate = async () => {
        if (!activeCompanyId || !form.buyerId || !form.styleId) {
            toast.error("Buyer and style are required")
            return
        }
        try {
            await merchandisingService.createSample({
                companyId: activeCompanyId,
                buyerId: form.buyerId,
                styleId: form.styleId,
                sampleType: form.sampleType,
                requestDate: form.requestDate,
                remarks: form.remarks || undefined,
            })
            toast.success("Sample created")
            setIsCreateOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create sample")
        }
    }

    const columns: ColumnDef<Sample>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "sampleType",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {row.original.sampleType}
                </Badge>
            ),
        },
        {
            accessorKey: "requestDate",
            header: "Requested",
            cell: ({ row }) => (
                <span className="text-xs font-medium">
                    {format(new Date(row.original.requestDate), "MMM dd, yyyy")}
                </span>
            ),
        },
        {
            accessorKey: "submitDate",
            header: "Submitted",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.submitDate ? format(new Date(row.original.submitDate), "MMM dd, yyyy") : "—"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge
                    className={cn(
                        "text-[10px] font-bold uppercase border-none",
                        row.original.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                    )}
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                    {row.original.remarks ?? "—"}
                </span>
            ),
        },
    ]

    const activeCount = samples.filter((s) => s.status !== "Approved" && s.status !== "Rejected").length
    const approvedCount = samples.filter((s) => s.status === "Approved").length

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Sample Tracking</h1>
                    <p className="text-sm text-muted-foreground font-medium">Development cycle and approval tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 border border-border rounded-lg" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 font-semibold">
                                <IconPlus className="size-4 mr-2" />
                                New Sample
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Sample</DialogTitle>
                                <DialogDescription>Register a new sample request</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-2">
                                <div className="space-y-2">
                                    <Label className="text-xs">Buyer</Label>
                                    <NativeSelect value={form.buyerId} onChange={(e) => handleBuyerChange(e.target.value)}>
                                        <option value="">Select buyer</option>
                                        {buyers.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.buyerName}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Style</Label>
                                    <NativeSelect
                                        value={form.styleId}
                                        onChange={(e) => setForm((p) => ({ ...p, styleId: e.target.value }))}
                                        disabled={!form.buyerId}
                                    >
                                        <option value="">Select style</option>
                                        {styles.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.styleNo}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Sample Type</Label>
                                        <NativeSelect
                                            value={form.sampleType}
                                            onChange={(e) => setForm((p) => ({ ...p, sampleType: e.target.value }))}
                                        >
                                            <option value="Proto">Proto</option>
                                            <option value="Fit">Fit</option>
                                            <option value="Salesman">Salesman</option>
                                            <option value="PP">PP</option>
                                        </NativeSelect>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Request Date</Label>
                                        <Input
                                            type="date"
                                            value={form.requestDate}
                                            onChange={(e) => setForm((p) => ({ ...p, requestDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Remarks</Label>
                                    <Input
                                        value={form.remarks}
                                        onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Samples" value={samples.length.toString()} />
                <StatCard title="In Progress" value={activeCount.toString()} />
                <StatCard title="Approved" value={approvedCount.toString()} />
            </div>

            <DataTable
                columns={columns}
                data={samples}
                isLoading={loading}
                searchKey="sampleType"
                showTabs={false}
                showActions={false}
                showColumnCustomizer={true}
            />
        </div>
    )
}

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="border border-border bg-card rounded-xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <h3 className="text-lg font-bold mt-1">{value}</h3>
        </div>
    )
}
