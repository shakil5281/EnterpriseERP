"use client"

import * as React from "react"
import {
    IconListCheck,
    IconReload,
    IconChartBar,
    IconPackage,
    IconTag,
    IconFilter,
    IconPlus,
    IconTrash,
    IconSearch,
    IconCurrencyDollar,
    IconPalette
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { productionService, ProductionItem, ProductionReport, ProductionColor } from "@/lib/services/production"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

// --- Components ---

interface ProductionFormProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    selectedItem: ProductionItem | null
}

function ProductionForm({ isOpen, onOpenChange, onSuccess, selectedItem }: ProductionFormProps) {
    const isEdit = !!selectedItem
    const [isLoading, setIsLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<Omit<ProductionItem, "id">>({
        programCode: "",
        buyer: "",
        orderQty: 0,
        styleNo: "",
        item: "",
        unitPrice: 0,
        status: "Pending",
        colors: []
    })

    React.useEffect(() => {
        if (selectedItem) {
            setFormData({
                programCode: selectedItem.programCode || "",
                buyer: selectedItem.buyer || "",
                orderQty: selectedItem.orderQty || 0,
                styleNo: selectedItem.styleNo || "",
                item: selectedItem.item || "",
                unitPrice: selectedItem.unitPrice || 0,
                status: selectedItem.status || "Pending",
                colors: selectedItem.colors ? [...selectedItem.colors] : []
            })
        } else {
            setFormData({
                programCode: "",
                buyer: "",
                orderQty: 0,
                styleNo: "",
                item: "",
                unitPrice: 0,
                status: "Pending",
                colors: []
            })
        }
    }, [selectedItem, isOpen])

    const handleAddColor = () => {
        setFormData(prev => ({
            ...prev,
            colors: [...prev.colors, { colorName: "", quantity: 0 }]
        }))
    }

    const handleRemoveColor = (index: number) => {
        setFormData(prev => ({
            ...prev,
            colors: prev.colors.filter((_, i) => i !== index)
        }))
    }

    const handleColorChange = (index: number, field: keyof ProductionColor, value: string | number) => {
        const newColors = [...formData.colors]
        newColors[index] = { ...newColors[index], [field]: value }
        setFormData(prev => ({ ...prev, colors: newColors }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            if (isEdit && selectedItem) {
                await productionService.updateProduction(selectedItem.id, formData)
                toast.success("Production updated successfully")
            } else {
                await productionService.createProduction(formData)
                toast.success("Production created successfully")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to save production"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl flex flex-col h-full  dark:bg-card">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle>{isEdit ? "Edit Production Style" : "Create New Production style"}</SheetTitle>
                    <SheetDescription>
                        Fill in the details for the manufacturing cycle.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="programCode" className="text-xs uppercase font-bold text-muted-foreground">Program Code</Label>
                            <Input
                                id="programCode"
                                value={formData.programCode}
                                onChange={e => setFormData(prev => ({ ...prev, programCode: e.target.value }))}
                                placeholder="e.g. PG-001"
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="styleNo" className="text-xs uppercase font-bold text-muted-foreground">Style No *</Label>
                            <Input
                                id="styleNo"
                                required
                                value={formData.styleNo}
                                onChange={e => setFormData(prev => ({ ...prev, styleNo: e.target.value }))}
                                placeholder="Unique Style No"
                                className="bg-white dark:bg-slate-900 border-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="buyer" className="text-xs uppercase font-bold text-muted-foreground">Buyer *</Label>
                            <Input
                                id="buyer"
                                required
                                value={formData.buyer}
                                onChange={e => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                                placeholder="Buyer Name"
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item" className="text-xs uppercase font-bold text-muted-foreground">Item Name</Label>
                            <Input
                                id="item"
                                value={formData.item}
                                onChange={e => setFormData(prev => ({ ...prev, item: e.target.value }))}
                                placeholder="Product Type"
                                className="bg-background"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="orderQty" className="text-xs uppercase font-bold text-muted-foreground">Order Qty</Label>
                            <Input
                                id="orderQty"
                                type="number"
                                value={formData.orderQty}
                                onChange={e => setFormData(prev => ({ ...prev, orderQty: parseInt(e.target.value) || 0 }))}
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unitPrice" className="text-xs uppercase font-bold text-muted-foreground">Unit Price</Label>
                            <div className="relative">
                                <IconCurrencyDollar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="unitPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.unitPrice}
                                    onChange={e => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                                    className="pl-8 bg-white dark:bg-slate-900"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-xs uppercase font-bold text-muted-foreground">Status</Label>
                            <NativeSelect
                                id="status"
                                value={formData.status}
                                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="bg-white dark:bg-slate-900 h-10"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Running">Running</option>
                                <option value="Complete">Complete</option>
                                <option value="Close">Close</option>
                            </NativeSelect>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IconPalette className="size-4 text-primary" />
                                <Label className="text-sm font-bold">Color Breakdown</Label>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddColor} className="h-8 gap-1">
                                <IconPlus className="size-3" /> Add Color
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.colors.map((color, index) => (
                                <div key={index} className="flex items-end gap-3 p-3 bg-muted/40 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Color Name</Label>
                                        <Input
                                            placeholder="Color"
                                            value={color.colorName}
                                            onChange={e => handleColorChange(index, "colorName", e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="w-24 space-y-1.5">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Quantity</Label>
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={color.quantity}
                                            onChange={e => handleColorChange(index, "quantity", parseInt(e.target.value) || 0)}
                                            className="h-8 text-sm text-right"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveColor(index)}
                                    >
                                        <IconTrash className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            {formData.colors.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-xs italic">
                                    No colors added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                <SheetFooter className="border-t pt-4">
                    <SheetClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" disabled={isLoading} onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                        {isLoading ? "Saving..." : isEdit ? "Update Style" : "Create Style"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

// --- Main Page ---

export default function ProductionListPage() {
    const [data, setData] = React.useState<ProductionItem[]>([])
    const [report, setReport] = React.useState<ProductionReport | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [showFilters, setShowFilters] = React.useState(false)

    // Form state
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<ProductionItem | null>(null)

    // Quick filter state
    const [filters, setFilters] = React.useState({
        buyer: "",
        styleNo: "",
        status: "",
        item: ""
    })

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [productions, reportData] = await Promise.all([
                productionService.getProductions(),
                productionService.getReport()
            ])
            setData(productions)
            setReport(reportData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load production data")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (row: ProductionItem) => {
        setSelectedItem(row)
        setIsFormOpen(true)
    }

    const handleAdd = () => {
        setSelectedItem(null)
        setIsFormOpen(true)
    }

    const handleDelete = async (row: ProductionItem) => {
        try {
            await productionService.deleteProduction(row.id)
            toast.success(`Deleted Style: ${row.styleNo}`)
            fetchData()
        } catch (error) {
            toast.error("Failed to delete item")
        }
    }

    // Client-side filtering for "advanced filter" since backend GET is currently simple
    const filteredData = React.useMemo(() => {
        return data.filter(item => {
            const matchBuyer = !filters.buyer || item.buyer.toLowerCase().includes(filters.buyer.toLowerCase())
            const matchStyle = !filters.styleNo || item.styleNo.toLowerCase().includes(filters.styleNo.toLowerCase())
            const matchStatus = !filters.status || item.status === filters.status
            const matchItem = !filters.item || item.item.toLowerCase().includes(filters.item.toLowerCase())
            return matchBuyer && matchStyle && matchStatus && matchItem
        })
    }, [data, filters])

    const columns: ColumnDef<ProductionItem>[] = [
        {
            accessorKey: "programCode",
            header: "PRG Code",
            cell: ({ row }) => <div className="text-xs font-mono font-medium">{row.getValue("programCode") || "-"}</div>,
        },
        {
            accessorKey: "buyer",
            header: "Buyer",
            cell: ({ row }) => <div className="font-bold text-foreground uppercase">{row.getValue("buyer")}</div>,
        },
        {
            accessorKey: "styleNo",
            header: "Style No",
            cell: ({ row }) => <div className="font-black text-primary">{row.getValue("styleNo")}</div>,
        },
        {
            accessorKey: "item",
            header: "Product Item",
        },
        {
            accessorKey: "orderQty",
            header: "Order Qty",
            cell: ({ row }) => <div className="text-right font-bold tabular-nums">{row.getValue("orderQty")}</div>,
        },
        {
            accessorKey: "unitPrice",
            header: "Price ($)",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("unitPrice"))
                return <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">${amount.toFixed(2)}</div>
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge className="font-bold px-2 py-0.5" variant={
                        status === "Complete" ? "default" :
                            status === "Running" ? "secondary" :
                                status === "Processing" ? "secondary" :
                                    status === "Close" ? "outline" :
                                        status === "Pending" ? "destructive" :
                                            "secondary"
                    }>
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "colors",
            header: "Colors Info",
            cell: ({ row }) => {
                const colors = row.original.colors || []
                if (colors.length === 0) return <span className="text-muted-foreground italic text-xs">No colors</span>
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {colors.slice(0, 3).map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] px-1 bg-muted/50">
                                {c.colorName}: {c.quantity}
                            </Badge>
                        ))}
                        {colors.length > 3 && <span className="text-[10px] text-muted-foreground">+{colors.length - 3} more</span>}
                    </div>
                )
            }
        }
    ]

    const tabsSource = [
        { value: "Running", label: "Running" },
        { value: "Pending", label: "Pending" },
        { value: "Complete", label: "Complete" },
        { value: "Close", label: "Close" },
    ]

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-h-screen bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconListCheck className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground">PRODUCTION FLOW</h1>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                            Real-time Daily Manufacturing Dashboard
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2 font-bold"
                    >
                        <IconFilter className="size-4" />
                        Filters
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} className="rounded-full">
                        <IconReload className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="default" size="sm" onClick={handleAdd} className="gap-2 font-bold shadow-md">
                        <IconPlus className="size-4" />
                        Create Style
                    </Button>
                </div>
            </div>

            {/* Dash Analytics Section */}
            <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
                <Card className="border-none shadow-sm bg-linear-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative group">
                    <IconPackage className="absolute -right-2 -bottom-2 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/80">TOTAL SCHEDULED QTY</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums">{report?.totalOrderQty?.toLocaleString() || 0}</div>
                        <div className="mt-2 h-1 w-full bg-white/20 rounded-full">
                            <div className="h-full bg-white rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-slate-900 dark:bg-card text-white dark:text-foreground overflow-hidden relative group">
                    <IconListCheck className="absolute -right-2 -bottom-2 h-24 w-24 text-white/5 dark:text-primary/5 group-hover:scale-110 transition-transform" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/60 dark:text-muted-foreground">TOTAL COMPLETED</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums text-emerald-400">{report?.totalComplete?.toLocaleString() || 0}</div>
                        <p className="text-[10px] mt-1 text-white/40 dark:text-muted-foreground font-mono">
                            {report?.totalOrderQty ? ((report.totalComplete / report.totalOrderQty) * 100).toFixed(1) : 0}% Efficiency
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group border-b-4 border-b-orange-500">
                    <IconChartBar className="absolute -right-2 -bottom-2 h-24 w-24 text-orange-500/5 group-hover:scale-110 transition-transform" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ACTIVE RUNNING</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums text-orange-600 dark:text-orange-500">{report?.totalRunning?.toLocaleString() || 0}</div>
                        <p className="text-[10px] mt-1 text-muted-foreground font-mono italic">Lines operational</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group border-b-4 border-b-rose-500">
                    <IconTag className="absolute -right-2 -bottom-2 h-24 w-24 text-rose-500/5 group-hover:scale-110 transition-transform" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PENDING ORDERS</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums text-rose-600 dark:text-rose-500">{report?.totalPending?.toLocaleString() || 0}</div>
                        <p className="text-[10px] mt-1 text-muted-foreground font-mono">Waiting for start</p>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Filters Section */}
            {showFilters && (
                <div className="mx-4 lg:mx-6 p-4 rounded-xl border bg-card shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h2 className="text-sm font-black uppercase text-foreground">Advanced Filter Controls</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="filter-buyer" className="text-[10px] font-bold uppercase text-muted-foreground">Buyer Search</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    id="filter-buyer"
                                    placeholder="Search Buyer..."
                                    className="pl-8 h-9 text-xs"
                                    value={filters.buyer}
                                    onChange={e => setFilters(f => ({ ...f, buyer: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="filter-style" className="text-[10px] font-bold uppercase text-muted-foreground">Style No</Label>
                            <Input
                                id="filter-style"
                                placeholder="Filter Style..."
                                className="h-9 text-xs"
                                value={filters.styleNo}
                                onChange={e => setFilters(f => ({ ...f, styleNo: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="filter-status" className="text-[10px] font-bold uppercase text-muted-foreground">Production Status</Label>
                            <NativeSelect
                                id="filter-status"
                                className="h-9 text-xs"
                                value={filters.status}
                                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                            >
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Running">Running</option>
                                <option value="Complete">Complete</option>
                                <option value="Close">Close</option>
                            </NativeSelect>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                className="w-full h-9 text-xs font-bold"
                                onClick={() => setFilters({ buyer: "", styleNo: "", status: "", item: "" })}
                            >
                                <IconTrash className="size-3 mr-2" /> Reset Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 lg:px-6">
                <DataTable
                    data={filteredData}
                    columns={columns}
                    onAddClick={handleAdd}
                    onEditClick={handleEdit}
                    onDelete={handleDelete}
                    showTabs={true}
                    tabs={tabsSource}
                    filterKey="status"
                    searchKey="styleNo"
                    isLoading={isLoading}
                    addLabel="NEW STYLE"
                />
            </div>

            <ProductionForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                selectedItem={selectedItem}
                onSuccess={fetchData}
            />
        </div>
    )
}
