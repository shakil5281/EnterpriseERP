"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconCalendarStats,
    IconFilter,
    IconRotate,
    IconSearch,
    IconLoader,
    IconCheck,
    IconUsersGroup,
    IconPlus,
    IconCalendar,
    IconTrash
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NativeSelect } from "@/components/ui/native-select"
import { rosterService, type Roster } from "@/lib/services/roster"
import { employeeService, type EmployeeSimple } from "@/lib/services/employee"
import { organogramService } from "@/lib/services/organogram"
import { companyService } from "@/lib/services/company"
import { shiftService } from "@/lib/services/shift"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

export default function RosterManagementPage() {
    const router = useRouter()
    const [isLoadingData, setIsLoadingData] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Data for dropdowns
    const [companies, setCompanies] = React.useState<any[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])
    const [sections, setSections] = React.useState<any[]>([])
    const [lines, setLines] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [shifts, setShifts] = React.useState<any[]>([])
    const [groups, setGroups] = React.useState<any[]>([])
    const [floors, setFloors] = React.useState<any[]>([])

    // Filter states
    const [filters, setFilters] = React.useState({
        targetDate: new Date(),
        companyId: "all",
        departmentId: "all",
        sectionId: "all",
        lineId: "all",
        designationId: "all",
        shiftId: "all",
        groupId: "all",
        floorId: "all",
        gender: "all",
        religion: "all",
        status: "all",
        searchTerm: ""
    })

    // Selection and list state
    const [selectedEmployees, setSelectedEmployees] = React.useState<any[]>([])
    const [displayData, setDisplayData] = React.useState<any[]>([])

    // Roster Assignment state
    const [rosterData, setRosterData] = React.useState({
        shiftId: "",
        dateRange: {
            from: new Date(),
            to: new Date()
        } as DateRange | undefined,
        isOffDay: false
    })

    const loadInitialData = React.useCallback(async () => {
        try {
            const [comps, depts, sects, lns, desigs, shfts, grps, flrs] = await Promise.all([
                companyService.getAll(),
                organogramService.getDepartments(),
                organogramService.getSections(),
                organogramService.getLines(),
                organogramService.getDesignations(),
                shiftService.getShifts(),
                organogramService.getGroups(),
                organogramService.getFloors()
            ])
            setCompanies(comps)
            setDepartments(depts)
            setSections(sects)
            setLines(lns)
            setDesignations(desigs)
            setShifts(shfts)
            setGroups(grps)
            setFloors(flrs)
        } catch (error) {
            console.error(error)
        }
    }, [])

    React.useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    const handleApplyFilters = async () => {
        setIsLoadingData(true)
        try {
            const params: any = { isActive: true }
            if (filters.companyId !== "all") params.companyId = parseInt(filters.companyId)
            if (filters.departmentId !== "all") params.departmentId = parseInt(filters.departmentId)
            if (filters.sectionId !== "all") params.sectionId = parseInt(filters.sectionId)
            if (filters.lineId !== "all") params.lineId = parseInt(filters.lineId)
            if (filters.designationId !== "all") params.designationId = parseInt(filters.designationId)
            if (filters.shiftId !== "all") params.shiftId = parseInt(filters.shiftId)
            if (filters.groupId !== "all") params.groupId = parseInt(filters.groupId)
            if (filters.floorId !== "all") params.floorId = parseInt(filters.floorId)
            if (filters.gender !== "all") params.gender = filters.gender
            if (filters.religion !== "all") params.religion = filters.religion
            if (filters.status !== "all") params.status = filters.status
            if (filters.searchTerm.trim()) params.searchTerm = filters.searchTerm

            // Fetch employees and their rosters for target date
            const [emps, rosts] = await Promise.all([
                employeeService.getEmployeesSimple(params),
                rosterService.getRosters({
                    fromDate: format(filters.targetDate, "yyyy-MM-dd"),
                    toDate: format(filters.targetDate, "yyyy-MM-dd")
                })
            ])

            // Merge data
            const merged = emps.map(emp => {
                const roster = rosts.find(r => r.employeeCard === emp.id)
                return {
                    ...emp,
                    rosterId: roster?.id,
                    currentShift: roster ? (roster.isOffDay ? "OFF DAY" : roster.shiftName) : "Not Assigned",
                    isOffDay: roster?.isOffDay || false
                }
            })

            setDisplayData(merged)
            setSelectedEmployees([])
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch data")
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleSubmitRoster = async () => {
        if (selectedEmployees.length === 0 || (!rosterData.shiftId && !rosterData.isOffDay) || !rosterData.dateRange?.from) {
            toast.error("Please select employees, dates, and shift")
            return
        }

        setIsSubmitting(true)
        try {
            const startDate = format(rosterData.dateRange.from, "yyyy-MM-dd")
            const endDate = format(rosterData.dateRange.to || rosterData.dateRange.from, "yyyy-MM-dd")

            await rosterService.createBulkRoster({
                employeeCards: selectedEmployees.map(e => e.id),
                startDate,
                endDate,
                shiftId: parseInt(rosterData.shiftId || "0"),
                isOffDay: rosterData.isOffDay
            })

            toast.success(`${selectedEmployees.length} employees scheduled successfully`)
            setRosterData(p => ({ ...p, shiftId: "", isOffDay: false }))
            handleApplyFilters() // Refresh data
        } catch (error) {
            toast.error("Failed to process roster updates")
        } finally {
            setIsSubmitting(false)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-mono font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "fullNameEn",
            header: "Name"
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => <Badge variant="outline" className="font-normal">{row.original.departmentName}</Badge>
        },
        {
            accessorKey: "currentShift",
            header: "Target Date Shift",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full border",
                        row.original.currentShift === "OFF DAY" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            row.original.currentShift === "Not Assigned" ? "bg-muted text-muted-foreground border-muted" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                        {row.original.currentShift}
                    </span>
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 bg-muted/20 min-h-screen px-4 lg:px-8 w-full max-w-[1600px] mx-auto text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary shadow-lg flex items-center justify-center text-primary-foreground transform transition-transform hover:rotate-6">
                        <IconCalendarStats className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roster Management</h1>
                        <p className="text-sm text-muted-foreground font-medium">Manage and schedule employee shifts with precision.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 hidden sm:flex" onClick={() => router.push('/management/human-resource/roster/assign')}>
                    <IconPlus className="size-4" />
                    Legacy Mode
                </Button>
            </div>

            {/* Advanced Filters Section */}
            <Card className="border-none shadow-sm overflow-hidden bg-background">
                <div className="h-1.5 bg-emerald-500 w-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <IconFilter className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Attendance Filters</CardTitle>
                            <CardDescription className="text-xs">Filter by any information of employee.</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg" onClick={() => setFilters({
                        targetDate: new Date(), companyId: "all", departmentId: "all", sectionId: "all", lineId: "all",
                        designationId: "all", shiftId: "all", groupId: "all", floorId: "all",
                        gender: "all", religion: "all", status: "all", searchTerm: ""
                    })}>
                        <IconRotate className="size-4" />
                        Reset
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-6 gap-x-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Target Date</Label>
                            <DatePicker
                                date={filters.targetDate}
                                setDate={d => setFilters(p => ({ ...p, targetDate: d || new Date() }))}
                                className="w-full h-10 border-muted bg-muted/10 font-medium rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Company</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.companyId} onChange={e => setFilters(p => ({ ...p, companyId: e.target.value }))}>
                                <option value="all">Every Company</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.companyNameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Department</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.departmentId} onChange={e => setFilters(p => ({ ...p, departmentId: e.target.value }))}>
                                <option value="all">Every Department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Section</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.sectionId} onChange={e => setFilters(p => ({ ...p, sectionId: e.target.value }))}>
                                <option value="all">Every Section</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Line</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.lineId} onChange={e => setFilters(p => ({ ...p, lineId: e.target.value }))}>
                                <option value="all">Every Line</option>
                                {lines.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Designation</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.designationId} onChange={e => setFilters(p => ({ ...p, designationId: e.target.value }))}>
                                <option value="all">Every Designation</option>
                                {designations.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Current Shift</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.shiftId} onChange={e => setFilters(p => ({ ...p, shiftId: e.target.value }))}>
                                <option value="all">Every Shift</option>
                                {shifts.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Group</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.groupId} onChange={e => setFilters(p => ({ ...p, groupId: e.target.value }))}>
                                <option value="all">Every Group</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Floor</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.floorId} onChange={e => setFilters(p => ({ ...p, floorId: e.target.value }))}>
                                <option value="all">Every Floor</option>
                                {floors.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Gender</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.gender} onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))}>
                                <option value="all">All Genders</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Religion</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.religion} onChange={e => setFilters(p => ({ ...p, religion: e.target.value }))}>
                                <option value="all">All Religions</option>
                                <option value="Islam">Islam</option>
                                <option value="Hinduism">Hinduism</option>
                                <option value="Christianity">Christianity</option>
                                <option value="Buddhism">Buddhism</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Status</Label>
                            <NativeSelect className="h-10 bg-muted/10 border-muted rounded-xl" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
                                <option value="all">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 sm:col-span-2 md:col-span-3 lg:col-span-1 xl:col-span-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Quick Search</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Employee Name or ID..."
                                    className="pl-10 h-10 border-muted bg-muted/10 focus-visible:ring-emerald-500/30 font-medium rounded-xl"
                                    value={filters.searchTerm}
                                    onChange={e => setFilters(p => ({ ...p, searchTerm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-600/20 font-semibold rounded-xl transition-all" onClick={handleApplyFilters} disabled={isLoadingData}>
                                {isLoadingData ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Roster Assignment Section (Now Horizontal, between Filters and Table) */}
            <Card className={cn(
                "border-none shadow-xl rounded-2xl transition-all duration-500 overflow-hidden bg-background",
                selectedEmployees.length === 0 ? "opacity-50 grayscale pointer-events-none scale-[0.98] blur-[1px]" : "opacity-100 ring-4 ring-primary/10"
            )}>
                <div className="h-1.5 bg-primary w-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b bg-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <IconCalendar className="size-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Roster Definition</CardTitle>
                            <CardDescription className="text-xs font-semibold">Schedule for {selectedEmployees.length || "selected"} personnel.</CardDescription>
                        </div>
                    </div>
                    {selectedEmployees.length > 0 && (
                        <Badge className="px-4 py-1.5 bg-primary text-primary-foreground border-none rounded-full flex gap-2 font-bold shadow-md animate-in zoom-in">
                            <IconCheck className="size-4" />
                            {selectedEmployees.length} Personnel Target
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Schedule Range</Label>
                            <DateRangePicker
                                date={rosterData.dateRange}
                                setDate={range => setRosterData(p => ({ ...p, dateRange: range }))}
                                className="w-full h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Shift Template</Label>
                            <NativeSelect
                                className="h-10 bg-muted/10 border-muted rounded-xl"
                                value={rosterData.shiftId}
                                onChange={e => setRosterData(p => ({ ...p, shiftId: e.target.value, isOffDay: false }))}
                                disabled={rosterData.isOffDay}
                            >
                                <option value="">Choose Shift</option>
                                {shifts.map(s => (
                                    <option key={s.id} value={s.id.toString()}>
                                        {s.nameEn} ({s.inTime}-{s.outTime})
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className={cn(
                            "flex items-center gap-3 h-10 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer group",
                            rosterData.isOffDay ? "bg-amber-50 border-amber-300 shadow-sm" : "bg-muted/10 border-muted hover:bg-muted/20"
                        )} onClick={() => setRosterData(p => ({ ...p, isOffDay: !p.isOffDay, shiftId: !p.isOffDay ? "" : p.shiftId }))}>
                            <input
                                type="checkbox"
                                className="size-5 accent-amber-500 rounded cursor-pointer"
                                checked={rosterData.isOffDay}
                                readOnly
                            />
                            <Label className={cn(
                                "cursor-pointer text-sm font-bold transition-colors select-none",
                                rosterData.isOffDay ? "text-amber-700" : "text-muted-foreground group-hover:text-foreground"
                            )}>Mark as Weekly Off</Label>
                        </div>

                        <Button
                            className="w-full h-10 rounded-xl shadow-lg text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleSubmitRoster}
                            disabled={isSubmitting || selectedEmployees.length === 0 || !rosterData.dateRange?.from}
                        >
                            {isSubmitting ? <IconLoader className="size-5 animate-spin mr-2" /> : <IconPlus className="size-4 mr-2" />}
                            Update Schedule
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Employee List Table */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-background">
                <CardHeader className="border-b pb-6 px-6 bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <IconUsersGroup className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold italic tracking-tight uppercase">Employee List</CardTitle>
                                <CardDescription className="text-xs font-semibold">Listing employees based on filters.</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={displayData}
                        columns={columns}
                        enableSelection={true}
                        showActions={true}
                        showTabs={false}
                        onSelectionChange={setSelectedEmployees}
                        isLoading={isLoadingData}
                        onDelete={(r) => {
                            if (r.rosterId) {
                                rosterService.deleteRoster(r.rosterId).then(() => {
                                    toast.success("Schedule deleted")
                                    handleApplyFilters()
                                })
                            } else {
                                toast.error("No shift assigned to delete")
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
