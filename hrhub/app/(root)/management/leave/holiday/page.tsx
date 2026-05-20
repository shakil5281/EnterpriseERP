"use client"

import * as React from "react"
import { IconCalendarMonth, IconPlus, IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format, eachDayOfInterval } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { leaveService } from "@/lib/services/leave"
import { groupHolidaysByRange, type GroupedHoliday } from "@/lib/services/leave-helpers"
import { useCompanyContext } from "@/components/providers/company-context"
import { LeaveCompanyBar } from "@/components/leave/leave-company-bar"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"

export default function HolidayPage() {
    const { activeCompanyId } = useCompanyContext()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [isLoading, setIsLoading] = React.useState(false)
    const [holidays, setHolidays] = React.useState<GroupedHoliday[]>([])
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingHoliday, setEditingHoliday] = React.useState<GroupedHoliday | null>(null)
    const [range, setRange] = React.useState<DateRange | undefined>(undefined)
    const [formData, setFormData] = React.useState({
        name: "",
        type: "Public" as "Public" | "Company" | "Religious",
    })

    const loadHolidays = React.useCallback(async () => {
        if (!activeCompanyId) return
        setIsLoading(true)
        try {
            const rows = await leaveService.listHolidays({ companyId: activeCompanyId, year })
            setHolidays(groupHolidaysByRange(rows))
        } catch {
            toast.error("Failed to load holidays")
        } finally {
            setIsLoading(false)
        }
    }, [activeCompanyId, year])

    React.useEffect(() => {
        loadHolidays()
    }, [loadHolidays])

    const createHolidayRange = async (start: Date, end: Date) => {
        if (!activeCompanyId) return
        const days = eachDayOfInterval({ start, end })
        await Promise.all(
            days.map((d) =>
                leaveService.createHoliday({
                    companyId: activeCompanyId,
                    holidayDate: format(d, "yyyy-MM-dd"),
                    holidayName: formData.name,
                    holidayType: formData.type,
                    isPaid: true,
                    isActive: true,
                })
            )
        )
    }

    const handleSubmit = async () => {
        if (!formData.name || !range?.from || !activeCompanyId) {
            toast.error("Please fill in all required fields")
            return
        }
        const end = range.to ?? range.from

        try {
            if (editingHoliday) {
                await Promise.all(editingHoliday.entityIds.map((id) => leaveService.deleteHoliday(id)))
                await createHolidayRange(range.from, end)
                toast.success("Holiday updated")
            } else {
                await createHolidayRange(range.from, end)
                toast.success("Holiday added")
            }
            loadHolidays()
            handleCloseSheet()
        } catch {
            toast.error("Failed to save holiday")
        }
    }

    const handleEdit = (holiday: GroupedHoliday) => {
        setEditingHoliday(holiday)
        setFormData({ name: holiday.name, type: holiday.type as "Public" | "Company" | "Religious" })
        setRange({
            from: new Date(holiday.startDate + "T00:00:00"),
            to: new Date(holiday.endDate + "T00:00:00"),
        })
        setIsSheetOpen(true)
    }

    const handleDelete = async (group: GroupedHoliday) => {
        try {
            await Promise.all(group.entityIds.map((id) => leaveService.deleteHoliday(id)))
            toast.success("Holiday removed")
            loadHolidays()
        } catch {
            toast.error("Failed to delete holiday")
        }
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setEditingHoliday(null)
        setFormData({ name: "", type: "Public" })
        setRange(undefined)
    }

    const columns: ColumnDef<GroupedHoliday>[] = [
        {
            id: "date",
            header: "Date Range",
            cell: ({ row }) => {
                const start = new Date(row.original.startDate + "T00:00:00")
                const end = new Date(row.original.endDate + "T00:00:00")
                const same = row.original.startDate === row.original.endDate
                return (
                    <span className="font-medium">
                        {format(start, "dd MMM")}
                        {!same && ` - ${format(end, "dd MMM")}`} {format(end, "yyyy")}
                    </span>
                )
            },
        },
        { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
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
                        <LeavePermissionGate permission="HOLIDAY_MANAGE">
                            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                                <IconEdit className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.original)}>
                                <IconTrash className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                        </LeavePermissionGate>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <IconCalendarMonth className="size-7" /> Holiday Calendar
                    </h1>
                    <p className="text-muted-foreground text-sm">Company holidays for {year}</p>
                </div>
                <LeavePermissionGate permission="HOLIDAY_MANAGE">
                    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
                        <SheetTrigger asChild>
                            <Button className="gap-2" onClick={() => setIsSheetOpen(true)}>
                                <IconPlus className="size-4" /> Add Holiday
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{editingHoliday ? "Edit Holiday" : "New Holiday"}</SheetTitle>
                                <SheetDescription>Add dates to the company calendar.</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 py-6">
                                <div className="space-y-2">
                                    <Label>Date range</Label>
                                    <DateRangePicker date={range} setDate={setRange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        className="w-full h-10 rounded-md border px-3 text-sm"
                                        value={formData.type}
                                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as typeof formData.type }))}
                                    >
                                        <option value="Public">Public</option>
                                        <option value="Company">Company</option>
                                        <option value="Religious">Religious</option>
                                    </select>
                                </div>
                                <Button className="w-full" onClick={handleSubmit}>Save</Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </LeavePermissionGate>
            </div>
            <LeaveCompanyBar year={year} onYearChange={setYear} onRefresh={loadHolidays} isLoading={isLoading} />
            <Card>
                <CardHeader>
                    <CardTitle>Holidays ({year})</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={holidays} searchKey="name" isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>
        </div>
    )
}
