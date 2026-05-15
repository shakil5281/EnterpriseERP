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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { shiftService, Shift } from "@/lib/services/shift"
import { companyService, Company } from "@/lib/services/company"
import { useAuth } from "@/components/providers/auth-provider"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { IconCalendar } from "@tabler/icons-react"

// --- Constants ---

const DAYS_OF_WEEK = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ShiftPage() {
    const [data, setData] = React.useState<Shift[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [currentShift, setCurrentShift] = React.useState<Partial<Shift>>({})
    const [isEditing, setIsEditing] = React.useState(false)
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [selectedCompany, setSelectedCompany] = React.useState<string>("all")
    const { user, hasRole, loading: authLoading } = useAuth()
    // Keep selectedCompany as string "all" or "123" (stringified number) for Select compatibility

    const fetchShifts = async () => {
        try {
            setLoading(true)
            let companyIdParam: number | undefined = undefined;

            if (selectedCompany !== "all") {
                companyIdParam = Number(selectedCompany);
            } else {
                if (user && !hasRole("SuperAdmin") && !hasRole("Admin")) {
                    const assignedIds = user.assignedCompanyIds || [];
                    if (assignedIds.length > 0) {
                        companyIdParam = assignedIds[0];
                    } else {
                        setData([]);
                        setLoading(false);
                        return;
                    }
                }
            }

            const shifts = await shiftService.getShifts({
                companyId: companyIdParam
            })
            setData(shifts)
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

                // If currently selected is "all" or not in user's list, default to first assigned
                if (userCompanies.length > 0) {
                    // Only override if currently "all" or invalid
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
    // Actually, fetchCompanies should run on mount/auth load. 
    // fetchShifts depends on selectedCompany.

    React.useEffect(() => {
        // Once companies are loaded and selectedCompany is set, fetch shifts
        // Guard against initial state where selectedCompany is "all" but user is restricted
        if (!authLoading && user) {
            // If restricted and selectedCompany is still "all", wait for fetchCompanies to update it?
            // fetchCompanies is async. 
            // Let's rely on fetchCompanies updating selectedCompany, which triggers this effect.
            fetchShifts()
        }
    }, [selectedCompany, authLoading, user])

    // Calculate generic hours difference
    const calculateHours = (start?: string, end?: string, lunchDuration: number = 0) => {
        if (!start || !end) return "0.0"

        try {
            const [startH, startM] = start.split(":").map(Number)
            const [endH, endM] = end.split(":").map(Number)

            let diff = (endH * 60 + endM) - (startH * 60 + startM)
            if (diff < 0) diff += 24 * 60 // Handle overnight shifts

            const hours = diff / 60
            return Math.max(0, hours - lunchDuration).toFixed(1)
        } catch (e) {
            return "0.0"
        }
    }

    // --- Columns ---

    const columns: ColumnDef<Shift>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "nameEn",
            header: "Shift Name (EN)",
            cell: ({ row }) => <span className="font-medium">{row.getValue("nameEn")}</span>
        },
        {
            accessorKey: "nameBn",
            header: "Shift Name (BN)",
            cell: ({ row }) => <span className="font-sutonny text-lg">{row.getValue("nameBn")}</span>
        },
        {
            accessorKey: "companyName",
            header: "Company",
            cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue("companyName") || "N/A"}</span>
        },
        {
            accessorKey: "inTime",
            header: "In Time"
        },
        {
            accessorKey: "outTime",
            header: "Out Time"
        },
        {
            accessorKey: "actualInTime",
            header: "Act. In"
        },
        {
            accessorKey: "actualOutTime",
            header: "Act. Out"
        },
        {
            accessorKey: "lunchHour",
            header: "Lunch Hr",
            cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("lunchHour")}</span>
        },
        {
            header: "Reg Hours",
            cell: ({ row }) => {
                const s = row.original
                const hours = calculateHours(s.inTime, s.outTime, Number(s.lunchHour))
                return <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-sm">{hours}</span>
            }
        },
        {
            accessorKey: "weekends",
            header: "Weekends",
            cell: ({ row }) => {
                const weekends = (row.getValue("weekends") as string || "").split(",").filter(Boolean)
                if (weekends.length === 0) return <span className="text-muted-foreground text-xs italic">None</span>
                return <span className="text-muted-foreground text-xs">{weekends.slice(0, 2).join(", ")}{weekends.length > 2 && "..."}</span>
            }
        },
        {
            accessorKey: "hasSpecialBreak",
            header: "Spl. Break",
            cell: ({ row }) => {
                const hasBreak = row.getValue("hasSpecialBreak") as boolean
                return hasBreak ? (
                    <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-200 bg-orange-50">Active</Badge>
                ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>
            }
        },
    ]

    // --- Actions ---

    const handleAddClick = () => {
        setIsEditing(false)
        setCurrentShift({
            nameEn: "",
            inTime: "09:00",
            outTime: "17:00",
            actualInTime: "09:00",
            actualOutTime: "17:00",
            lateInTime: "09:15",
            lunchTimeStart: "13:00",
            lunchHour: 1.0,
            weekends: "Friday",
            companyId: selectedCompany !== "all" ? Number(selectedCompany) : undefined,
            companyName: selectedCompany !== "all" ? companies.find(c => c.id === Number(selectedCompany))?.companyNameEn : "",
            status: "Active",
            hasSpecialBreak: false,
            specialBreakStart: "17:00",
            specialBreakEnd: "18:00",
            specialBreakDates: ""
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
            toast.success("Shift deleted successfully")
            fetchShifts()
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "Failed to delete shift"
            toast.error(message)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const dto = {
                nameEn: currentShift.nameEn || "",
                nameBn: currentShift.nameBn,
                inTime: currentShift.inTime || "",
                outTime: currentShift.outTime || "",
                actualInTime: currentShift.actualInTime,
                actualOutTime: currentShift.actualOutTime,
                lateInTime: currentShift.lateInTime,
                lunchTimeStart: currentShift.lunchTimeStart,
                lunchHour: Number(currentShift.lunchHour) || 0,
                weekends: currentShift.weekends,
                companyId: currentShift.companyId,
                companyName: currentShift.companyName,
                status: currentShift.status || "Active",
                hasSpecialBreak: !!currentShift.hasSpecialBreak,
                specialBreakStart: currentShift.hasSpecialBreak ? currentShift.specialBreakStart : undefined,
                specialBreakEnd: currentShift.hasSpecialBreak ? currentShift.specialBreakEnd : undefined,
                specialBreakDates: currentShift.hasSpecialBreak ? currentShift.specialBreakDates : undefined
            }

            if (isEditing && currentShift.id) {
                await shiftService.updateShift(currentShift.id, dto)
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

    const handleWeekendChange = (day: string) => {
        const currentWeekendsStr = currentShift.weekends || ""
        let currentWeekends = currentWeekendsStr.split(",").filter(Boolean)

        if (currentWeekends.includes(day)) {
            currentWeekends = currentWeekends.filter(d => d !== day)
        } else {
            currentWeekends.push(day)
        }

        setCurrentShift(prev => ({ ...prev, weekends: currentWeekends.join(",") }))
    }

    const selectedWeekends = (currentShift.weekends || "").split(",").filter(Boolean)
    const regHours = calculateHours(currentShift.inTime, currentShift.outTime, Number(currentShift.lunchHour))

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <IconClock className="size-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Shift Management</h1>
                    </div>
                    <p className="text-muted-foreground">Configure working hours, late policies, and breaks.</p>
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
                            <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>
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
                                <Label htmlFor="nameEn">Shift Name (English)</Label>
                                <Input
                                    id="nameEn"
                                    value={currentShift.nameEn || ""}
                                    onChange={e => setCurrentShift(prev => ({ ...prev, nameEn: e.target.value }))}
                                    placeholder="e.g. General Shift"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <NativeSelect
                                    id="companyName"
                                    value={currentShift.companyId || ""}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        const comp = companies.find(c => c.id === id);
                                        setCurrentShift(prev => ({
                                            ...prev,
                                            companyId: id,
                                            companyName: comp?.companyNameEn
                                        }))
                                    }}
                                    required
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.companyNameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nameBn">Shift Name (Bangla)</Label>
                                <Input
                                    id="nameBn"
                                    value={currentShift.nameBn || ""}
                                    onChange={e => setCurrentShift(prev => ({ ...prev, nameBn: e.target.value }))}
                                    placeholder="e.g. সাধারণ শিফট"
                                    className="font-sutonny text-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="inTime">Office In Time</Label>
                                    <Input
                                        id="inTime"
                                        type="time"
                                        value={currentShift.inTime || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, inTime: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="outTime">Office Out Time</Label>
                                    <Input
                                        id="outTime"
                                        type="time"
                                        value={currentShift.outTime || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, outTime: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="actualInTime">Actual In Time</Label>
                                    <Input
                                        id="actualInTime"
                                        type="time"
                                        value={currentShift.actualInTime || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, actualInTime: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="actualOutTime">Actual Out Time</Label>
                                    <Input
                                        id="actualOutTime"
                                        type="time"
                                        value={currentShift.actualOutTime || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, actualOutTime: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="lateInTime">Late In Time</Label>
                                    <Input
                                        id="lateInTime"
                                        type="time"
                                        value={currentShift.lateInTime || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, lateInTime: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lunchTimeStart">Lunch Start Time</Label>
                                    <Input
                                        id="lunchTimeStart"
                                        type="time"
                                        value={currentShift.lunchTimeStart || ""}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, lunchTimeStart: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="lunchHour">Lunch Duration (Hours)</Label>
                                    <Input
                                        id="lunchHour"
                                        type="number"
                                        step="0.5"
                                        value={currentShift.lunchHour || 0}
                                        onChange={e => setCurrentShift(prev => ({ ...prev, lunchHour: parseFloat(e.target.value) }))}
                                        placeholder="e.g. 1.0"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reg-hour">Regular Hours (Auto-Calc)</Label>
                                    <Input
                                        id="reg-hour"
                                        type="text"
                                        value={regHours}
                                        className="bg-muted font-mono"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Weekend Days</Label>
                                <div className="grid grid-cols-2 gap-2 border rounded-md p-4 bg-muted/20">
                                    {DAYS_OF_WEEK.map(day => (
                                        <div key={day} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`day-${day}`}
                                                checked={selectedWeekends.includes(day)}
                                                onCheckedChange={() => handleWeekendChange(day)}
                                            />
                                            <Label htmlFor={`day-${day}`} className="font-normal cursor-pointer text-sm">
                                                {day}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <NativeSelect
                                    id="status"
                                    value={currentShift.status}
                                    onChange={(e) => setCurrentShift(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </NativeSelect>
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <Label className="text-sm font-semibold">Special Break (e.g. Ramadan)</Label>
                                        <p className="text-xs text-muted-foreground">Enable additional break for specific dates.</p>
                                    </div>
                                    <Switch
                                        checked={currentShift.hasSpecialBreak || false}
                                        onCheckedChange={(checked) => setCurrentShift(prev => ({ ...prev, hasSpecialBreak: checked }))}
                                    />
                                </div>

                                {currentShift.hasSpecialBreak && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="specialBreakStart">Break Start</Label>
                                                <Input
                                                    id="specialBreakStart"
                                                    type="time"
                                                    value={currentShift.specialBreakStart || ""}
                                                    onChange={e => setCurrentShift(prev => ({ ...prev, specialBreakStart: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="specialBreakEnd">Break End</Label>
                                                <Input
                                                    id="specialBreakEnd"
                                                    type="time"
                                                    value={currentShift.specialBreakEnd || ""}
                                                    onChange={e => setCurrentShift(prev => ({ ...prev, specialBreakEnd: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">Applicable Dates</Label>
                                                {currentShift.specialBreakDates && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => setCurrentShift(prev => ({ ...prev, specialBreakDates: "" }))}
                                                        type="button"
                                                    >
                                                        Clear All
                                                    </Button>
                                                )}
                                            </div>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal h-10",
                                                            !currentShift.specialBreakDates && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <IconCalendar className="mr-2 h-4 w-4" />
                                                        {currentShift.specialBreakDates ? (
                                                            <span>{currentShift.specialBreakDates.split(',').length} days selected</span>
                                                        ) : (
                                                            <span>Select dates</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-0" align="start">
                                                    <Calendar
                                                        mode="multiple"
                                                        selected={currentShift.specialBreakDates ? currentShift.specialBreakDates.split(',').map(d => new Date(d)) : []}
                                                        onSelect={(dates) => {
                                                            // Sort dates to maintain order
                                                            const sortedDates = dates?.sort((a, b) => a.getTime() - b.getTime());
                                                            const dateStr = sortedDates?.map(d => format(d, 'yyyy-MM-dd')).join(',') || "";
                                                            setCurrentShift(prev => ({ ...prev, specialBreakDates: dateStr }));
                                                        }}
                                                        initialFocus
                                                        className="rounded-md border-none"
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            {currentShift.specialBreakDates && currentShift.specialBreakDates.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/30">
                                                    {currentShift.specialBreakDates.split(',').filter(Boolean).map((dateStr) => (
                                                        <Badge
                                                            key={dateStr}
                                                            variant="secondary"
                                                            className="text-[10px] font-mono px-1.5 py-0 flex items-center gap-1"
                                                        >
                                                            {format(new Date(dateStr), "MMM dd")}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const remaining = currentShift.specialBreakDates?.split(',')
                                                                        .filter(d => d !== dateStr && d !== "")
                                                                        .join(',');
                                                                    setCurrentShift(prev => ({ ...prev, specialBreakDates: remaining }));
                                                                }}
                                                                className="hover:text-red-500"
                                                            >
                                                                ×
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
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
