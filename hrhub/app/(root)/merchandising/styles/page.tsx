"use client"

import * as React from "react"
import {
    IconScissors,
    IconPlus,
    IconEye,
    IconLoader2,
    IconShirt,
    IconPencil,
    IconTrash,
    IconDotsVertical,
    IconFilter,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { merchandisingService, Style, Buyer, Brand } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"

export default function StylesPage() {
    const [styles, setStyles] = React.useState<Style[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [brands, setBrands] = React.useState<Brand[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [newStyle, setNewStyle] = React.useState<Partial<Style>>({
        styleNumber: "",
        buyerId: 0,
        brandId: 0,
        productType: "",
        season: "SS26",
        fabricType: "",
        gsm: "",
        companyId: 1
    })
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingStyle, setEditingStyle] = React.useState<Style | null>(null)
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [viewingStyle, setViewingStyle] = React.useState<Style | null>(null)
    const [filters, setFilters] = React.useState({
        styleNumber: "",
        buyerId: "all",
        season: "",
        productType: "",
        fabricType: "",
        gsm: "",
    })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const buyersData = await merchandisingService.getBuyers(1)
            setBuyers(buyersData)

            if (buyersData.length > 0) {
                const styleResponses = await Promise.all(
                    buyersData.map((buyer) => merchandisingService.getStyles(buyer.id))
                )
                const allStyles = styleResponses.flat()
                const uniqueStyles = Array.from(
                    new Map(allStyles.map((style) => [style.id, style])).values()
                )
                setStyles(uniqueStyles)
            } else {
                setStyles([])
            }
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

    const filteredStyles = React.useMemo(() => {
        return styles.filter((style) => {
            const styleNo = style.styleNumber?.toLowerCase() ?? ""
            const season = style.season?.toLowerCase() ?? ""
            const productType = style.productType?.toLowerCase() ?? ""
            const fabricType = style.fabricType?.toLowerCase() ?? ""
            const gsm = style.gsm?.toLowerCase() ?? ""

            const matchesStyleNo =
                !filters.styleNumber || styleNo.includes(filters.styleNumber.toLowerCase())
            const matchesBuyer =
                filters.buyerId === "all" || style.buyerId === Number(filters.buyerId)
            const matchesSeason =
                !filters.season || season.includes(filters.season.toLowerCase())
            const matchesProductType =
                !filters.productType || productType.includes(filters.productType.toLowerCase())
            const matchesFabricType =
                !filters.fabricType || fabricType.includes(filters.fabricType.toLowerCase())
            const matchesGsm =
                !filters.gsm || gsm.includes(filters.gsm.toLowerCase())

            return (
                matchesStyleNo &&
                matchesBuyer &&
                matchesSeason &&
                matchesProductType &&
                matchesFabricType &&
                matchesGsm
            )
        })
    }, [styles, filters])

    const handleCreate = async () => {
        try {
            await merchandisingService.createStyle(newStyle)
            toast.success("Style created successfully")
            setIsCreateOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create style")
        }
    }

    const handleEdit = async (style: Style) => {
        setEditingStyle(style)
        if (style.buyerId) {
            const brandData = await merchandisingService.getBrands(style.buyerId);
            setBrands(brandData);
        }
        setIsEditOpen(true)
    }

    const handleView = async (style: Style) => {
        setViewingStyle(style)
        setIsViewOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingStyle) return;
        try {
            await merchandisingService.updateStyle(editingStyle.id, editingStyle)
            toast.success("Style updated successfully")
            setIsEditOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update style")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this style?")) return;
        try {
            await merchandisingService.deleteStyle(id)
            toast.success("Style deleted successfully")
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete style")
        }
    }

    const columns: ColumnDef<Style>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => (
                <span className="text-xs font-mono text-muted-foreground/70">
                    {(row.index + 1).toString().padStart(2, '0')}
                </span>
            ),
            size: 50,
        },
        {
            accessorKey: "styleNumber",
            header: "Style Number",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.getValue("styleNumber")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.season}</span>
                </div>
            )
        },
        {
            accessorKey: "productType",
            header: "Product Type",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                    {row.getValue("productType")}
                </Badge>
            )
        },
        {
            accessorKey: "fabricType",
            header: "Fabric Specification",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate text-xs font-medium italic text-muted-foreground">
                    {row.getValue("fabricType") || "N/A"}
                </div>
            )
        },
        {
            accessorKey: "gsm",
            header: "GSM",
            cell: ({ row }) => (
                <span className="font-mono text-xs">{row.getValue("gsm") || "-"}</span>
            )
        },
        {
            accessorKey: "season",
            header: "Season",
            cell: ({ row }) => <span className="text-xs font-bold text-primary">{row.getValue("season")}</span>
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
                        <DropdownMenuItem className="gap-2" onClick={() => handleView(row.original)}>
                            <IconEye className="size-4 text-muted-foreground" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleEdit(row.original)}>
                            <IconPencil className="size-4 text-primary" />
                            Edit Style
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => handleDelete(row.original.id)}>
                            <IconTrash className="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
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
                            <Button size="sm" className="gap-2 shadow-md">
                                <IconPlus className="size-4" />
                                New Style
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Register New Style</DialogTitle>
                                <DialogDescription>Create a new technical style profile</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Buyer Partner</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={newStyle.buyerId}
                                            onChange={async (e) => {
                                                const bId = parseInt(e.target.value);
                                                setNewStyle({ ...newStyle, buyerId: bId, brandId: 0 });
                                                if (bId > 0) {
                                                    const brandData = await merchandisingService.getBrands(bId);
                                                    setBrands(brandData);
                                                } else {
                                                    setBrands([]);
                                                }
                                            }}
                                        >
                                            <option value="0">Select Buyer</option>
                                            {buyers.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Brand / Division</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                            value={newStyle.brandId}
                                            disabled={!newStyle.buyerId}
                                            onChange={(e) => setNewStyle({ ...newStyle, brandId: parseInt(e.target.value) })}
                                        >
                                            <option value="0">Select Brand</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs" htmlFor="styleNo">Style Number</Label>
                                        <Input id="styleNo" placeholder="e.g. JK-402" value={newStyle.styleNumber || ""} onChange={(e) => setNewStyle({ ...newStyle, styleNumber: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs" htmlFor="type">Product Type</Label>
                                        <Input id="type" placeholder="e.g. Denim Jacket" value={newStyle.productType || ""} onChange={(e) => setNewStyle({ ...newStyle, productType: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs" htmlFor="fabric">Fabric Type</Label>
                                        <Input id="fabric" placeholder="e.g. 100% Cotton" value={newStyle.fabricType || ""} onChange={(e) => setNewStyle({ ...newStyle, fabricType: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs" htmlFor="gsm">GSM</Label>
                                        <Input id="gsm" placeholder="280" value={newStyle.gsm || ""} onChange={(e) => setNewStyle({ ...newStyle, gsm: e.target.value })} />
                                    </div>
                                </div>
                            </div>
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
                            <IconFilter className="size-4 text-primary" />
                            Advanced Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Style Number</Label>
                                <Input
                                    placeholder="e.g. JK-402"
                                    value={filters.styleNumber}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, styleNumber: e.target.value }))}
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
                                <Label className="text-xs">Season</Label>
                                <Input
                                    placeholder="e.g. SS26"
                                    value={filters.season}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, season: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Product Type</Label>
                                <Input
                                    placeholder="e.g. T-Shirt"
                                    value={filters.productType}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, productType: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Fabric Type</Label>
                                <Input
                                    placeholder="e.g. Cotton"
                                    value={filters.fabricType}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, fabricType: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">GSM</Label>
                                <Input
                                    placeholder="e.g. 180"
                                    value={filters.gsm}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, gsm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Showing {filteredStyles.length} of {styles.length} styles
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setFilters({
                                        styleNumber: "",
                                        buyerId: "all",
                                        season: "",
                                        productType: "",
                                        fabricType: "",
                                        gsm: "",
                                    })
                                }
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <DataTable
                    columns={columns}
                    data={filteredStyles}
                    isLoading={loading}
                    searchKey="styleNumber"
                    showTabs={false}
                    onAddClick={() => setIsCreateOpen(true)}
                    addLabel="Add Style"
                    enableSelection={true}
                    enableDrag={true}
                />
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Style Profile</DialogTitle>
                        <DialogDescription>Modify technical specifications for this style</DialogDescription>
                    </DialogHeader>
                    {editingStyle && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Buyer Partner</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingStyle.buyerId}
                                        onChange={async (e) => {
                                            const bId = parseInt(e.target.value);
                                            setEditingStyle({ ...editingStyle, buyerId: bId, brandId: 0 });
                                            if (bId > 0) {
                                                const brandData = await merchandisingService.getBrands(bId);
                                                setBrands(brandData);
                                            } else {
                                                setBrands([]);
                                            }
                                        }}
                                    >
                                        <option value="0">Select Buyer</option>
                                        {buyers.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Brand / Division</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                        value={editingStyle.brandId}
                                        disabled={!editingStyle.buyerId}
                                        onChange={(e) => setEditingStyle({ ...editingStyle, brandId: parseInt(e.target.value) })}
                                    >
                                        <option value="0">Select Brand</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs" htmlFor="edit-styleNo">Style Number</Label>
                                    <Input id="edit-styleNo" placeholder="e.g. JK-402" value={editingStyle.styleNumber || ""} onChange={(e) => setEditingStyle({ ...editingStyle, styleNumber: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs" htmlFor="edit-type">Product Type</Label>
                                    <Input id="edit-type" placeholder="e.g. Denim Jacket" value={editingStyle.productType || ""} onChange={(e) => setEditingStyle({ ...editingStyle, productType: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs" htmlFor="edit-fabric">Fabric Type</Label>
                                    <Input id="edit-fabric" placeholder="e.g. 100% Cotton" value={editingStyle.fabricType || ""} onChange={(e) => setEditingStyle({ ...editingStyle, fabricType: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs" htmlFor="edit-gsm">GSM</Label>
                                    <Input id="edit-gsm" placeholder="280" value={editingStyle.gsm || ""} onChange={(e) => setEditingStyle({ ...editingStyle, gsm: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdate}>Update Style</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconEye className="size-5 text-primary" />
                            Style Technical Profile
                        </DialogTitle>
                        <DialogDescription>Technical specifications and registration details</DialogDescription>
                    </DialogHeader>
                    {viewingStyle && (
                        <div className="grid gap-6 py-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <IconShirt className="size-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{viewingStyle.styleNumber}</h3>
                                        <p className="text-xs text-muted-foreground uppercase font-medium">{viewingStyle.season}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="h-6 font-bold bg-background px-3">
                                    {viewingStyle.productType}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-1">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Fabric Type</Label>
                                    <p className="font-medium text-sm">{viewingStyle.fabricType || "Not Specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">GSM / Density</Label>
                                    <p className="font-medium font-mono text-sm">{viewingStyle.gsm || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Partner Buyer</Label>
                                    <p className="font-medium text-sm text-primary">
                                        {buyers.find(b => b.id === viewingStyle.buyerId)?.name || "External Partner"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Style UID</Label>
                                    <p className="font-mono text-xs text-muted-foreground">STY_ID_{viewingStyle.id.toString().padStart(6, '0')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" size="sm" className="w-full" onClick={() => setIsViewOpen(false)}>Close Profile</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
