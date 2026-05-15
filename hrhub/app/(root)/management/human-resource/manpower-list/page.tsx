"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconUsers,
    IconFilter,
    IconSearch,
    IconChevronDown,
    IconLoader,
    IconCircleCheckFilled,
    IconClock,
    IconUserCircle,
    IconFileSpreadsheet
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { employeeService, type Employee } from "@/lib/services/employee"
import { organogramService, type Floor } from "@/lib/services/organogram"
import { companyService, type Company } from "@/lib/services/company"
import { toast } from "sonner"
import { cn, getImageUrl } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

export default function ManpowerListPage() {
    const router = useRouter()

    // Data states
    const [manpower, setManpower] = React.useState<Employee[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isExporting, setIsExporting] = React.useState(false)

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState("")
    const [departmentId, setDepartmentId] = React.useState<string>("all")
    const [sectionId, setSectionId] = React.useState<string>("all")
    const [designationId, setDesignationId] = React.useState<string>("all")
    const [status, setStatus] = React.useState<string>("all")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [companyName, setCompanyName] = React.useState<string>("all")
    const [floorId, setFloorId] = React.useState<string>("all")
    const [gender, setGender] = React.useState<string>("all")
    const [religion, setReligion] = React.useState<string>("all")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

    // Dropdown options
    const [departments, setDepartments] = React.useState<any[]>([])
    const [sections, setSections] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [floors, setFloors] = React.useState<Floor[]>([])
    const [companies, setCompanies] = React.useState<Company[]>([])

    // Fetch initial data
    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [flrs, comps] = await Promise.all([
                    organogramService.getFloors(),
                    companyService.getAll()
                ])
                setFloors(flrs)
                setCompanies(comps)
            } catch (error) {
                console.error("Failed to load initial data", error)
            }
        }
        fetchInitialData()
    }, [])

    // Fetch departments when company changes
    React.useEffect(() => {
        if (selectedCompanyId !== "all") {
            organogramService.getDepartments({ companyId: parseInt(selectedCompanyId) })
                .then(setDepartments)
                .catch(console.error)
        } else {
            setDepartments([])
            setDepartmentId("all")
        }
    }, [selectedCompanyId])

    // Fetch sections when department changes
    React.useEffect(() => {
        if (departmentId !== "all") {
            organogramService.getSections({ departmentId: parseInt(departmentId) })
                .then(setSections)
                .catch(console.error)
        } else {
            setSections([])
            setSectionId("all")
        }
    }, [departmentId])

    // Fetch designations when section changes
    React.useEffect(() => {
        if (sectionId !== "all") {
            organogramService.getDesignations({ sectionId: parseInt(sectionId) })
                .then(setDesignations)
                .catch(console.error)
        } else {
            setDesignations([])
            setDesignationId("all")
        }
    }, [sectionId])

    const fetchManpower = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (departmentId !== "all") params.departmentId = parseInt(departmentId)
            if (sectionId !== "all") params.sectionId = parseInt(sectionId)
            if (designationId !== "all") params.designationId = parseInt(designationId)
            if (floorId !== "all") params.floorId = parseInt(floorId)
            if (selectedCompanyId !== "all") params.companyId = parseInt(selectedCompanyId)
            if (companyName !== "all") params.companyName = companyName
            if (gender !== "all") params.gender = gender
            if (religion !== "all") params.religion = religion
            if (dateRange?.from) params.joinDateFrom = dateRange.from.toISOString()
            if (dateRange?.to) params.joinDateTo = dateRange.to.toISOString()
            if (status !== "all") params.status = status
            if (searchTerm.trim()) params.searchTerm = searchTerm

            const data = await employeeService.getManpower(params)
            setManpower(data)
        } catch (error) {
            toast.error("Failed to load manpower data")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [departmentId, sectionId, designationId, floorId, companyName, gender, religion, dateRange, status, searchTerm])

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const params: any = {}
            if (departmentId !== "all") params.departmentId = parseInt(departmentId)
            if (sectionId !== "all") params.sectionId = parseInt(sectionId)
            if (designationId !== "all") params.designationId = parseInt(designationId)
            if (floorId !== "all") params.floorId = parseInt(floorId)
            if (selectedCompanyId !== "all") params.companyId = parseInt(selectedCompanyId)
            if (companyName !== "all") params.companyName = companyName
            if (gender !== "all") params.gender = gender
            if (religion !== "all") params.religion = religion
            if (dateRange?.from) params.joinDateFrom = dateRange.from.toISOString()
            if (dateRange?.to) params.joinDateTo = dateRange.to.toISOString()
            if (status !== "all") params.status = status
            if (searchTerm.trim()) params.searchTerm = searchTerm
            params.isActive = true // Manpower list is typically active employees

            await employeeService.exportEmployees(params)
            toast.success("Excel exported successfully")
        } catch (error) {
            toast.error("Failed to export Excel data")
            console.error(error)
        } finally {
            setIsExporting(false)
        }
    }

    React.useEffect(() => {
        fetchManpower()
    }, []) // Initial load only

    const handleDelete = async (employee: Employee) => {
        try {
            if (!employee.companyId) {
                toast.error("Company information missing for this employee");
                return;
            }
            await employeeService.deleteEmployee(employee.employeeId, employee.companyId)
            toast.success("Employee deleted successfully")
            fetchManpower()
        } catch (error) {
            toast.error("Failed to delete employee")
            console.error(error)
        }
    }

    const columns: ColumnDef<Employee>[] = [
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
                    className="font-mono text-xs font-semibold text-primary hover:underline text-left"
                >
                    {row.original.employeeId}
                </button>
            ),
        },
        {
            accessorKey: "fullNameEn",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                        {row.original.profileImageUrl ? (
                            <img src={getImageUrl(row.original.profileImageUrl)} alt="" className="size-full object-cover" />
                        ) : (
                            <IconUserCircle className="size-5" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <button
                            onClick={() => router.push(`/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`)}
                            className="font-medium text-sm text-primary hover:underline text-left"
                        >
                            {row.original.fullNameEn}
                        </button>
                        <span className="text-[10px] text-muted-foreground">{row.original.phoneNumber || row.original.email || 'No contact'}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "designationName",
            header: "Designation",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm">{row.original.designationName}</span>
                    <span className="text-[10px] text-muted-foreground">{row.original.sectionName}</span>
                </div>
            )
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal bg-muted/50">
                    {row.original.departmentName}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const st = row.original.status
                return (
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                        {st === "Active" ? (
                            <IconCircleCheckFilled className="size-3.5 text-green-500" />
                        ) : st === "On Leave" ? (
                            <IconClock className="size-3.5 text-amber-500" />
                        ) : (
                            <div className="size-2 rounded-full bg-muted-foreground/50" />
                        )}
                        {st}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "joinDate",
            header: "Join Date",
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.joinDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </span>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-muted/20 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <IconUsers className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manpower List</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-[#108545]" />
                            Total {manpower.length} Employees Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 text-primary transition-all"
                        onClick={handleExport}
                        disabled={isExporting || manpower.length === 0}
                    >
                        {isExporting ? (
                            <IconLoader className="size-4 mr-2 animate-spin" />
                        ) : (
                            <IconFileSpreadsheet className="size-4 mr-2" />
                        )}
                        Export Excel
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 px-4 shadow-lg hover:shadow-primary/20 transition-all font-medium"
                        onClick={() => router.push("/management/human-resource/employee-info/create")}
                    >
                        New Employee
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="px-4 lg:px-8">
                <Card className="border-none shadow-none bg-background/60 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-primary/20 w-full" />
                    <CardHeader className="pb-3 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <IconFilter className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-medium uppercase tracking-wider">Dynamic Filters</CardTitle>
                                </div>
                                <Badge variant="secondary" className="h-5 px-1.5 font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                                    {manpower.length} Records Found
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 px-4 shadow-sm shadow-primary/20"
                                    onClick={fetchManpower}
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
                                    className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        setSearchTerm("")
                                        setDepartmentId("all")
                                        setSectionId("all")
                                        setDesignationId("all")
                                        setFloorId("all")
                                        setCompanyName("all")
                                        setSelectedCompanyId("all")
                                        setGender("all")
                                        setReligion("all")
                                        setDateRange(undefined)
                                        setStatus("all")
                                    }}
                                >
                                    Reset All
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Search Employee</Label>
                                <div className="relative">
                                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Name, ID, Phone..."
                                        className="pl-9 h-10 bg-muted/30 border-none transition-all focus-visible:ring-1"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Department</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Section */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Section</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={sectionId}
                                    onChange={(e) => setSectionId(e.target.value)}
                                    disabled={departmentId === "all"}
                                >
                                    <option value="all">All Sections</option>
                                    {sections.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Designation</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={designationId}
                                    onChange={(e) => setDesignationId(e.target.value)}
                                    disabled={sectionId === "all"}
                                >
                                    <option value="all">All Designations</option>
                                    {designations.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Status</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Probation">Probation</option>
                                    <option value="Resigned">Resigned</option>
                                </NativeSelect>
                            </div>

                            {/* Company */}
                            <div className="flex flex-col gap-1.5 focus-within:z-20">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Company</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={selectedCompanyId}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        setSelectedCompanyId(val)
                                        if (val === "all") {
                                            setCompanyName("all")
                                        } else {
                                            const comp = companies.find(c => c.id === parseInt(val))
                                            setCompanyName(comp ? comp.companyNameEn : "all")
                                        }

                                        // Reset children
                                        setDepartmentId("all")
                                        setSectionId("all")
                                        setDesignationId("all")
                                    }}
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.companyNameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Floor */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Floor</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={floorId}
                                    onChange={(e) => setFloorId(e.target.value)}
                                >
                                    <option value="all">All Floors</option>
                                    {floors.map((f) => (
                                        <option key={f.id} value={f.id}>{f.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gender</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="all">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
                                </NativeSelect>
                            </div>

                            {/* Religion */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Religion</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={religion}
                                    onChange={(e) => setReligion(e.target.value)}
                                >
                                    <option value="all">All Religions</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Hinduism">Hinduism</option>
                                    <option value="Christianity">Christianity</option>
                                    <option value="Buddhism">Buddhism</option>
                                </NativeSelect>
                            </div>

                            {/* Date range picker */}
                            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Joining Date Range</Label>
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table Section */}
            <div className="px-4 lg:px-8 pb-8">
                <Card className="border-none shadow-none overflow-hidden rounded-2xl bg-background">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="relative">
                                    <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                    <IconUsers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground animate-pulse">Refining manpower list...</p>
                            </div>
                        ) : (
                            <DataTable
                                data={manpower}
                                columns={columns}
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
                                        fetchManpower()
                                    } catch (error) {
                                        toast.error("Failed to delete some employees")
                                    }
                                }}
                                showTabs={false}
                                showActions={true}
                                enableSelection={true}
                                searchKey="fullNameEn"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
