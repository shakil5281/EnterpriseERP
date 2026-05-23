"use client"

import * as React from "react"
import {
    IconUsersPlus,
    IconPlus,
    IconTrash,
    IconPencil,
    IconChartBar,
    IconAlertTriangle,
    IconCircleCheck,
    IconBuildingSkyscraper,
    IconLoader,
    IconFilter
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { requirementService, type ManpowerRequirement } from "@/lib/services/requirement"
import { organogramService } from "@/lib/services/organogram"
import { companyService, type Company } from "@/lib/services/company"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function ManpowerRequirementPage() {
    const [requirements, setRequirements] = React.useState<ManpowerRequirement[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [isEditing, setIsEditing] = React.useState(false)
    const [currentId, setCurrentId] = React.useState<number | null>(null)

    const [companies, setCompanies] = React.useState<Company[]>([])
    const [selectedCompanyEntityId, setSelectedCompanyEntityId] = React.useState("")
    const [filterDepartment, setFilterDepartment] = React.useState("")
    const [searchFilter, setSearchFilter] = React.useState("")

    // Form data
    const [departments, setDepartments] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [formData, setFormData] = React.useState({
        departmentId: "",
        designationId: "",
        requiredCount: 0,
        note: ""
    })

    const selectedCompanyRow = React.useMemo(
        () => companies.find((c) => c.entityId === selectedCompanyEntityId),
        [companies, selectedCompanyEntityId],
    )

    const fetchRequirements = React.useCallback(async () => {
        if (!selectedCompanyRow?.id) {
            setRequirements([])
            setIsLoading(false)
            return
        }
        setIsLoading(true)
        try {
            const data = await requirementService.getRequirements({
                companyId: selectedCompanyRow.id,
                departmentId: filterDepartment ? parseInt(filterDepartment, 10) : undefined,
            })
            setRequirements(data)
        } catch (error) {
            toast.error("Failed to load requirements")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyRow?.id, filterDepartment])

    React.useEffect(() => {
        companyService.getAll().then((list) => {
            setCompanies(list)
            setSelectedCompanyEntityId((c) => c || list[0]?.entityId || "")
        })
    }, [])

    React.useEffect(() => {
        if (!selectedCompanyRow?.id) return
        organogramService.getDepartments({ companyId: selectedCompanyRow.id }).then(setDepartments)
    }, [selectedCompanyRow?.id])

    React.useEffect(() => {
        if (!selectedCompanyRow?.id) return
        fetchRequirements()
    }, [selectedCompanyRow?.id, fetchRequirements])

    React.useEffect(() => {
        if (formData.departmentId) {
            organogramService.getDesignations({ departmentId: parseInt(formData.departmentId) }).then(setDesignations)
        } else {
            setDesignations([])
        }
    }, [formData.departmentId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.departmentId || !formData.designationId || formData.requiredCount <= 0) {
            toast.error("Please fill all required fields correctly")
            return
        }

        try {
            const data = {
                departmentId: parseInt(formData.departmentId),
                designationId: parseInt(formData.designationId),
                requiredCount: formData.requiredCount,
                note: formData.note
            }

            if (isEditing && currentId) {
                await requirementService.updateRequirement(currentId, data)
                toast.success("Requirement updated")
            } else {
                await requirementService.createRequirement(data)
                toast.success("Requirement created")
            }
            setIsSheetOpen(false)
            fetchRequirements()
        } catch (error) {
            toast.error("Process failed")
        }
    }

    const handleEdit = (r: ManpowerRequirement) => {
        setFormData({
            departmentId: r.departmentId.toString(),
            designationId: r.designationId.toString(),
            requiredCount: r.requiredCount,
            note: r.note || ""
        })
        setCurrentId(r.id)
        setIsEditing(true)
        setIsSheetOpen(true)
    }

    const handleDelete = async (r: ManpowerRequirement) => {
        if (confirm("Delete this requirement?")) {
            try {
                await requirementService.deleteRequirement(r.id)
                toast.success("Requirement deleted")
                fetchRequirements()
            } catch (error) {
                toast.error("Delete failed")
            }
        }
    }

    // Computed filtered requirements
    const filteredRequirements = React.useMemo(() => {
        let rows = requirements
        if (filterDepartment) {
            rows = rows.filter((r) => r.departmentId.toString() === filterDepartment)
        }
        if (searchFilter.trim()) {
            const q = searchFilter.trim().toLowerCase()
            rows = rows.filter(
                (r) =>
                    r.departmentName.toLowerCase().includes(q) ||
                    r.designationName.toLowerCase().includes(q),
            )
        }
        return rows
    }, [requirements, filterDepartment, searchFilter])

    const columns: ColumnDef<ManpowerRequirement>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => <span className="font-semibold">{row.original.departmentName}</span>
        },
        {
            accessorKey: "designationName",
            header: "Designation",
            cell: ({ row }) => <span className="text-sm font-medium text-muted-foreground">{row.original.designationName}</span>
        },
        {
            accessorKey: "requiredCount",
            header: "Required",
            cell: ({ row }) => <Badge variant="secondary" className="px-3">{row.original.requiredCount}</Badge>
        },
        {
            accessorKey: "currentCount",
            header: "Current",
            cell: ({ row }) => <span className="text-sm font-mono">{row.original.currentCount}</span>
        },
        {
            accessorKey: "gap",
            header: "Gap",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "font-bold",
                        row.original.gap > 0 ? "text-red-500" : "text-green-500"
                    )}>
                        {row.original.gap > 0 ? `+${row.original.gap}` : row.original.gap}
                    </span>
                    {row.original.gap > 0 ? <IconAlertTriangle className="size-4 text-red-500" /> : <IconCircleCheck className="size-4 text-green-500" />}
                </div>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(row.original)}>
                        <IconPencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(row.original)}>
                        <IconTrash className="size-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 bg-muted/20 min-h-screen px-4 lg:px-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <IconChartBar className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manpower Requirements</h1>
                        <p className="text-sm text-muted-foreground">Monitor workforce gaps and target hiring needs.</p>
                    </div>
                </div>
                <Button className="gap-2 shadow-md rounded-xl" onClick={() => {
                    setIsEditing(false)
                    setFormData({ departmentId: "", designationId: "", requiredCount: 0, note: "" })
                    setIsSheetOpen(true)
                }}>
                    <IconPlus className="size-4" />
                    Add Requirement
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Required</CardDescription>
                        <CardTitle className="text-2xl">{requirements.reduce((acc, r) => acc + r.requiredCount, 0)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Current Active</CardDescription>
                        <CardTitle className="text-2xl">{requirements.reduce((acc, r) => acc + r.currentCount, 0)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Workforce Gap</CardDescription>
                        <CardTitle className={cn(
                            "text-2xl",
                            requirements.reduce((acc, r) => acc + r.gap, 0) > 0 ? "text-red-500" : "text-green-500"
                        )}>
                            {requirements.reduce((acc, r) => acc + r.gap, 0)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconFilter className="size-4" /> Advanced filter
                    </CardTitle>
                    <CardDescription>Select company and filters, then apply.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1.5 min-w-[200px]">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Company</Label>
                        <NativeSelect
                            className="h-10 w-full"
                            value={selectedCompanyEntityId}
                            onChange={(e) => {
                                setSelectedCompanyEntityId(e.target.value)
                                setFilterDepartment("")
                            }}
                        >
                            <option value="">Select company</option>
                            {companies.map((c) => (
                                <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="space-y-1.5 min-w-[200px]">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Department</Label>
                        <NativeSelect
                            className="h-10 w-full"
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            disabled={!selectedCompanyEntityId}
                        >
                            <option value="">All departments</option>
                            {departments.map((d) => (
                                <option key={d.entityId} value={d.id}>{d.nameEn}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="space-y-1.5 min-w-[200px]">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Search</Label>
                        <Input
                            className="h-10"
                            placeholder="Department or designation"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" className="gap-2" onClick={() => fetchRequirements()} disabled={isLoading}>
                        {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconFilter className="size-4" />}
                        Apply filter
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-background">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <IconLoader className="size-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Analyzing workforce requirements...</p>
                        </div>
                    ) : (
                        <DataTable
                            data={filteredRequirements}
                            columns={columns}
                            showActions={false}
                            showTabs={false}
                            searchKey="departmentName"
                        />
                    )}
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-md">
                    <SheetHeader className="pb-6">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <IconUsersPlus className="size-6" />
                        </div>
                        <SheetTitle>{isEditing ? "Edit Requirement" : "Add Manpower Requirement"}</SheetTitle>
                        <SheetDescription>Set target headcount for specific department and role.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <select
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.departmentId}
                                onChange={e => setFormData(p => ({ ...p, departmentId: e.target.value, designationId: "" }))}
                            >
                                <option value="" disabled>Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id.toString()}>
                                        {d.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Designation</Label>
                            <select
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.designationId}
                                onChange={e => setFormData(p => ({ ...p, designationId: e.target.value }))}
                                disabled={!formData.departmentId}
                            >
                                <option value="" disabled>Select Designation</option>
                                {designations.map(d => (
                                    <option key={d.id} value={d.id.toString()}>
                                        {d.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Required Manpower (Count)</Label>
                            <Input
                                type="number"
                                className="h-11"
                                value={formData.requiredCount}
                                onChange={e => setFormData(p => ({ ...p, requiredCount: parseInt(e.target.value) || 0 }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Justification / Note</Label>
                            <Textarea
                                placeholder="Reason for requirement..."
                                value={formData.note}
                                onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                            />
                        </div>

                        <SheetFooter className="pt-6">
                            <Button type="submit" className="w-full h-11 rounded-xl shadow-lg">
                                {isEditing ? "Update Requirement" : "Create Requirement"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
