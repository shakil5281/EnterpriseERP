"use client"

import * as React from "react"
import {
    IconSettings,
    IconPlus,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconBook,
    IconCircleCheck,
    IconHistory,
    IconCalendarCheck,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { leaveService, type LeaveType } from "@/lib/services/leave"
import { companyService } from "@/lib/services/company"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

function stableIntFromGuid(guid: string): number {
    const hex = guid.replace(/-/g, "").slice(0, 8);
    const n = parseInt(hex, 16);
    return Number.isFinite(n) ? (n | 0) : 0;
}

export default function LeaveTypePage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([])
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingType, setEditingType] = React.useState<LeaveType | null>(null)

    const [formData, setFormData] = React.useState({
        name: "",
        code: "",
        yearlyLimit: 0,
        isCarryForward: false,
        description: ""
    })

    React.useEffect(() => {
        loadLeaveTypes()
    }, [])

    const loadLeaveTypes = async () => {
        setIsLoading(true)
        try {
            const data = await leaveService.getLeaveTypes()
            setLeaveTypes(data)
        } catch (error) {
            toast.error("Failed to load leave types")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            const companies = await companyService.getAll()
            const companyGuid = companies[0]?.entityId
            if (!companyGuid) return

            if (editingType) {
                const list = await leaveService.listLeaveTypes(companyGuid)
                const realType = list.find(t => stableIntFromGuid(t.id) === editingType.id)
                if (!realType) throw new Error("Leave type not found")

                await leaveService.updateLeaveType(realType.id, {
                    leaveName: formData.name,
                    isPaid: true,
                    isCarryForward: formData.isCarryForward,
                    maxCarryForwardDays: formData.isCarryForward ? 10 : 0,
                    isEncashable: true
                })
                
                try {
                    const policies = await leaveService.listLeavePolicies(companyGuid)
                    const policy = policies.find(p => p.leaveTypeId === realType.id)
                    if (policy) {
                        await leaveService.updateLeavePolicy(policy.id, {
                            yearlyEntitlement: formData.yearlyLimit,
                            monthlyAccrual: parseFloat((formData.yearlyLimit / 12).toFixed(2)),
                            minServiceMonths: 0,
                            requiresApproval: true,
                            allowHalfDay: true,
                            allowNegativeBalance: false,
                            excludeHolidaysFromLeaveDays: true,
                            excludeWeeklyOffFromLeaveDays: true,
                            approvalLevelCount: 1,
                            isActive: true
                        })
                    }
                } catch (e) {
                    console.error("Failed to update leave policy", e)
                }

                toast.success("Leave type updated successfully")
            } else {
                const newType = await leaveService.createLeaveType({
                    companyId: companyGuid,
                    leaveCode: formData.code,
                    leaveName: formData.name,
                    isPaid: true,
                    isCarryForward: formData.isCarryForward,
                    maxCarryForwardDays: formData.isCarryForward ? 10 : 0,
                    isEncashable: true
                })

                try {
                    await leaveService.createLeavePolicy({
                        companyId: companyGuid,
                        leaveTypeId: newType.id,
                        yearlyEntitlement: formData.yearlyLimit,
                        monthlyAccrual: parseFloat((formData.yearlyLimit / 12).toFixed(2)),
                        minServiceMonths: 0,
                        requiresApproval: true,
                        allowHalfDay: true,
                        allowNegativeBalance: false,
                        excludeHolidaysFromLeaveDays: true,
                        excludeWeeklyOffFromLeaveDays: true,
                        approvalLevelCount: 1
                    })
                } catch (e) {
                    console.error("Failed to create policy", e)
                }

                toast.success("New leave type created")
            }
            loadLeaveTypes()
            handleCloseSheet()
        } catch (error) {
            toast.error("Failed to save leave type")
        }
    }

    const handleEdit = (type: LeaveType) => {
        setEditingType(type)
        setFormData({
            name: type.name,
            code: type.code,
            yearlyLimit: type.yearlyLimit,
            isCarryForward: type.isCarryForward,
            description: type.description || ""
        })
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: number) => {
        try {
            const companies = await companyService.getAll()
            const companyGuid = companies[0]?.entityId
            if (!companyGuid) return

            const list = await leaveService.listLeaveTypes(companyGuid)
            const realType = list.find(t => stableIntFromGuid(t.id) === id)
            if (!realType) throw new Error("Leave type not found")

            await leaveService.deactivateLeaveType(realType.id)
            toast.success("Leave type deactivated")
            loadLeaveTypes()
        } catch (error) {
            toast.error("Failed to deactivate leave type")
        }
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setEditingType(null)
        setFormData({ name: "", code: "", yearlyLimit: 0, isCarryForward: false, description: "" })
    }

    const columns: ColumnDef<LeaveType>[] = [
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => <Badge variant="secondary" className="font-mono">{row.original.code}</Badge>
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>
        },
        {
            accessorKey: "yearlyLimit",
            header: "Days/Year",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.original.yearlyLimit}</span>
                    <span className="text-xs text-muted-foreground italic">days</span>
                </div>
            )
        },
        {
            accessorKey: "isCarryForward",
            header: "Carry Forward",
            cell: ({ row }) => (
                <Badge variant={row.original.isCarryForward ? "default" : "outline"} className="gap-1">
                    {row.original.isCarryForward ? "YES" : "NO"}
                </Badge>
            )
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.description || "-"}</span>
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <IconDotsVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            <IconEdit className="mr-2 size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.original.id)}>
                            <IconTrash className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-8 py-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl shadow-inner shadow-indigo-500/5">
                            <IconSettings className="size-8 text-indigo-500" />
                        </div>
                        Leave Configuration
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">Define and manage different types of leaves and their policies</p>
                </div>

                <div className="flex items-center gap-3">
                    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
                        <SheetTrigger asChild>
                            <Button className="gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all font-semibold bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsSheetOpen(true)}>
                                <IconPlus className="size-4" /> New Leave Type
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md">
                            <SheetHeader className="pb-6 border-b">
                                <SheetTitle className="text-2xl">{editingType ? "Edit Leave Type" : "Create Leave Type"}</SheetTitle>
                                <SheetDescription>
                                    Define the rules and allocation for a specific leave category.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-6 py-8">
                                <div className="space-y-2">
                                    <Label htmlFor="type-name">Leave Name</Label>
                                    <Input 
                                        id="type-name" 
                                        placeholder="e.g. Sick Leave" 
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="h-11 border-indigo-100 focus-visible:ring-indigo-500/30"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type-code">Short Code</Label>
                                        <Input 
                                            id="type-code" 
                                            placeholder="e.g. SL" 
                                            value={formData.code}
                                            onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                            className="h-11 border-indigo-100 focus-visible:ring-indigo-500/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type-limit">Days per Year</Label>
                                        <Input 
                                            id="type-limit" 
                                            type="number"
                                            value={formData.yearlyLimit}
                                            onChange={(e) => setFormData(p => ({ ...p, yearlyLimit: parseInt(e.target.value) || 0 }))}
                                            className="h-11 border-indigo-100 focus-visible:ring-indigo-500/30"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                    <Checkbox 
                                        id="carry-forward" 
                                        checked={formData.isCarryForward} 
                                        onCheckedChange={(v) => setFormData(p => ({ ...p, isCarryForward: !!v }))}
                                        className="data-[state=checked]:bg-indigo-600 border-indigo-200"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="carry-forward"
                                            className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Enable Carry Forward
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Allow unused days to be added to next year's balance.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type-desc">Description</Label>
                                    <Input 
                                        id="type-desc" 
                                        placeholder="Brief description of when this apply..." 
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="h-11 border-indigo-100 focus-visible:ring-indigo-500/30"
                                    />
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <Button variant="outline" className="flex-1 h-11" onClick={handleCloseSheet}>Cancel</Button>
                                    <Button className="flex-[2] h-11 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSubmit}>
                                        {editingType ? "Update Type" : "Create Type"}
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Active Types" value={leaveTypes.length.toString()} icon={IconBook} color="bg-indigo-500" />
                <KPICard title="Total Allocation" value={leaveTypes.reduce((acc, t) => acc + t.yearlyLimit, 0).toString()} icon={IconCalendarCheck} color="bg-emerald-500" sub="Days / Year" />
                <KPICard title="Carry Forward" value={leaveTypes.filter(t => t.isCarryForward).length.toString()} icon={IconHistory} color="bg-amber-500" />
                <KPICard title="Standard Policy" value="v2.4" icon={IconCircleCheck} color="bg-blue-500" trend="Compliance OK" />
            </div>

            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden bg-white/70 backdrop-blur-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between border-b bg-indigo-500/[0.02]">
                    <div>
                        <CardTitle className="text-xl font-bold text-indigo-950">Leave Type Registry</CardTitle>
                        <p className="text-sm text-indigo-900/40">Official list of leave types mapped to HR policies</p>
                    </div>
                </CardHeader>
                <div className="px-2 pb-6">
                    <DataTable
                        columns={columns}
                        data={leaveTypes}
                        searchKey="name"
                        isLoading={isLoading}
                        showColumnCustomizer={false}
                    />
                </div>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, trend, sub }: any) {
    return (
        <Card className="group hover:scale-[1.02] transition-all duration-500 border-none shadow-lg shadow-black/5 overflow-hidden relative bg-white">
            <div className={`absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity ${color.replace('bg-', 'text-')}`}>
                <Icon className="size-20 -mr-6 -mt-6" />
            </div>
            <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-2xl ${color}/10 flex items-center justify-center ${color.replace('bg-', 'text-')} group-hover:${color} group-hover:text-white transition-all duration-500`}>
                        <Icon className="size-6" />
                    </div>
                    {trend && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{trend}</span>}
                </div>
                <div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">{value}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    {sub && <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
