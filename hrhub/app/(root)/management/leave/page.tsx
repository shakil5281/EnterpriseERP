"use client"

import * as React from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
    IconCalendarEvent,
    IconPlus,
    IconCheck,
    IconX,
    IconEye,
    IconFilter,
    IconLoader,
    IconHistory,
    IconSearch,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconFileDownload,
    IconFileTypeXls
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
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { leaveService, type LeaveApplication, type LeaveType } from "@/lib/services/leave"
import { employeeService } from "@/lib/services/employee"
import { format } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"

export default function LeaveManagementPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isActionLoading, setIsActionLoading] = React.useState<number | null>(null)
    const [applications, setApplications] = React.useState<LeaveApplication[]>([])
    const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([])

    // Sheet and Edit state
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingId, setEditingId] = React.useState<number | null>(null)
    const [deleteId, setDeleteId] = React.useState<number | null>(null)

    // Form state
    const [isApplying, setIsApplying] = React.useState(false)
    const [isSearchingEmployee, setIsSearchingEmployee] = React.useState(false)
    const [formData, setFormData] = React.useState({
        employeeCard: 0,
        employeeId: "",
        employeeName: "",
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: ""
    })

    React.useEffect(() => {
        loadData()
        leaveService.getLeaveTypes().then(setLeaveTypes)
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const data = await leaveService.getApplications()
            setApplications(data)
        } catch (error) {
            toast.error("Failed to load leave applications")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = async (id: number, status: "Approved" | "Rejected") => {
        setIsActionLoading(id)
        try {
            await leaveService.actionLeave({ id, status })
            toast.success(`Leave request ${status.toLowerCase()} successfully`)
            loadData()
        } catch (error) {
            toast.error("Failed to process leave action")
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleEmployeeSearch = async () => {
        if (!formData.employeeId) return
        setIsSearchingEmployee(true)
        try {
            const employees = await employeeService.getEmployees({ searchTerm: formData.employeeId })
            const found = employees.find(e => e.employeeId === formData.employeeId)
            if (found) {
                setFormData(prev => ({
                    ...prev,
                    employeeCard: found.id,
                    employeeName: found.fullNameEn
                }))
                toast.success("Employee found")
            } else {
                toast.error("Employee not found")
                setFormData(prev => ({ ...prev, employeeCard: 0, employeeName: "" }))
            }
        } catch (error) {
            toast.error("Error searching employee")
        } finally {
            setIsSearchingEmployee(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.employeeCard || !formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Please fill all required fields")
            return
        }

        setIsApplying(true)
        try {
            if (editingId) {
                await leaveService.updateLeave(editingId, {
                    ...formData,
                    leaveTypeId: parseInt(formData.leaveTypeId)
                })
                toast.success("Leave application updated successfully")
            } else {
                await leaveService.applyLeave({
                    ...formData,
                    leaveTypeId: parseInt(formData.leaveTypeId)
                })
                toast.success("Leave application submitted successfully")
            }
            loadData()
            handleSheetClose()
        } catch (error) {
            toast.error(editingId ? "Failed to update leave application" : "Failed to submit leave application")
        } finally {
            setIsApplying(false)
        }
    }

    const handleSheetClose = () => {
        setIsSheetOpen(false)
        setEditingId(null)
        setFormData({
            employeeCard: 0,
            employeeId: "",
            employeeName: "",
            leaveTypeId: "",
            startDate: "",
            endDate: "",
            reason: ""
        })
    }

    const handleEdit = (application: LeaveApplication) => {
        if (application.status !== "Pending") {
            toast.error("Only pending applications can be edited")
            return
        }
        setEditingId(application.id)
        setFormData({
            employeeCard: application.employeeCard,
            employeeId: application.employeeId,
            employeeName: application.employeeName,
            leaveTypeId: application.leaveTypeId.toString(),
            startDate: application.startDate,
            endDate: application.endDate,
            reason: application.reason
        })
        setIsSheetOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await leaveService.deleteLeave(deleteId)
            toast.success("Leave application deleted successfully")
            loadData()
        } catch (error) {
            toast.error("Failed to delete leave application")
        } finally {
            setDeleteId(null)
        }
    }

    const columns: ColumnDef<LeaveApplication>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.department}</span>
                </div>
            )
        },
        {
            accessorKey: "leaveTypeName",
            header: "Leave Type",
            cell: ({ row }) => (
                <button
                    onClick={() => window.location.href = `/management/leave/application/${row.original.id}`}
                    className="font-medium hover:underline text-primary text-left"
                >
                    <Badge variant="secondary" className="font-normal cursor-pointer">{row.original.leaveTypeName}</Badge>
                </button>
            )
        },
        {
            accessorKey: "startDate",
            header: "Duration",
            cell: ({ row }) => (
                <div className="text-xs">
                    <div className="font-medium">{format(new Date(row.original.startDate), "dd MMM")} - {format(new Date(row.original.endDate), "dd MMM yyyy")}</div>
                    <div className="text-muted-foreground">{row.original.totalDays} day(s)</div>
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                const variant = status === "Approved" ? "default" : status === "Rejected" ? "destructive" : "secondary"
                return <Badge variant={variant} className="font-normal text-xs">{status}</Badge>
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <IconDotsVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.location.href = `/management/leave/application/${row.original.id}`}>
                            <IconEye className="mr-2 size-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleEdit(row.original)}
                            disabled={row.original.status !== "Pending"}
                        >
                            <IconEdit className="mr-2 size-4" /> Edit Application
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-rose-600"
                            onClick={() => setDeleteId(row.original.id)}
                            disabled={row.original.status !== "Pending"}
                        >
                            <IconTrash className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <IconCheck className="mr-2 size-4" /> Approval Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                        className="text-emerald-600"
                                        onClick={() => handleAction(row.original.id, "Approved")}
                                        disabled={row.original.status !== "Pending"}
                                    >
                                        <IconCheck className="mr-2 size-4" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-rose-600"
                                        onClick={() => handleAction(row.original.id, "Rejected")}
                                        disabled={row.original.status !== "Pending"}
                                    >
                                        <IconX className="mr-2 size-4" /> Reject
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <IconFileDownload className="mr-2 size-4" /> Export As
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => leaveService.downloadPdf(row.original.id)}>
                                        <IconFileDownload className="mr-2 size-4" /> PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => leaveService.exportExcel()}>
                                        <IconFileTypeXls className="mr-2 size-4" /> Excel
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
                    <p className="text-muted-foreground text-sm">Manage employee leave applications and records</p>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleSheetClose()}>
                    <SheetTrigger asChild>
                        <Button className="gap-2" onClick={() => setIsSheetOpen(true)}>
                            <IconPlus className="size-4" /> New Application
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader className="pb-4">
                            <SheetTitle>{editingId ? "Edit Application" : "New Application"}</SheetTitle>
                            <SheetDescription>
                                {editingId ? "Update leave request details." : "Submit a new leave request for an employee."}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="employeeId"
                                            placeholder="EMP-001"
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                            onKeyDown={(e) => e.key === "Enter" && handleEmployeeSearch()}
                                            className="uppercase"
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="shrink-0"
                                            onClick={handleEmployeeSearch}
                                            disabled={isSearchingEmployee}
                                        >
                                            {isSearchingEmployee ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employeeName">Name</Label>
                                    <Input
                                        id="employeeName"
                                        readOnly
                                        placeholder="Auto-filled"
                                        className="bg-muted"
                                        value={formData.employeeName}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="leaveType">Leave Type</Label>
                                <NativeSelect
                                    id="leaveType"
                                    value={formData.leaveTypeId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, leaveTypeId: e.target.value }))}
                                >
                                    <option value="">Select Type</option>
                                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <DatePicker
                                        date={formData.startDate ? new Date(formData.startDate) : undefined}
                                        setDate={(date) => setFormData(prev => ({ ...prev, startDate: date ? date.toISOString() : "" }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <DatePicker
                                        date={formData.endDate ? new Date(formData.endDate) : undefined}
                                        setDate={(date) => setFormData(prev => ({ ...prev, endDate: date ? date.toISOString() : "" }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Brief reason for leave..."
                                    className="min-h-[100px]"
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleSubmit}
                                disabled={isApplying}
                            >
                                {isApplying && <IconLoader className="mr-2 size-4 animate-spin" />}
                                {editingId ? "Update Application" : "Submit Application"}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid gap-4 md:grid-cols-3 px-6">
                <KPICard title="Pending" value={applications.filter(a => a.status === "Pending").length.toString()} icon={IconHistory} />
                <KPICard title="On Leave" value="0" icon={IconCalendarEvent} />
                <KPICard title="Approved" value={applications.filter(a => a.status === "Approved").length.toString()} icon={IconCheck} />
            </div>

            <div className="px-6">
                <Card>
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-base font-semibold">Application History</CardTitle>
                    </CardHeader>
                    <DataTable
                        columns={columns}
                        data={applications}
                        showColumnCustomizer={false}
                        searchKey="employeeName"
                        isLoading={isLoading}
                    />
                </Card>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this leave application? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function KPICard({ title, value, icon: Icon }: any) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
