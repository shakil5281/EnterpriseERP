"use client"

import * as React from "react"
import {
    IconTag,
    IconPlus,
    IconSearch,
    IconChevronRight,
    IconLoader2,
    IconRefresh,
    IconTrash
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
import { merchandisingService } from "@/lib/services/merchandising"
import type { Buyer, MasterDataDto } from "@/lib/types/merchandising"
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function BrandsPage() {
    const [brands, setBrands] = React.useState<MasterDataDto[]>([])
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [newBrand, setNewBrand] = React.useState({ code: "", name: "", buyerId: "" })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [buyersData, brandsData] = await Promise.all([
                merchandisingService.getBuyers(),
                merchandisingService.getMasterData("brands"),
            ])
            setBuyers(buyersData)
            setBrands(brandsData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load brands")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleCreateBrand = async () => {
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId) {
            toast.error("No active company selected")
            return
        }
        if (!newBrand.name.trim() || !newBrand.buyerId) {
            toast.error("Please fill all required fields")
            return
        }
        try {
            await merchandisingService.createMasterData("brands", {
                companyId,
                code: newBrand.code.trim() || newBrand.name.trim().slice(0, 8).toUpperCase(),
                name: newBrand.name.trim(),
                extra: newBrand.buyerId,
            })
            toast.success("Brand created successfully")
            setIsCreateOpen(false)
            setNewBrand({ code: "", name: "", buyerId: "" })
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create brand")
        }
    }

    const handleDeleteBrand = async (id: string) => {
        if (!confirm("Are you sure you want to delete this brand?")) return
        try {
            await merchandisingService.deleteMasterData("brands", id)
            toast.success("Brand deleted successfully")
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete brand")
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const buyerName = (buyerId?: string | null) =>
        buyers.find(b => b.id === buyerId)?.buyerName || "Unknown"

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Active Brands</h1>
                    <p className="text-sm text-muted-foreground font-medium">Buyer subdivisions, retail labels and production branding</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 border border-border rounded-lg" onClick={fetchData} disabled={loading}>
                        <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 font-semibold">
                                <IconPlus className="size-4 mr-2" />
                                Add Brand
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Add New Brand</DialogTitle>
                                <DialogDescription>Register a brand subdivision linked to a buyer</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Strategic Partner</Label>
                                    <select
                                        className="flex h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        value={newBrand.buyerId}
                                        onChange={(e) => setNewBrand({ ...newBrand, buyerId: e.target.value })}
                                    >
                                        <option value="">Select a partner</option>
                                        {buyers.map(b => (
                                            <option key={b.id} value={b.id}>{b.buyerName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Brand Code</Label>
                                    <Input placeholder="e.g. DNMCOL" value={newBrand.code} onChange={(e) => setNewBrand({ ...newBrand, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Brand Name</Label>
                                    <Input placeholder="e.g. Denim Collection" value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateBrand}>Save Brand</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Brands" value={brands.length.toString()} icon={IconTag} color="text-indigo-600" bgColor="bg-indigo-50" />
                <KPICard title="Active Partners" value={buyers.length.toString()} icon={IconTag} color="text-emerald-600" bgColor="bg-emerald-50" />
            </div>

            <div className="relative w-full md:w-96">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                <Input placeholder="Search brands..." className="pl-9 h-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IconLoader2 className="size-10 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBrands.map((brand) => (
                            <Card key={brand.id} className="border-border bg-card shadow-none hover:border-indigo-500 transition-all overflow-hidden group">
                                <div className="h-1.5 bg-muted group-hover:bg-indigo-500 transition-colors" />
                                <CardHeader className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-border text-muted-foreground uppercase">
                                            {buyerName(brand.extra)}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/30 hover:text-rose-500" onClick={() => handleDeleteBrand(brand.id)}>
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-base font-bold">{brand.name}</CardTitle>
                                    <CardDescription className="text-xs font-semibold mt-1">{brand.code}</CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5 pt-0">
                                    <Button variant="ghost" className="w-full h-10 border border-border justify-between text-[11px] font-bold uppercase">
                                        Catalog Styles <IconChevronRight className="size-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }) {
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
