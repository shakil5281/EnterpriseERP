"use client"

import * as React from "react"
import { IconClock, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { shiftService, Shift } from "@/lib/services/shift"
import { companyService, Company } from "@/lib/services/company"
import { useAuth } from "@/components/providers/auth-provider"
import { Switch } from "@/components/ui/switch"

export default function ShiftPage() {
    const [data, setData] = React.useState<Shift[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [currentShift, setCurrentShift] = React.useState<Partial<Shift>>({})
    const [isEditing, setIsEditing] = React.useState(false)
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [selectedCompany, setSelectedCompany] = React.useState<string>("all")
    const { user, hasRole, loading: authLoading } = useAuth()

    const fetchShifts = async () => {
        try {
            setLoading(true)
            let companyIdParam: string | undefined = undefined;

            if (selectedCompany !== "all") {
                companyIdParam = selectedCompany;
            } else {
                if (user && !hasRole("SuperAdmin") && !hasRole("Admin")) {
                    const assignedIds = user.assignedCompanyIds || [];
                    if (assignedIds.length > 0) {
                        companyIdParam = assignedIds[0].toString();
                    } else {
                        setData([]);
                        setLoading(false);
                        return;
                    }
                }
            }

            // Note: The new API might require companyId to be provided. If not, it fails.
            if (!companyIdParam && !hasRole("SuperAdmin")) {
                 setData([]);
                 return;
            }

            const shifts = await shiftService.getShifts({
                companyId: companyIdParam
            })
            // Ensure data is array
            setData(Array.isArray(shifts) ? shifts : [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch shifts")
        } finally {
            setLoading(false)
        }
    }

    const fetchCompanies = async () => {
        try {
            const comps = await companyService.getAll()
            if (hasRole("SuperAdmin") || hasRole("Admin")) {
                setCompanies(comps)
            } else {
                const assignedIds = user?.assignedCompanyIds || []
                const userCompanies = comps.filter(c => assignedIds.includes(c.id))
                setCompanies(userCompanies)

                if (userCompanies.length > 0) {
                    if (selectedCompany === "all" || !userCompanies.find(c => c.id.toString() === selectedCompany)) {
                        setSelectedCompany(userCompanies[0].id.toString())
                    }
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    React.useEffect(() => {
        if (!authLoading && user) {
            fetchCompanies()
        }
    }, [authLoading, user])

    React.useEffect(() => {
        if (!authLoading && user) {
            fetchShifts()
        }
    }, [selectedCompany, authLoading, user])

    // Helper to get company name from ID
    const getCompanyName = (companyId: string) => {
        return companies.find(c => c.entityId === companyId)?.companyNameEn || "Unknown";
    }

    // Format TimeSpan (HH:mm:ss) to HH:mm for HTML inputs
    const formatTimeForInput = (timeSpan?: string) => {
        if (!timeSpan) return "";
        return timeSpan.substring(0, 5); // "09:00:00" -> "09:00"
    }

    // --- Columns ---

    const columns: ColumnDef<Shift>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "shiftCode",
            header: "Shift Code",
            cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.getValue("shiftCode")}</span>
        },
        {
            accessorKey: "shiftName",
            header: "Shift Name",
            cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue("shiftName")}</span>
        },
        {
            accessorKey: "shiftType",
            header: "Type",
            cell: ({ row }) => <Badge variant="outline">{row.getValue("shiftType")}</Badge>
        },
        {
            accessorKey: "companyId",
            header: "Company",
            cell: ({ row }) => <span className="text-sm">{getCompanyName(row.getValue("companyId"))}</span>
        },
        {
            accessorKey: "startTime",
            header: "Start Time",
            cell: ({ row }) => <span className="font-mono">{formatTimeForInput(row.getValue("startTime"))}</span>
        },
        {
            accessorKey: "endTime",
            header: "End Time",
            cell: ({ row }) => <span className="font-mono">{formatTimeForInput(row.getValue("endTime"))}</span>
        },
        {
            accessorKey: "isCrossDay",
            header: "Cross Day",
            cell: ({ row }) => row.getValue("isCrossDay") ? <Badge variant="secondary">Yes</Badge> : <span className="text-muted-foreground">-</span>
        },
        {
            accessorKey: "isGeneralDuty",
            header: "General Duty",
            cell: ({ row }) => row.getValue("isGeneralDuty") ? <Badge variant="outline">Yes</Badge> : <span className="text-muted-foreground">-</span>
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive") as boolean
                return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
            }
        },
    ]

    // --- Actions ---

    const handleAddClick = () => {
        setIsEditing(false)
        setCurrentShift({
            shiftCode: "",
            shiftName: "",
            shiftType: "General",
            startTime: "09:00:00",
            endTime: "17:00:00",
            isCrossDay: false,
            isGeneralDuty: true,
            isDefault: false,
            companyId: selectedCompany !== "all" ? selectedCompany : "",
        })
        setIsSheetOpen(true)
    }

    const handleEditClick = (shift: Shift) => {
        setIsEditing(true)
        setCurrentShift({ ...shift })
        setIsSheetOpen(true)
    }

    const handleDelete = async (shift: Shift) => {
        try {
            await shiftService.deleteShift(shift.id)
            toast.success("Shift deactivated successfully")
            fetchShifts()
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "Failed to deactivate shift"
            toast.error(message)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentShift.companyId) {
            toast.error("Please select a company")
            return
        }

        try {
            const dto = {
                shiftCode: currentShift.shiftCode || "",
                shiftName: currentShift.shiftName || "",
                shiftType: currentShift.shiftType || "General",
                // Ensure times are at least HH:mm:ss format
                startTime: currentShift.startTime?.length === 5 ? `${currentShift.startTime}:00` : currentShift.startTime || "00:00:00",
                endTime: currentShift.endTime?.length === 5 ? `${currentShift.endTime}:00` : currentShift.endTime || "00:00:00",
                isCrossDay: !!currentShift.isCrossDay,
                isGeneralDuty: !!currentShift.isGeneralDuty,
                isDefault: !!currentShift.isDefault,
                companyId: currentShift.companyId || "",
            }

            if (isEditing && currentShift.id) {
                await shiftService.updateShift(currentShift.id, { id: currentShift.id, ...dto })
                toast.success("Shift updated successfully")
            } else {
                await shiftService.createShift(dto)
                toast.success("New shift created successfully")
            }
            setIsSheetOpen(false)
            fetchShifts()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save shift")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <IconClock className="size-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Shift Management</h1>
                    </div>
                    <p className="text-muted-foreground">Configure working hours and shift details.</p>
                </div>
                <Button className="gap-2" onClick={handleAddClick}>
                    <IconPlus className="size-4" />
                    Create Shift
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-64">
                    <Label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Filter by Company</Label>
                    <NativeSelect
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        disabled={(!hasRole("SuperAdmin") && !hasRole("Admin")) && companies.length <= 1}
                    >
                        {(hasRole("SuperAdmin") || hasRole("Admin")) && <option value="all">All Companies</option>}
                        {companies.map(c => (
                            <option key={c.id} value={c.entityId}>{c.companyNameEn}</option>
                        ))}
                    </NativeSelect>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                onEditClick={handleEditClick}
                onDelete={handleDelete}
                showColumnCustomizer={false}
                isLoading={loading}
                enableSelection={true}
                enableDrag={true}
            />

            {/* Create/Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{isEditing ? "Edit Shift" : "Create New Shift"}</SheetTitle>
                        <SheetDescription>
                            {isEditing ? "Update existing shift details." : "Define a new work shift schedule."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="companyId">Company</Label>
                                <NativeSelect
                                    id="companyId"
                                    value={currentShift.companyId || ""}
                                    onChange={e => setCurrentShift(prev => ({ ...prev, companyId: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.entityId}>{c.companyNameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="shiftCode">Shift Code</Label>
                                    <Input
                                        id="shiftCode"
                                        value={currentShift.shiftCode || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, shiftCode: e.target.value }))}
                                        placeholder="e.g. S1"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="shiftType">Shift Type</Label>
                                    <Input
                                        id="shiftType"
                                        value={currentShift.shiftType || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, shiftType: e.target.value }))}
                                        placeholder="e.g. General, Roster"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="shiftName">Shift Name</Label>
                                <Input
                                    id="shiftName"
                                    value={currentShift.shiftName || ""}
                                    onChange={e => setCurrentShift(prev => ({ ...prev, shiftName: e.target.value }))}
                                    placeholder="e.g. Morning Shift"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formatTimeForInput(currentShift.startTime)}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, startTime: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={formatTimeForInput(currentShift.endTime)}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, endTime: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-semibold cursor-pointer" htmlFor="isCrossDay">Cross Day Shift</Label>
                                        <p className="text-xs text-muted-foreground">Enable if the shift ends on the next day.</p>
                                    </div>
                                    <Switch
                                        id="isCrossDay"
                                        checked={currentShift.isCrossDay || false}
                                        onCheckedChange={(checked) => setCurrentShift(prev => ({ ...prev, isCrossDay: checked }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-semibold cursor-pointer" htmlFor="isGeneralDuty">General Duty</Label>
                                        <p className="text-xs text-muted-foreground">Is this a regular general duty shift?</p>
                                    </div>
                                    <Switch
                                        id="isGeneralDuty"
                                        checked={currentShift.isGeneralDuty || false}
                                        onCheckedChange={(checked) => setCurrentShift(prev => ({ ...prev, isGeneralDuty: checked }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-semibold cursor-pointer" htmlFor="isDefault">Default Shift</Label>
                                        <p className="text-xs text-muted-foreground">Set as the default shift for the company.</p>
                                    </div>
                                    <Switch
                                        id="isDefault"
                                        checked={currentShift.isDefault || false}
                                        onCheckedChange={(checked) => setCurrentShift(prev => ({ ...prev, isDefault: checked }))}
                                    />
                                </div>
                            </div>

                            {/* Note to user that rules/breaks are configured elsewhere */}
                            {isEditing && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                                    <strong>Note:</strong> Advanced configurations such as Grace Periods, Overtime Rules, Weekends, and Break Times are managed in the <em>Shift Rules & Breaks</em> section.
                                </div>
                            )}
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">{isEditing ? "Update Shift" : "Create Shift"}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
