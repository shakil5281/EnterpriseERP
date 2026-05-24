"use client"

import * as React from "react"
import {
    IconPalette,
    IconPlus,
    IconRefresh,
    IconCheck,
    IconX,
    IconLoader2,
    IconDownload,
    IconUpload,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { merchandisingService } from "@/lib/services/merchandising"
import type { MasterDataDto } from "@/lib/types/merchandising"
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

type ColorForm = { id?: string; name: string; code: string; isActive: boolean }

export default function ColorsPage() {
    const [colors, setColors] = React.useState<MasterDataDto[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [currentColor, setCurrentColor] = React.useState<ColorForm>({ name: "", code: "", isActive: true })
    const [importing, setImporting] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const colorInputRef = React.useRef<HTMLInputElement>(null)
    const editColorInputRef = React.useRef<HTMLInputElement>(null)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getMasterData("colors")
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
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId) {
            toast.error("No active company selected")
            return
        }
        if (!currentColor.name.trim()) {
            toast.error("Color name is required")
            return
        }
        try {
            await merchandisingService.createMasterData("colors", {
                companyId,
                code: currentColor.code.trim() || currentColor.name.trim().slice(0, 12).toUpperCase(),
                name: currentColor.name.trim(),
                extra: currentColor.code.trim() || undefined,
            })
            toast.success("Color added to library")
            setIsCreateOpen(false)
            setCurrentColor({ name: "", code: "", isActive: true })
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to add color")
        }
    }

    const handleUpdateColor = async () => {
        if (!currentColor.id || !currentColor.name.trim()) {
            toast.error("Color name is required")
            return
        }
        try {
            await merchandisingService.updateMasterData("colors", currentColor.id, {
                name: currentColor.name.trim(),
                isActive: currentColor.isActive,
                extra: currentColor.code.trim() || undefined,
            })
            toast.success("Color updated successfully")
            setIsEditOpen(false)
            setCurrentColor({ name: "", code: "", isActive: true })
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update color")
        }
    }

    const handleDelete = async (color: MasterDataDto) => {
        try {
            await merchandisingService.deleteMasterData("colors", color.id)
            toast.success("Color deleted")
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete color")
        }
    }

    const handleBulkDelete = async (selectedRows: MasterDataDto[]) => {
        try {
            const loadingToast = toast.loading(`Deleting ${selectedRows.length} colors...`)
            await Promise.all(selectedRows.map(row => merchandisingService.deleteMasterData("colors", row.id)))
            toast.dismiss(loadingToast)
            toast.success(`${selectedRows.length} colors deleted successfully`)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Bulk delete failed")
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await merchandisingService.downloadColorImportTemplate()
            toast.success("Template downloaded")
        } catch (error) {
            console.error(error)
            toast.error("Failed to download template")
        }
    }

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId) {
            toast.error("No active company selected")
            return
        }
        try {
            setImporting(true)
            const result = await merchandisingService.importColors(file, companyId)
            toast.success(`Imported ${result.createdCount} colors (${result.updatedCount} updated)`)
            if (result.errors.length > 0) {
                toast.warning(`${result.skippedCount} rows skipped — check console for details`)
                console.warn("Color import errors:", result.errors)
            }
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Color import failed")
        } finally {
            setImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const columns = React.useMemo<ColumnDef<MasterDataDto>[]>(() => [
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-muted-foreground/60 font-mono">{row.original.code}</span>
            ),
            size: 80,
        },
        {
            accessorKey: "name",
            header: "Color Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div
                        className="size-4 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: row.original.extra?.startsWith("#") ? row.original.extra : "#eee" }}
                    />
                    <span className="font-bold text-foreground">{row.getValue("name")}</span>
                </div>
            )
        },
        {
            id: "hex",
            header: "Pantone / Hex",
            cell: ({ row }) => (
                <code className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono font-bold text-muted-foreground">
                    {row.original.extra || "N/A"}
                </code>
            )
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => (
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Color Library</h1>
                    <p className="text-sm text-muted-foreground">Manage global fabric colors and Pantone specifications</p>
                </div>
                <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
                    <Button variant="outline" className="h-10 px-4 font-bold" onClick={handleDownloadTemplate}>
                        <IconDownload className="size-4 mr-2" />
                        Template
                    </Button>
                    <Button variant="outline" className="h-10 px-4 font-bold" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                        {importing ? <IconLoader2 className="size-4 mr-2 animate-spin" /> : <IconUpload className="size-4 mr-2" />}
                        Import CSV
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
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
                                    <Input id="colorName" placeholder="e.g. Midnight Blue" value={currentColor.name} onChange={(e) => setCurrentColor({ ...currentColor, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pantoneCode">Pantone or Hex Code</Label>
                                    <div className="flex gap-2">
                                        <Input id="pantoneCode" placeholder="e.g. #191970" value={currentColor.code} onChange={(e) => setCurrentColor({ ...currentColor, code: e.target.value })} className="font-mono" />
                                        <input type="color" ref={colorInputRef} className="hidden" value={currentColor.code?.startsWith("#") && currentColor.code.length === 7 ? currentColor.code : "#ffffff"} onChange={(e) => setCurrentColor({ ...currentColor, code: e.target.value.toUpperCase() })} />
                                        <div className="size-10 rounded-lg border border-border shrink-0 cursor-pointer" style={{ backgroundColor: currentColor.code || "#eee" }} onClick={() => colorInputRef.current?.click()} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateColor}>Save Color</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Color</DialogTitle>
                                <DialogDescription>Update color specifications</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="editColorName">Color Name</Label>
                                    <Input id="editColorName" value={currentColor.name} onChange={(e) => setCurrentColor({ ...currentColor, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editPantoneCode">Pantone or Hex Code</Label>
                                    <div className="flex gap-2">
                                        <Input id="editPantoneCode" value={currentColor.code} onChange={(e) => setCurrentColor({ ...currentColor, code: e.target.value })} className="font-mono" />
                                        <input type="color" ref={editColorInputRef} className="hidden" value={currentColor.code?.startsWith("#") && currentColor.code.length === 7 ? currentColor.code : "#ffffff"} onChange={(e) => setCurrentColor({ ...currentColor, code: e.target.value.toUpperCase() })} />
                                        <div className="size-10 rounded-lg border border-border shrink-0 cursor-pointer" style={{ backgroundColor: currentColor.code || "#eee" }} onClick={() => editColorInputRef.current?.click()} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="editActive" checked={currentColor.isActive} onCheckedChange={(checked) => setCurrentColor({ ...currentColor, isActive: !!checked })} />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Total Colors" value={colors.length.toString()} icon={IconPalette} color="text-indigo-600" bgColor="bg-indigo-50" />
                <KPICard title="Active Colors" value={colors.filter(c => c.isActive).length.toString()} icon={IconPalette} color="text-emerald-600" bgColor="bg-emerald-50" />
                <KPICard title="With Hex/Pantone" value={colors.filter(c => c.extra).length.toString()} icon={IconPalette} color="text-blue-600" bgColor="bg-blue-50" />
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <DataTable
                    data={colors}
                    columns={columns}
                    isLoading={loading}
                    searchKey="name"
                    enableSelection={true}
                    onEditClick={(row: MasterDataDto) => {
                        setCurrentColor({ id: row.id, name: row.name, code: row.extra || "", isActive: row.isActive })
                        setIsEditOpen(true)
                    }}
                    onDelete={(row: MasterDataDto) => handleDelete(row)}
                    onDeleteSelected={handleBulkDelete}
                />
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }) {
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
