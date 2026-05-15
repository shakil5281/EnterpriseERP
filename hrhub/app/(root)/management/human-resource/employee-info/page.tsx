"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    IconUserCircle,
    IconFilter,
    IconPlus,
    IconCircleCheckFilled,
    IconLoader,
    IconClock,
    IconFileSpreadsheet,
    IconDownload
} from "@tabler/icons-react"
import { type ColumnDef } from "@tanstack/react-table"
import { employeeService, type Employee } from "@/lib/services/employee"
import { organogramService, type Department, type Section, type Designation, type Line, type Group, type Shift, type Floor } from "@/lib/services/organogram"
import { companyService, type Company } from "@/lib/services/company"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import { getImageUrl } from "@/lib/utils"

export default function EmployeeInfoPage() {
    const router = useRouter()

    const employeeColumns: ColumnDef<Employee>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => (
                <button
                    onClick={() => router.push(`/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`)}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                >
                    {row.original.employeeId}
                </button>
            ),
        },
        {
            accessorKey: "fullNameEn",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-primary/10">
                        {row.original.profileImageUrl ? (
                            <img src={getImageUrl(row.original.profileImageUrl)} alt="" className="size-full object-cover" />
                        ) : (
                            <IconUserCircle className="size-full text-muted-foreground/40" />
                        )}
                    </div>
                    <button
                        onClick={() => router.push(`/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`)}
                        className="font-medium text-primary hover:underline"
                    >
                        {row.original.fullNameEn}
                    </button>
                </div>
            ),
        },
        {
            accessorKey: "designationName",
            header: "Designation",
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal">
                    {row.original.departmentName || 'N/A'}
                </Badge>
            ),
        },
        {
            accessorKey: "companyName",
            header: "Company",
            cell: ({ row }) => <span className="text-xs">{row.original.companyName || '-'}</span>,
        },
        {
            accessorKey: "bloodGroup",
            header: "Blood Group",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 border-primary/20 bg-primary/5 text-primary">
                    {row.original.bloodGroup || '-'}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                        {status === "Active" ? (
                            <IconCircleCheckFilled className="size-3.5 text-green-500" />
                        ) : status === "On Leave" ? (
                            <IconClock className="size-3.5 text-amber-500" />
                        ) : (
                            <IconLoader className="size-3.5 text-muted-foreground animate-spin-slow" />
                        )}
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "joinDate",
            header: "Join Date",
            cell: ({ row }) => new Date(row.original.joinDate).toLocaleDateString(),
        },
        {
            accessorKey: "isOtEnabled",
            header: "OT Status",
            cell: ({ row }) => (
                <Badge variant={row.original.isOtEnabled ? "default" : "secondary"} className="font-normal">
                    {row.original.isOtEnabled ? "Enabled" : "Disabled"}
                </Badge>
            ),
        },
    ]

    // Filter States
    const [empIdSearch, setEmpIdSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("Active")
    const [deptFilter, setDeptFilter] = React.useState<number | "All">("All")
    const [sectionFilter, setSectionFilter] = React.useState<number | "All">("All")
    const [designationFilter, setDesignationFilter] = React.useState<number | "All">("All")
    const [lineFilter, setLineFilter] = React.useState<number | "All">("All")
    const [groupFilter, setGroupFilter] = React.useState<number | "All">("All")
    const [shiftFilter, setShiftFilter] = React.useState<number | "All">("All")
    const [floorFilter, setFloorFilter] = React.useState<number | "All">("All")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<number | "All">("All")
    const [companyFilter, setCompanyFilter] = React.useState<string>("All")
    const [genderFilter, setGenderFilter] = React.useState<string>("All")
    const [religionFilter, setReligionFilter] = React.useState<string>("All")
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    // Data States
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // Option Lists
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])
    const [designations, setDesignations] = React.useState<Designation[]>([])
    const [lines, setLines] = React.useState<Line[]>([])
    const [groups, setGroupList] = React.useState<Group[]>([])
    const [shifts, setShiftList] = React.useState<Shift[]>([])
    const [floors, setFloors] = React.useState<Floor[]>([])
    const [companies, setCompanies] = React.useState<Company[]>([])

    // Load initial reference data
    React.useEffect(() => {
        const loadRefs = async () => {
            try {
                const [grps, shfts, flrs, comps] = await Promise.all([
                    organogramService.getGroups(),
                    organogramService.getShifts(),
                    organogramService.getFloors(),
                    companyService.getAll()
                ])
                setGroupList(grps)
                setShiftList(shfts)
                setFloors(flrs)
                setCompanies(comps)
            } catch (error) {
                console.error("Failed to load reference data", error)
            }
        }
        loadRefs()
    }, [])

    // Fetch departments when company changes
    React.useEffect(() => {
        if (selectedCompanyId !== "All") {
            organogramService.getDepartments({ companyId: selectedCompanyId as number })
                .then(setDepartments)
                .catch(console.error)
        } else {
            setDepartments([])
            setDeptFilter("All")
        }
    }, [selectedCompanyId])

    // Cascading dropdowns
    React.useEffect(() => {
        if (deptFilter !== "All") {
            organogramService.getSections({ departmentId: deptFilter }).then(setSections)
        } else {
            setSections([])
            setSectionFilter("All")
        }
    }, [deptFilter])

    React.useEffect(() => {
        if (sectionFilter !== "All") {
            organogramService.getDesignations({ sectionId: sectionFilter }).then(setDesignations)
            organogramService.getLines({ sectionId: sectionFilter }).then(setLines)
        } else {
            setDesignations([])
            setDesignationFilter("All")
            setLines([])
            setLineFilter("All")
        }
    }, [sectionFilter])


    const fetchEmployees = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params: Record<string, any> = {}
            if (statusFilter !== "All") params.status = statusFilter
            if (deptFilter !== "All") params.departmentId = deptFilter
            if (sectionFilter !== "All") params.sectionId = sectionFilter
            if (designationFilter !== "All") params.designationId = designationFilter
            if (lineFilter !== "All") params.lineId = lineFilter
            if (groupFilter !== "All") params.groupId = groupFilter
            if (shiftFilter !== "All") params.shiftId = shiftFilter
            if (floorFilter !== "All") params.floorId = floorFilter
            if (selectedCompanyId !== "All") params.companyId = selectedCompanyId
            if (genderFilter !== "All") params.gender = genderFilter
            if (religionFilter !== "All") params.religion = religionFilter
            if (dateRange.from) params.joinDateFrom = dateRange.from.toISOString()
            if (dateRange.to) params.joinDateTo = dateRange.to.toISOString()
            if (empIdSearch.trim()) params.employeeId = empIdSearch.trim()

            const data = await employeeService.getEmployees(params)
            setEmployees(data)
        } catch (error) {
            toast.error("Failed to load employees")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter, deptFilter, sectionFilter, designationFilter, lineFilter, groupFilter, shiftFilter, floorFilter, selectedCompanyId, genderFilter, religionFilter, dateRange, empIdSearch])

    React.useEffect(() => {
        fetchEmployees()
    }, []) // Initial load only

    const handleDelete = async (employee: Employee) => {
        try {
            if (!employee.companyId) {
                toast.error("Company information missing for this employee");
                return;
            }
            await employeeService.deleteEmployee(employee.employeeId, employee.companyId)
            toast.success("Employee deleted successfully")
            fetchEmployees()
        } catch (error) {
            toast.error("Failed to delete employee")
            console.error(error)
        }
    }

    const resetFilters = () => {
        setStatusFilter("Active")
        setDeptFilter("All")
        setSectionFilter("All")
        setDesignationFilter("All")
        setLineFilter("All")
        setGroupFilter("All")
        setShiftFilter("All")
        setFloorFilter("All")
        setCompanyFilter("All")
        setSelectedCompanyId("All")
        setGenderFilter("All")
        setReligionFilter("All")
        setDateRange({ from: undefined, to: undefined })
        setEmpIdSearch("")
    }

    const handleExport = async () => {
        const params: Record<string, any> = {}
        if (statusFilter !== "All") params.status = statusFilter
        if (deptFilter !== "All") params.departmentId = deptFilter
        if (sectionFilter !== "All") params.sectionId = sectionFilter
        if (designationFilter !== "All") params.designationId = designationFilter
        if (lineFilter !== "All") params.lineId = lineFilter
        if (groupFilter !== "All") params.groupId = groupFilter
        if (shiftFilter !== "All") params.shiftId = shiftFilter
        if (floorFilter !== "All") params.floorId = floorFilter
        if (selectedCompanyId !== "All") params.companyId = selectedCompanyId
        if (genderFilter !== "All") params.gender = genderFilter
        if (religionFilter !== "All") params.religion = religionFilter
        if (dateRange.from) params.joinDateFrom = dateRange.from.toISOString()
        if (dateRange.to) params.joinDateTo = dateRange.to.toISOString()
        if (empIdSearch.trim()) params.employeeId = empIdSearch.trim()

        toast.promise(employeeService.exportEmployees(params), {
            loading: 'Generating Excel report...',
            success: 'Export downloaded successfully',
            error: 'Failed to export employees'
        })
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <IconUserCircle className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Employee Information</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="w-fit gap-2"
                        onClick={handleExport}
                    >
                        <IconDownload className="size-4" />
                        Export Excel
                    </Button>
                    <Button
                        variant="outline"
                        className="w-fit"
                        onClick={() => router.push("/management/human-resource/employee-info/import")}
                    >
                        <IconFileSpreadsheet className="mr-2 size-4" />
                        Import Data
                    </Button>
                    <Button className="w-fit" onClick={() => router.push("/management/human-resource/employee-info/create")}>
                        <IconPlus className="mr-2 size-4" />
                        New Employee
                    </Button>
                </div>
            </div>

            <div className="px-4 lg:px-6">
                <Card className="border-none shadow-sm bg-muted/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <IconFilter className="size-4 text-muted-foreground" />
                                    <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
                                </div>
                                <Badge variant="secondary" className="h-5 px-1.5 font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                                    {employees.length} Records Found
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 px-4 shadow-sm shadow-primary/20"
                                    onClick={fetchEmployees}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <IconLoader className="size-3.5 animate-spin" />
                                    ) : (
                                        <IconFilter className="size-3.5" />
                                    )}
                                    Apply Filters
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground h-8 text-xs hover:text-destructive hover:bg-destructive/10"
                                    onClick={resetFilters}
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Company */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="company-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Company</Label>
                                <NativeSelect
                                    id="company-filter"
                                    value={selectedCompanyId.toString()}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (val === "All") {
                                            setSelectedCompanyId("All")
                                            setCompanyFilter("All")
                                        } else {
                                            const id = parseInt(val)
                                            setSelectedCompanyId(id)
                                            const comp = companies.find(c => c.id === id)
                                            setCompanyFilter(comp ? comp.companyNameEn : "All")
                                        }

                                        // Reset children
                                        setDeptFilter("All")
                                        setSectionFilter("All")
                                        setDesignationFilter("All")
                                        setLineFilter("All")
                                    }}
                                    className="h-9"
                                >
                                    <option value="All">All Companies</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.companyNameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Department */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dept-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Department</Label>
                                <NativeSelect
                                    id="dept-filter"
                                    value={deptFilter.toString()}
                                    onChange={(e) => setDeptFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Section */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="sec-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Section</Label>
                                <NativeSelect
                                    id="sec-filter"
                                    value={sectionFilter.toString()}
                                    onChange={(e) => setSectionFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                    disabled={deptFilter === "All"}
                                >
                                    <option value="All">All Sections</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Line */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="line-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Line</Label>
                                <NativeSelect
                                    id="line-filter"
                                    value={lineFilter.toString()}
                                    onChange={(e) => setLineFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                    disabled={sectionFilter === "All"}
                                >
                                    <option value="All">All Lines</option>
                                    {lines.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="desig-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Designation</Label>
                                <NativeSelect
                                    id="desig-filter"
                                    value={designationFilter.toString()}
                                    onChange={(e) => setDesignationFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                    disabled={sectionFilter === "All"}
                                >
                                    <option value="All">All Designations</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Group */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="group-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Group</Label>
                                <NativeSelect
                                    id="group-filter"
                                    value={groupFilter.toString()}
                                    onChange={(e) => setGroupFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Groups</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Shift */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="shift-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Shift</Label>
                                <NativeSelect
                                    id="shift-filter"
                                    value={shiftFilter.toString()}
                                    onChange={(e) => setShiftFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Shifts</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.nameEn} ({s.inTime}-{s.outTime})</option>)}
                                </NativeSelect>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
                                <NativeSelect
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Probation">Probation</option>
                                </NativeSelect>
                            </div>

                            {/* Floor */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="floor-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Floor</Label>
                                <NativeSelect
                                    id="floor-filter"
                                    value={floorFilter.toString()}
                                    onChange={(e) => setFloorFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Floors</option>
                                    {floors.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="gender-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Gender</Label>
                                <NativeSelect
                                    id="gender-filter"
                                    value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                    className="h-9"
                                >
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
                                </NativeSelect>
                            </div>

                            {/* Religion */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="religion-filter" className="text-[10px] uppercase font-bold text-muted-foreground">Religion</Label>
                                <NativeSelect
                                    id="religion-filter"
                                    value={religionFilter}
                                    onChange={(e) => setReligionFilter(e.target.value)}
                                    className="h-9"
                                >
                                    <option value="All">All Religions</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Hinduism">Hinduism</option>
                                    <option value="Christianity">Christianity</option>
                                    <option value="Buddhism">Buddhism</option>
                                </NativeSelect>
                            </div>

                            {/* Joining Date Range */}
                            <div className="flex flex-col gap-1.5 lg:col-span-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Joining Date Range</Label>
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange as any}
                                />
                            </div>

                            {/* Search */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="id-search" className="text-[10px] uppercase font-bold text-muted-foreground">Search by Employee ID</Label>
                                <Input
                                    id="id-search"
                                    placeholder="Type Employee ID..."
                                    className="h-9 bg-background"
                                    value={empIdSearch}
                                    onChange={(e) => setEmpIdSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <IconLoader className="size-8 animate-spin text-primary" />
                </div>
            ) : (
                <DataTable
                    data={employees}
                    columns={employeeColumns}
                    showTabs={false}
                    showActions={true}
                    enableSelection={true}
                    searchKey="fullNameEn"
                    onEditClick={(emp) => router.push(`/management/human-resource/employee-info/edit/${emp.employeeId}?companyId=${emp.companyId}`)}
                    onDelete={handleDelete}
                    onDeleteSelected={async (employees) => {
                        try {
                            await Promise.all(employees.map(emp => {
                                if (emp.companyId) {
                                    return employeeService.deleteEmployee(emp.employeeId, emp.companyId)
                                }
                                return Promise.resolve();
                            }))
                            toast.success(`Successfully deleted ${employees.length} employees`)
                            fetchEmployees()
                        } catch (error) {
                            toast.error("Failed to delete some employees")
                        }
                    }}
                />
            )}
        </div>
    )
}
