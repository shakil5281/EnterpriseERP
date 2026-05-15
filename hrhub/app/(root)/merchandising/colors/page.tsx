"use client"

import * as React from "react"
import {
    IconPalette,
    IconPlus,
    IconRefresh,
    IconTrash,
    IconEdit,
    IconCheck,
    IconX,
    IconLoader2,
    IconUpload
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { merchandisingService, FabricColorPantone } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

export default function ColorsPage() {
    const [colors, setColors] = React.useState<FabricColorPantone[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [currentColor, setCurrentColor] = React.useState<Partial<FabricColorPantone>>({
        colorName: "",
        pantoneCode: "",
        companyId: 1,
        branchId: 1,
        isActive: true
    })
    
    const colorInputRef = React.useRef<HTMLInputElement>(null)
    const editColorInputRef = React.useRef<HTMLInputElement>(null)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getColors(1)
            setColors(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load color library")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateColor = async () => {
        try {
            if (!currentColor.colorName) {
                toast.error("Color name is required")
                return
            }

            await merchandisingService.createColor(currentColor)
            toast.success("Color added to library")
            setIsCreateOpen(false)
            setCurrentColor({ colorName: "", pantoneCode: "", companyId: 1, branchId: 1, isActive: true })
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to add color")
        }
    }

    const handleUpdateColor = async () => {
        try {
            if (!currentColor.colorName) {
                toast.error("Color name is required")
                return
            }

            await merchandisingService.updateColor(currentColor)
            toast.success("Color updated successfully")
            setIsEditOpen(false)
            setCurrentColor({ colorName: "", pantoneCode: "", companyId: 1, branchId: 1, isActive: true })
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update color")
        }
    }

    const handleDelete = async (color: FabricColorPantone) => {
        try {
            await merchandisingService.deleteColor(color.id)
            toast.success("Color deleted")
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete color")
        }
    }

    const handleBulkDelete = async (selectedRows: FabricColorPantone[]) => {
        try {
            const loadingToast = toast.loading(`Deleting ${selectedRows.length} colors...`)
            await Promise.all(selectedRows.map(row => merchandisingService.deleteColor(row.id)))
            toast.dismiss(loadingToast)
            toast.success(`${selectedRows.length} colors deleted successfully`)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Bulk delete failed")
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const loadingToast = toast.loading("Processing Excel import...")
            const result = await merchandisingService.importColors(file, 1, 1) // Using 1,1 as defaults
            toast.dismiss(loadingToast)
            toast.success(result.message || "Import completed")
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Excel import failed. Please check the file format.")
        } finally {
            e.target.value = "" // Reset input
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await merchandisingService.downloadColorTemplate()
            toast.success("Template download started")
        } catch {
            toast.error("Template download failed")
        }
    }

    const columns = React.useMemo<ColumnDef<FabricColorPantone>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-muted-foreground/60">
                    {row.original.id.toString().padStart(3, '0')}
                </span>
            ),
            size: 60,
        },
        {
            accessorKey: "colorName",
            header: "Color Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div 
                        className="size-4 rounded-full border border-border shadow-sm" 
                        style={{ backgroundColor: row.original.pantoneCode || '#eee' }}
                    />
                    <span className="font-bold text-foreground">{row.getValue("colorName")}</span>
                </div>
            )
        },
        {
            accessorKey: "pantoneCode",
            header: "Pantone / Hex Code",
            cell: ({ row }) => (
                <code className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono font-bold text-muted-foreground">
                    {row.getValue("pantoneCode") || "N/A"}
                </code>
            )
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => (
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    row.original.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                )}>
                    {row.original.isActive ? <IconCheck className="size-3" /> : <IconX className="size-3" />}
                    {row.original.isActive ? "Active" : "Inactive"}
                </div>
            )
        }
    ], [])

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Color Library</h1>
                    <p className="text-sm text-muted-foreground">Manage global fabric colors and Pantone specifications</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <IconRefresh className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="color-import"
                            onChange={handleImport}
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('color-import')?.click()}
                            className="h-10 px-4 font-semibold"
                        >
                            <IconUpload className="size-4 mr-2" />
                            Import Excel
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleDownloadTemplate}
                        className="h-10 px-4 font-semibold border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                        Template
                    </Button>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 font-bold">
                                <IconPlus className="size-4 mr-2" />
                                Add Color
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Color</DialogTitle>
                                <DialogDescription>Register a new color for the style library</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="colorName">Color Name</Label>
                                    <Input
                                        id="colorName"
                                        placeholder="e.g. Midnight Blue"
                                        value={currentColor.colorName}
                                        onChange={(e) => setCurrentColor({ ...currentColor, colorName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pantoneCode">Pantone or Hex Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pantoneCode"
                                            placeholder="e.g. #191970"
                                            value={currentColor.pantoneCode}
                                            onChange={(e) => setCurrentColor({ ...currentColor, pantoneCode: e.target.value })}
                                            className="font-mono"
                                        />
                                        <input 
                                            type="color"
                                            ref={colorInputRef}
                                            className="hidden"
                                            value={currentColor.pantoneCode?.startsWith('#') && currentColor.pantoneCode.length === 7 ? currentColor.pantoneCode : "#ffffff"}
                                            onChange={(e) => setCurrentColor({ ...currentColor, pantoneCode: e.target.value.toUpperCase() })}
                                        />
                                        <div 
                                            className="size-10 rounded-lg border border-border shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500/20 transition-all shadow-sm" 
                                            style={{ backgroundColor: currentColor.pantoneCode || '#eee' }}
                                            onClick={() => colorInputRef.current?.click()}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateColor}>Save Color</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Hidden Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                         <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Color</DialogTitle>
                                <DialogDescription>Update color specifications</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="editColorName">Color Name</Label>
                                    <Input
                                        id="editColorName"
                                        value={currentColor.colorName}
                                        onChange={(e) => setCurrentColor({ ...currentColor, colorName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editPantoneCode">Pantone or Hex Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="editPantoneCode"
                                            value={currentColor.pantoneCode}
                                            onChange={(e) => setCurrentColor({ ...currentColor, pantoneCode: e.target.value })}
                                            className="font-mono"
                                        />
                                        <input 
                                            type="color"
                                            ref={editColorInputRef}
                                            className="hidden"
                                            value={currentColor.pantoneCode?.startsWith('#') && currentColor.pantoneCode.length === 7 ? currentColor.pantoneCode : "#ffffff"}
                                            onChange={(e) => setCurrentColor({ ...currentColor, pantoneCode: e.target.value.toUpperCase() })}
                                        />
                                        <div 
                                            className="size-10 rounded-lg border border-border shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500/20 transition-all shadow-sm" 
                                            style={{ backgroundColor: currentColor.pantoneCode || '#eee' }}
                                            onClick={() => editColorInputRef.current?.click()}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="editActive" 
                                        checked={currentColor.isActive} 
                                        onCheckedChange={(checked) => setCurrentColor({ ...currentColor, isActive: !!checked })}
                                    />
                                    <Label htmlFor="editActive">Active for production</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateColor}>Update Color</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Total Colors" value={colors.length.toString()} icon={IconPalette} color="text-indigo-600" bgColor="bg-indigo-50" />
                <KPICard title="Active Colors" value={colors.filter(c => c.isActive).length.toString()} icon={IconPalette} color="text-emerald-600" bgColor="bg-emerald-50" />
                <KPICard title="Pantone Registered" value={colors.filter(c => c.pantoneCode).length.toString()} icon={IconPalette} color="text-blue-600" bgColor="bg-blue-50" />
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <DataTable
                    data={colors}
                    columns={columns}
                    isLoading={loading}
                    searchKey="colorName"
                    enableSelection={true}
                    onEditClick={(row: any) => {
                        setCurrentColor(row)
                        setIsEditOpen(true)
                    }}
                    onDelete={(row: any) => handleDelete(row)}
                    onDeleteSelected={handleBulkDelete}
                />
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-border shadow-none">
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
