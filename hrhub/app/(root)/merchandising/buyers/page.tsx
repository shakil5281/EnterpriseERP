"use client"

import * as React from "react"
import {
    IconUsers,
    IconPlus,
    IconSearch,
    IconMail,
    IconWorld,
    IconUser,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconLoader2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Buyer, CreateBuyerRequest, UpdateBuyerRequest } from "@/lib/types/merchandising"
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const emptyCreateForm = (): Partial<CreateBuyerRequest> => ({
    buyerCode: "",
    buyerName: "",
    country: "",
    contactPerson: "",
    email: "",
    currency: "USD",
    leadTimeDays: 0,
})

export default function BuyersPage() {
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [selectedBuyer, setSelectedBuyer] = React.useState<Buyer | null>(null)
    const [newBuyer, setNewBuyer] = React.useState<Partial<CreateBuyerRequest>>(emptyCreateForm())

    const fetchBuyers = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getBuyers()
            setBuyers(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load buyers")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchBuyers()
    }, [fetchBuyers])

    const handleCreate = async () => {
        const companyId = getActiveCompanyHeaderValue()
        if (!companyId) {
            toast.error("No active company selected")
            return
        }
        if (!newBuyer.buyerCode?.trim() || !newBuyer.buyerName?.trim()) {
            toast.error("Buyer code and name are required")
            return
        }
        try {
            const payload: CreateBuyerRequest = {
                companyId,
                buyerCode: newBuyer.buyerCode.trim(),
                buyerName: newBuyer.buyerName.trim(),
                country: newBuyer.country,
                contactPerson: newBuyer.contactPerson,
                email: newBuyer.email,
                phone: newBuyer.phone,
                address: newBuyer.address,
                paymentTerms: newBuyer.paymentTerms,
                currency: newBuyer.currency,
                leadTimeDays: newBuyer.leadTimeDays,
            }
            await merchandisingService.createBuyer(payload)
            toast.success("Buyer created successfully")
            setIsCreateOpen(false)
            setNewBuyer(emptyCreateForm())
            fetchBuyers()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create buyer")
        }
    }

    const handleUpdate = async () => {
        if (!selectedBuyer) return
        try {
            const payload: UpdateBuyerRequest = {
                buyerName: selectedBuyer.buyerName,
                country: selectedBuyer.country ?? undefined,
                contactPerson: selectedBuyer.contactPerson ?? undefined,
                email: selectedBuyer.email ?? undefined,
                phone: selectedBuyer.phone ?? undefined,
                address: selectedBuyer.address ?? undefined,
                isActive: selectedBuyer.isActive,
                paymentTerms: selectedBuyer.paymentTerms ?? undefined,
                currency: selectedBuyer.currency ?? undefined,
                leadTimeDays: selectedBuyer.leadTimeDays ?? undefined,
            }
            await merchandisingService.updateBuyer(selectedBuyer.id, payload)
            toast.success("Buyer updated successfully")
            setIsEditOpen(false)
            fetchBuyers()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update buyer")
        }
    }

    const handleDeactivate = async (buyer: Buyer) => {
        if (!confirm("Deactivate this buyer?")) return
        try {
            await merchandisingService.deactivateBuyer(buyer.id)
            toast.success("Buyer deactivated")
            fetchBuyers()
        } catch (error) {
            console.error(error)
            toast.error("Failed to deactivate buyer")
        }
    }

    const filteredBuyers = buyers.filter(b =>
        b.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.buyerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.country ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconUsers className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Buyer Directory</h1>
                        <p className="text-muted-foreground text-sm">Manage global buyer partners and contacts</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search partners..."
                            className="pl-9 h-9 w-64 bg-muted/20 border-muted-foreground/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <IconPlus className="size-4" />
                                Add Buyer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>New Buyer Partner</DialogTitle>
                                <DialogDescription>Register a new buyer profile in the system</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Buyer Code</Label>
                                        <Input placeholder="e.g. ZARA" value={newBuyer.buyerCode || ""} onChange={(e) => setNewBuyer({ ...newBuyer, buyerCode: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Buyer Name</Label>
                                        <Input placeholder="e.g. Zara" value={newBuyer.buyerName || ""} onChange={(e) => setNewBuyer({ ...newBuyer, buyerName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Country</Label>
                                        <Input placeholder="e.g. Spain" value={newBuyer.country || ""} onChange={(e) => setNewBuyer({ ...newBuyer, country: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Contact Person</Label>
                                        <Input placeholder="Full Name" value={newBuyer.contactPerson || ""} onChange={(e) => setNewBuyer({ ...newBuyer, contactPerson: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Email</Label>
                                        <Input type="email" placeholder="partner@buyer.com" value={newBuyer.email || ""} onChange={(e) => setNewBuyer({ ...newBuyer, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Currency</Label>
                                        <Input value={newBuyer.currency || ""} onChange={(e) => setNewBuyer({ ...newBuyer, currency: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Lead Time (Days)</Label>
                                    <Input type="number" value={newBuyer.leadTimeDays ?? 0} onChange={(e) => setNewBuyer({ ...newBuyer, leadTimeDays: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleCreate}>Save Buyer</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Update Buyer Profile</DialogTitle>
                        <DialogDescription>Modify partner information and settings</DialogDescription>
                    </DialogHeader>
                    {selectedBuyer && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Buyer Code</Label>
                                    <Input value={selectedBuyer.buyerCode} readOnly className="bg-muted/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Buyer Name</Label>
                                    <Input value={selectedBuyer.buyerName} onChange={(e) => setSelectedBuyer({ ...selectedBuyer, buyerName: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Country</Label>
                                    <Input value={selectedBuyer.country || ""} onChange={(e) => setSelectedBuyer({ ...selectedBuyer, country: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Contact Person</Label>
                                    <Input value={selectedBuyer.contactPerson || ""} onChange={(e) => setSelectedBuyer({ ...selectedBuyer, contactPerson: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Email</Label>
                                <Input type="email" value={selectedBuyer.email || ""} onChange={(e) => setSelectedBuyer({ ...selectedBuyer, email: e.target.value })} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <Label className="text-xs">Active Status</Label>
                                <Switch checked={selectedBuyer.isActive} onCheckedChange={(val) => setSelectedBuyer({ ...selectedBuyer, isActive: val })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <IconLoader2 className="size-8 animate-spin text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loading Partners...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6">
                    {filteredBuyers.map((buyer) => (
                        <Card key={buyer.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 rounded-lg border">
                                        <AvatarFallback className="bg-primary/5 text-primary font-bold rounded-lg uppercase">
                                            {buyer.buyerName.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold tracking-tight text-sm line-clamp-1">{buyer.buyerName}</h3>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                            <IconWorld className="size-3" /> {buyer.country || "—"}
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <IconDotsVertical className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={() => { setSelectedBuyer(buyer); setIsEditOpen(true); }}>
                                            <IconEdit className="mr-2 size-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDeactivate(buyer)} className="text-red-600 focus:text-red-700">
                                            <IconTrash className="mr-2 size-4" /> Deactivate
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-4">
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <IconUser className="size-3.5 text-muted-foreground" />
                                        <span className="font-medium truncate">{buyer.contactPerson || "No Contact"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <IconMail className="size-3.5 text-muted-foreground" />
                                        <span className="font-medium truncate">{buyer.email || "No Email"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex gap-1.5">
                                        <Badge variant="secondary" className="text-[9px] font-bold h-4 px-1.5 uppercase tracking-tighter">
                                            {buyer.buyerCode}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[9px] font-bold h-4 px-1.5 uppercase tracking-tighter">
                                            {buyer.currency}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[9px] font-bold h-4 px-1.5 uppercase tracking-tighter">
                                            {buyer.leadTimeDays || 0}d
                                        </Badge>
                                    </div>
                                    <Badge variant={buyer.isActive ? "default" : "secondary"} className={cn("text-[10px] h-4 px-1.5 uppercase font-bold", buyer.isActive ? "bg-emerald-500 hover:bg-emerald-600" : "")}>
                                        {buyer.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        variant="ghost"
                        onClick={() => setIsCreateOpen(true)}
                        className="border-2 border-dashed rounded-xl h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-muted-foreground hover:bg-muted/50 hover:border-primary/50 transition-all gap-2"
                    >
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                            <IconPlus className="size-6" />
                        </div>
                        <span className="font-bold text-sm">Add New Partner</span>
                    </Button>
                </div>
            )}
        </div>
    )
}
