"use client"

import * as React from "react"
import {
    IconScissors,
    IconPlus,
    IconEye,
    IconLoader2,
    IconShirt,
    IconPencil,
    IconDotsVertical,
    IconFilter,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Style, Buyer, MasterDataDto, CreateStyleRequest, UpdateStyleRequest } from "@/lib/types/merchandising"
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"

type StyleForm = {
    buyerId: string
    brandId: string
    styleNo: string
    styleName: string
    description: string
    fabricDescription: string
}

const emptyForm = (): StyleForm => ({
    buyerId: "",
    brandId: "",
    styleNo: "",
    styleName: "",
    description: "",
    fabricDescription: "",
})

export default function StylesPage() {
    const [styles, setStyles] = React.useState<Style[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [brands, setBrands] = React.useState<MasterDataDto[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [newStyle, setNewStyle] = React.useState<StyleForm>(emptyForm())
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingStyle, setEditingStyle] = React.useState<Style | null>(null)
    const [editForm, setEditForm] = React.useState<StyleForm>(emptyForm())
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [viewingStyle, setViewingStyle] = React.useState<Style | null>(null)
    const [filters, setFilters] = React.useState({
        styleNo: "",
        buyerId: "all",
        styleName: "",
        fabricDescription: "",
    })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [buyersData, stylesData] = await Promise.all([
                merchandisingService.getBuyers(),
                merchandisingService.getStyles(),
            ])
            setBuyers(buyersData)
            setStyles(stylesData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load styles")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const loadBrandsForBuyer = async (buyerId: string) => {
        if (!buyerId) {
            setBrands([])
            return
        }
        const brandData = await merchandisingService.getBrandsByBuyer(buyerId)
        setBrands(brandData)
    }

    const buyerLabel = (buyerId: string) => buyers.find(b => b.id === buyerId)?.buyerName ?? "—"

    const filteredStyles = React.useMemo(() => {
        return styles.filter((style) => {
            const styleNo = style.styleNo?.toLowerCase() ?? ""
            const styleName = style.styleName?.toLowerCase() ?? ""
            const fabric = style.fabricDescription?.toLowerCase() ?? ""
            return (
                (!filters.styleNo || styleNo.includes(filters.styleNo.toLowerCase())) &&
                (filters.buyerId === "all" || style.buyerId === filters.buyerId) &&
                (!filters.styleName || styleName.includes(filters.styleName.toLowerCase())) &&
                (!filters.fabricDescription || fabric.includes(filters.fabricDescription.toLowerCase()))
            )
        })
    }, [styles, filters])

    const handleCreate = async () => {
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId || !newStyle.buyerId || !newStyle.styleNo.trim()) {
            toast.error("Buyer and style number are required")
            return
        }
        try {
            const payload: CreateStyleRequest = {
                companyId,
                buyerId: newStyle.buyerId,
                brandId: newStyle.brandId || undefined,
                styleNo: newStyle.styleNo.trim(),
                styleName: newStyle.styleName.trim() || undefined,
                description: newStyle.description.trim() || undefined,
                fabricDescription: newStyle.fabricDescription.trim() || undefined,
            }
            await merchandisingService.createStyle(payload)
            toast.success("Style created successfully")
            setIsCreateOpen(false)
            setNewStyle(emptyForm())
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create style")
        }
    }

    const handleEdit = async (style: Style) => {
        setEditingStyle(style)
        setEditForm({
            buyerId: style.buyerId,
            brandId: style.brandId ?? "",
            styleNo: style.styleNo,
            styleName: style.styleName ?? "",
            description: style.description ?? "",
            fabricDescription: style.fabricDescription ?? "",
        })
        await loadBrandsForBuyer(style.buyerId)
        setIsEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingStyle) return
        try {
            const payload: UpdateStyleRequest = {
                brandId: editForm.brandId || undefined,
                styleName: editForm.styleName.trim() || undefined,
                description: editForm.description.trim() || undefined,
                fabricDescription: editForm.fabricDescription.trim() || undefined,
            }
            await merchandisingService.updateStyle(editingStyle.id, payload)
            toast.success("Style updated successfully")
            setIsEditOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update style")
        }
    }

    const columns: ColumnDef<Style>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground/70">{(row.index + 1).toString().padStart(2, "0")}</span>,
            size: 50,
        },
        {
            accessorKey: "styleNo",
            header: "Style No",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.getValue("styleNo")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.styleName || "—"}</span>
                </div>
            )
        },
        {
            id: "buyer",
            header: "Buyer",
            cell: ({ row }) => <span className="text-xs font-medium">{buyerLabel(row.original.buyerId)}</span>
        },
        {
            accessorKey: "fabricDescription",
            header: "Fabric",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate text-xs italic text-muted-foreground">
                    {row.getValue("fabricDescription") || "N/A"}
                </div>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Options</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2" onClick={() => { setViewingStyle(row.original); setIsViewOpen(true); }}>
                            <IconEye className="size-4 text-muted-foreground" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleEdit(row.original)}>
                            <IconPencil className="size-4 text-primary" /> Edit Style
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    const styleFormFields = (
        form: StyleForm,
        setForm: React.Dispatch<React.SetStateAction<StyleForm>>,
        opts?: { lockStyleNo?: boolean; lockBuyer?: boolean }
    ) => (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs">Buyer Partner</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.buyerId}
                        disabled={opts?.lockBuyer}
                        onChange={async (e) => {
                            const buyerId = e.target.value
                            setForm({ ...form, buyerId, brandId: "" })
                            await loadBrandsForBuyer(buyerId)
                        }}
                    >
                        <option value="">Select Buyer</option>
                        {buyers.map(b => <option key={b.id} value={b.id}>{b.buyerName}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Brand / Division</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                        value={form.brandId}
                        disabled={!form.buyerId}
                        onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    >
                        <option value="">Select Brand</option>
                        {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs">Style Number</Label>
                    <Input value={form.styleNo} readOnly={opts?.lockStyleNo} onChange={(e) => setForm({ ...form, styleNo: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Style Name</Label>
                    <Input value={form.styleName} onChange={(e) => setForm({ ...form, styleName: e.target.value })} />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Fabric Description</Label>
                <Input value={form.fabricDescription} onChange={(e) => setForm({ ...form, fabricDescription: e.target.value })} />
            </div>
        </div>
    )

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconScissors className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Style Directory</h1>
                        <p className="text-muted-foreground text-sm">Unified repository for product technical specifications</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="font-bold" onClick={fetchData}>
                        <IconLoader2 className={cn("size-3.5 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <IconPlus className="size-4" /> New Style
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Register New Style</DialogTitle>
                                <DialogDescription>Create a new technical style profile</DialogDescription>
                            </DialogHeader>
                            {styleFormFields(newStyle, setNewStyle)}
                            <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleCreate}>Save Style</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="px-2">
                <Card className="mb-4">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <IconFilter className="size-4 text-primary" /> Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Input placeholder="Style No" value={filters.styleNo} onChange={(e) => setFilters(p => ({ ...p, styleNo: e.target.value }))} />
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filters.buyerId} onChange={(e) => setFilters(p => ({ ...p, buyerId: e.target.value }))}>
                                <option value="all">All Buyers</option>
                                {buyers.map(b => <option key={b.id} value={b.id}>{b.buyerName}</option>)}
                            </select>
                            <Input placeholder="Style Name" value={filters.styleName} onChange={(e) => setFilters(p => ({ ...p, styleName: e.target.value }))} />
                            <Input placeholder="Fabric" value={filters.fabricDescription} onChange={(e) => setFilters(p => ({ ...p, fabricDescription: e.target.value }))} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Showing {filteredStyles.length} of {styles.length} styles</p>
                    </CardContent>
                </Card>

                <DataTable columns={columns} data={filteredStyles} isLoading={loading} searchKey="styleNo" showTabs={false} onAddClick={() => setIsCreateOpen(true)} addLabel="Add Style" enableSelection={true} enableDrag={true} />
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Style Profile</DialogTitle>
                    </DialogHeader>
                    {styleFormFields(editForm, setEditForm, { lockStyleNo: true, lockBuyer: true })}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdate}>Update Style</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconEye className="size-5 text-primary" /> Style Profile
                        </DialogTitle>
                    </DialogHeader>
                    {viewingStyle && (
                        <div className="grid gap-6 py-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border">
                                <IconShirt className="size-7 text-primary" />
                                <div>
                                    <h3 className="font-bold text-lg">{viewingStyle.styleNo}</h3>
                                    <p className="text-xs text-muted-foreground uppercase">{viewingStyle.styleName}</p>
                                </div>
                                <Badge variant="outline">{buyerLabel(viewingStyle.buyerId)}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><Label className="text-[10px] uppercase text-muted-foreground">Fabric</Label><p>{viewingStyle.fabricDescription || "—"}</p></div>
                                <div><Label className="text-[10px] uppercase text-muted-foreground">Description</Label><p>{viewingStyle.description || "—"}</p></div>
                                <div className="col-span-2"><Label className="text-[10px] uppercase text-muted-foreground">Style ID</Label><p className="font-mono text-xs">{viewingStyle.id}</p></div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
