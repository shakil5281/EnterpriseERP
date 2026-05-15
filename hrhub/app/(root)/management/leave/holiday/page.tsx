"use client"

import * as React from "react"
import {
    IconCalendarMonth,
    IconPlus,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconCalendarStats,
    IconCalendarEvent,
    IconUsers,
    IconSearch,
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
import { format } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { holidayService, type Holiday } from "@/lib/services/holiday"

export default function HolidayPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [holidays, setHolidays] = React.useState<Holiday[]>([])
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingHoliday, setEditingHoliday] = React.useState<Holiday | null>(null)

    const [range, setRange] = React.useState<DateRange | undefined>(undefined)
    const [formData, setFormData] = React.useState<{
        name: string;
        type: "Public" | "Company" | "Religious";
        description: string;
    }>({
        name: "",
        type: "Public",
        description: ""
    })

    React.useEffect(() => {
        loadHolidays()
    }, [])

    const loadHolidays = async () => {
        setIsLoading(true)
        try {
            const data = await holidayService.getHolidays()
            setHolidays(data)
        } catch (error) {
            toast.error("Failed to load holidays")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.name || !range?.from) {
            toast.error("Please fill in all required fields")
            return
        }

        const holidayData = {
            ...formData,
            startDate: format(range.from, "yyyy-MM-dd"),
            endDate: format(range.to || range.from, "yyyy-MM-dd"),
            isActive: true
        }

        try {
            if (editingHoliday) {
                await holidayService.updateHoliday(editingHoliday.id, { ...editingHoliday, ...holidayData })
                toast.success("Holiday updated successfully")
            } else {
                await holidayService.createHoliday(holidayData)
                toast.success("Holiday added successfully")
            }
            loadHolidays()
            handleCloseSheet()
        } catch (error) {
            toast.error("Failed to save holiday")
        }
    }

    const handleEdit = (holiday: Holiday) => {
        setEditingHoliday(holiday)
        setFormData({
            name: holiday.name,
            type: holiday.type,
            description: holiday.description || ""
        })
        setRange({
            from: new Date(holiday.startDate.split('T')[0] + "T00:00:00"),
            to: new Date(holiday.endDate.split('T')[0] + "T00:00:00")
        })
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: number) => {
        try {
            await holidayService.deleteHoliday(id)
            toast.success("Holiday removed")
            loadHolidays()
        } catch (error) {
            toast.error("Failed to delete holiday")
        }
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setEditingHoliday(null)
        setFormData({ name: "", type: "Public", description: "" })
        setRange(undefined)
    }

    const columns: ColumnDef<Holiday>[] = [
        {
            accessorKey: "date",
            header: "Date Range",
            cell: ({ row }) => {
                // Parse date-only strings safely to avoid timezone shifts
                const startDateStr = row.original.startDate.split('T')[0]
                const endDateStr = row.original.endDate.split('T')[0]
                
                const start = new Date(startDateStr + "T00:00:00")
                const end = new Date(endDateStr + "T00:00:00")
                const isSameDay = startDateStr === endDateStr

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                            {format(start, "dd MMM")} {!isSameDay && `- ${format(end, "dd MMM")}`} {format(end, "yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-tight">
                            {isSameDay ? format(start, "EEEE") : `${format(start, "EEE")} - ${format(end, "EEE")}`}
                        </span>
                    </div>
                )
            }
        },
        {
            accessorKey: "name",
            header: "Holiday Name",
            cell: ({ row }) => {
                const start = new Date(row.original.startDate)
                const end = new Date(row.original.endDate)
                const diffTime = Math.abs(end.getTime() - start.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-primary">{row.original.name}</span>
                        {diffDays > 1 && <span className="text-[10px] font-medium text-muted-foreground bg-muted w-fit px-1.5 rounded-sm">{diffDays} Days</span>}
                    </div>
                )
            }
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.original.type
                const variant = type === "Public" ? "default" : type === "Religious" ? "secondary" : "outline"
                return <Badge variant={variant}>{type}</Badge>
            }
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => <span className="text-sm text-muted-foreground italic">{row.original.description || "-"}</span>
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

    const upcomingHolidays = holidays
        .filter(h => new Date(h.startDate) >= new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    
    const nextHoliday = upcomingHolidays[0]
    const nextHolidayDate = nextHoliday ? format(new Date(nextHoliday.startDate), "dd MMM") : "None"
    const nextHolidayName = nextHoliday ? nextHoliday.name : "No upcoming holidays"

    return (
        <div className="flex flex-col gap-8 py-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl shadow-inner shadow-primary/5">
                            <IconCalendarMonth className="size-8 text-primary" />
                        </div>
                        Holiday Calendar
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">Configure and view annual public and company holidays</p>
                </div>

                <div className="flex items-center gap-3">
                    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
                        <SheetTrigger asChild>
                            <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold" onClick={() => setIsSheetOpen(true)}>
                                <IconPlus className="size-4" /> Add Holiday
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md">
                            <SheetHeader className="pb-6 border-b">
                                <SheetTitle className="text-2xl">{editingHoliday ? "Edit Holiday" : "New Holiday Entry"}</SheetTitle>
                                <SheetDescription>
                                    Add a new holiday to the company calendar for all employees.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-6 py-8">
                                <div className="space-y-2">
                                    <Label htmlFor="holiday-date">Holiday duration</Label>
                                    <DateRangePicker 
                                        date={range}
                                        setDate={setRange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="holiday-name">Official Name</Label>
                                    <Input 
                                        id="holiday-name" 
                                        placeholder="e.g. Independence Day" 
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="h-11 focus-visible:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="holiday-type">Category</Label>
                                    <select 
                                        id="holiday-type"
                                        className="w-full h-11 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        value={formData.type}
                                        onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as "Public" | "Company" | "Religious" }))}
                                    >
                                        <option value="Public">Public Holiday</option>
                                        <option value="Company">Company Holiday</option>
                                        <option value="Religious">Religious Holiday</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="holiday-desc">Additional Details (Optional)</Label>
                                    <Input 
                                        id="holiday-desc" 
                                        placeholder="Add context about this holiday..." 
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="h-11 focus-visible:ring-primary/30"
                                    />
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <Button variant="outline" className="flex-1 h-11" onClick={handleCloseSheet}>Cancel</Button>
                                    <Button className="flex-[2] h-11 font-semibold" onClick={handleSubmit}>
                                        {editingHoliday ? "Apply Changes" : "Save Holiday"}
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Holidays" value={holidays.length.toString()} icon={IconCalendarStats} trend="+2 vs last year" />
                <KPICard title="Public" value={holidays.filter(h => h.type === "Public").length.toString()} icon={IconCalendarEvent} />
                <KPICard title="Religious" value={holidays.filter(h => h.type === "Religious").length.toString()} icon={IconUsers} />
                <KPICard title="Next Holiday" value={nextHolidayDate} icon={IconCalendarMonth} sub={nextHolidayName} />
            </div>

            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Holiday List (2026)</CardTitle>
                        <p className="text-sm text-muted-foreground">Detailed schedule of recognized holidays</p>
                    </div>
                </CardHeader>
                <div className="px-2 pb-6">
                    <DataTable
                        columns={columns}
                        data={holidays}
                        searchKey="name"
                        isLoading={isLoading}
                        showColumnCustomizer={false}
                    />
                </div>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, trend, sub }: any) {
    return (
        <Card className="group hover:border-primary/30 transition-all duration-300 border-none shadow-lg shadow-black/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Icon className="size-20 -mr-6 -mt-6 text-primary" />
            </div>
            <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <Icon className="size-6" />
                    </div>
                    {trend && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{trend}</span>}
                </div>
                <div>
                    <h3 className="text-2xl font-black tracking-tight">{value}</h3>
                    <p className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-widest">{title}</p>
                    {sub && <p className="text-xs text-primary font-medium mt-1">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
