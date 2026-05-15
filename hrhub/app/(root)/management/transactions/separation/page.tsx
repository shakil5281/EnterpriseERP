"use client"

import * as React from "react"
import {
    IconUserMinus,
    IconPlus,
    IconTrash,
    IconCheck,
    IconX,
    IconFilter,
    IconUser,
    IconCalendarOff,
    IconLoader
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { separationService, type Separation } from "@/lib/services/separation"
import { employeeService, type Employee } from "@/lib/services/employee"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function SeparationPage() {
    const [separations, setSeparations] = React.useState<Separation[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [confirmDialog, setConfirmDialog] = React.useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: "default" | "destructive";
    }>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => {},
        variant: "default"
    })

    const openConfirmDialog = (title: string, description: string, onConfirm: () => void, variant: "default" | "destructive" = "default") => {
        setConfirmDialog({
            isOpen: true,
            title,
            description,
            onConfirm,
            variant
        })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    }

    // Filters
    const [filterStatus, setFilterStatus] = React.useState("")
    const [filterType, setFilterType] = React.useState("")

    // Form Data
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [empSearchId, setEmpSearchId] = React.useState("")
    const [searchedEmployee, setSearchedEmployee] = React.useState<Employee | null>(null)
    const [formData, setFormData] = React.useState({
        employeeId: "",
        lastWorkingDate: format(new Date(), "yyyy-MM-dd"),
        type: "Resignation",
        reason: ""
    })

    const handleSearchEmployee = async () => {
        if (!empSearchId.trim()) return
        try {
            const data = await employeeService.getEmployees({ employeeId: empSearchId.trim() })
            if (data && data.length > 0) {
                setSearchedEmployee(data[0])
                setFormData(p => ({ ...p, employeeId: data[0].id.toString() }))
                toast.success("Employee found")
            } else {
                setSearchedEmployee(null)
                setFormData(p => ({ ...p, employeeId: "" }))
                toast.error("Employee not found")
            }
        } catch (error) {
            toast.error("Failed to search employee")
        }
    }

    const fetchSeparations = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await separationService.getSeparations()
            setSeparations(data)
        } catch (error) {
            toast.error("Failed to load separation requests")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchSeparations()
        employeeService.getEmployees({ status: 'Active' }).then(setEmployees)
    }, [fetchSeparations])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.employeeId || !formData.lastWorkingDate || !formData.reason) {
            toast.error("Please fill all required fields")
            return
        }

        try {
            await separationService.createSeparation({
                employeeId: parseInt(formData.employeeId),
                lastWorkingDate: formData.lastWorkingDate,
                type: formData.type,
                reason: formData.reason
            })
            toast.success("Separation request submitted")
            setIsSheetOpen(false)
            fetchSeparations()
            setFormData({
                employeeId: "",
                lastWorkingDate: format(new Date(), "yyyy-MM-dd"),
                type: "Resignation",
                reason: ""
            })
            setEmpSearchId("")
            setSearchedEmployee(null)
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to create request")
        }
    }

    const executeStatusUpdate = async (id: number, status: string) => {
        try {
            await separationService.updateStatus(id, status)
            toast.success(`Request ${status}`)
            fetchSeparations()
        } catch (error) {
            toast.error("Update failed")
        }
    }

    const handleStatusUpdate = (id: number, status: string) => {
        openConfirmDialog(
            `${status} Request`,
            `Are you sure you want to ${status.toLowerCase()} this request? This may affect employee access.`,
            () => executeStatusUpdate(id, status),
            status === 'Rejected' ? "destructive" : "default"
        )
    }

    const executeDelete = async (id: number) => {
        try {
            await separationService.deleteSeparation(id)
            toast.success("Deleted successfully")
            fetchSeparations()
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    const handleDelete = (id: number) => {
        openConfirmDialog(
            "Delete Request",
            "Are you sure you want to delete this separation request? This action cannot be undone.",
            () => executeDelete(id),
            "destructive"
        )
    }

    // Filter Logic
    const filteredSeparations = React.useMemo(() => {
        return separations.filter(item => {
            const matchesStatus = filterStatus ? item.status === filterStatus : true
            const matchesType = filterType ? item.type === filterType : true
            return matchesStatus && matchesType
        })
    }, [separations, filterStatus, filterType])

    const columns: ColumnDef<Separation>[] = [
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold">{row.original.employeeName}</div>
                    <div className="text-xs text-muted-foreground">{row.original.employeeCode}</div>
                </div>
            )
        },
        {
            header: "Department",
            cell: ({ row }) => (
                <div className="text-sm">
                    <div className="font-medium text-muted-foreground">{row.original.departmentName}</div>
                    <div className="text-xs text-muted-foreground/70">{row.original.designationName}</div>
                </div>
            )
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>
        },
        {
            accessorKey: "lastWorkingDate",
            header: "Last Working Date",
            cell: ({ row }) => <span>{format(new Date(row.original.lastWorkingDate), "dd MMM yyyy")}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant={status === "Approved" ? "default" : status === "Rejected" ? "destructive" : "secondary"}>
                        {status}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    {row.original.status === "Pending" && (
                        <>
                            <Button variant="ghost" size="icon" className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(row.original.id, "Approved")}>
                                <IconCheck className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusUpdate(row.original.id, "Rejected")}>
                                <IconX className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => handleDelete(row.original.id)}>
                                <IconTrash className="size-4" />
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 bg-muted/20 min-h-screen px-4 lg:px-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 shadow-sm border border-red-500/20">
                        <IconUserMinus className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Separation Management</h1>
                        <p className="text-sm text-muted-foreground">Manage employee resignations, terminations, and settlements.</p>
                    </div>
                </div>
                <Button className="gap-2 shadow-md rounded-xl" onClick={() => setIsSheetOpen(true)}>
                    <IconPlus className="size-4" />
                    New Separation
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Requests</CardDescription>
                        <CardTitle className="text-2xl">{separations.filter(t => t.status === "Pending").length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Processed This Month</CardDescription>
                        <CardTitle className="text-2xl text-primary">
                            {separations.filter(t => t.status === "Approved" && new Date(t.createdAt).getMonth() === new Date().getMonth()).length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Separated</CardDescription>
                        <CardTitle className="text-2xl">{separations.filter(t => t.status === "Approved").length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Quick Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-border/50">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-fit">
                        <IconFilter className="size-5" />
                        <span className="text-sm font-medium">Quick Filters:</span>
                    </div>

                    <div className="relative w-full sm:w-[200px]">
                        <select
                            className="h-10 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                            <IconFilter className="size-4 opacity-50" />
                        </div>
                    </div>

                    <div className="relative w-full sm:w-[200px]">
                        <select
                            className="h-10 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Resignation">Resignation</option>
                            <option value="Termination">Termination</option>
                            <option value="Retirement">Retirement</option>
                            <option value="Dismissal">Dismissal</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                            <IconCalendarOff className="size-4 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-background">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <IconLoader className="size-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Loading requests...</p>
                        </div>
                    ) : (
                        <DataTable
                            data={filteredSeparations}
                            columns={columns}
                            showActions={false}
                            showTabs={false}
                            searchKey="employeeName"
                        />
                    )}
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-md">
                    <SheetHeader className="pb-6">
                        <div className="size-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                            <IconUserMinus className="size-6" />
                        </div>
                        <SheetTitle>New Separation Request</SheetTitle>
                        <SheetDescription>Initiate resignation or termination process.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label>Employee ID Search</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Employee ID..."
                                    value={empSearchId}
                                    onChange={e => setEmpSearchId(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSearchEmployee()
                                        }
                                    }}
                                    className="h-11"
                                />
                                <Button type="button" onClick={handleSearchEmployee} variant="secondary" className="h-11">
                                    Search
                                </Button>
                            </div>
                            {searchedEmployee && (
                                <div className="p-3 bg-muted/50 rounded-lg border text-sm mt-2 space-y-1">
                                    <div className="font-medium text-primary">{searchedEmployee.fullNameEn}</div>
                                    <div className="text-muted-foreground">ID: {searchedEmployee.employeeId}</div>
                                    <div className="text-muted-foreground">Department: {searchedEmployee.departmentName || '-'}</div>
                                    <div className="text-muted-foreground">Designation: {searchedEmployee.designationName || '-'}</div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Separation Type</Label>
                            <select
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.type}
                                onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                            >
                                <option value="Resignation">Resignation</option>
                                <option value="Termination">Termination</option>
                                <option value="Retirement">Retirement</option>
                                <option value="Dismissal">Dismissal</option>
                                <option value="Absconding">Absconding</option>
                            </select>
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <Label>Last Working Date</Label>
                            <DatePicker
                                date={formData.lastWorkingDate ? new Date(formData.lastWorkingDate) : undefined}
                                setDate={(date) => setFormData(p => ({ ...p, lastWorkingDate: date ? format(date, "yyyy-MM-dd") : "" }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                placeholder="Detailed reason..."
                                value={formData.reason}
                                onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                            />
                        </div>

                        <SheetFooter className="pt-6">
                            <Button type="submit" className="w-full h-11 rounded-xl shadow-lg">
                                Submit Request
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={confirmDialog.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                            onClick={() => {
                                confirmDialog.onConfirm()
                                closeConfirmDialog()
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
