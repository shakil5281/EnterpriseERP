"use client"

import * as React from "react"
import {
    IconArrowsExchange,
    IconPlus,
    IconTrash,
    IconCheck,
    IconX,
    IconBuildingSkyscraper,
    IconLoader,
    IconFilter,
    IconUser
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
import { DatePicker } from "@/components/ui/date-picker"
import { transferService, type Transfer } from "@/lib/services/transfer"
import { organogramService } from "@/lib/services/organogram"
import { employeeService, type Employee } from "@/lib/services/employee"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function MigrationTransferPage() {
    const [transfers, setTransfers] = React.useState<Transfer[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    // Form Data
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [formData, setFormData] = React.useState({
        employeeId: "",
        departmentId: "",
        designationId: "",
        transferDate: format(new Date(), "yyyy-MM-dd"),
        reason: ""
    })

    const fetchTransfers = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await transferService.getTransfers()
            setTransfers(data)
        } catch (error) {
            toast.error("Failed to load transfers")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchTransfers()
        organogramService.getDepartments().then(setDepartments)
        employeeService.getEmployees({ status: 'Active' }).then(setEmployees)
    }, [fetchTransfers])

    // Fetch designations when department changes
    React.useEffect(() => {
        if (formData.departmentId) {
            organogramService.getDesignations({ departmentId: parseInt(formData.departmentId) }).then(setDesignations)
        } else {
            setDesignations([])
        }
    }, [formData.departmentId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.employeeId || !formData.departmentId || !formData.designationId || !formData.transferDate) {
            toast.error("Please fill all required fields")
            return
        }

        try {
            await transferService.createTransfer({
                employeeId: parseInt(formData.employeeId),
                toDepartmentId: parseInt(formData.departmentId),
                toDesignationId: parseInt(formData.designationId),
                transferDate: formData.transferDate,
                reason: formData.reason
            })
            toast.success("Transfer request submitted")
            setIsSheetOpen(false)
            fetchTransfers()
            setFormData({
                employeeId: "",
                departmentId: "",
                designationId: "",
                transferDate: format(new Date(), "yyyy-MM-dd"),
                reason: ""
            })
        } catch (error) {
            toast.error("Failed to create request")
        }
    }

    const handleStatusUpdate = async (id: number, status: string) => {
        if (!confirm(`Are you sure you want to ${status} this transfer?`)) return
        try {
            await transferService.updateStatus(id, status)
            toast.success(`Transfer ${status}`)
            fetchTransfers()
        } catch (error) {
            toast.error("Update failed")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this request?")) return
        try {
            await transferService.deleteTransfer(id)
            toast.success("Deleted successfully")
            fetchTransfers()
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    const columns: ColumnDef<Transfer>[] = [
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
            header: "From",
            cell: ({ row }) => (
                <div className="text-sm">
                    <div className="font-medium text-muted-foreground">{row.original.fromDepartmentName}</div>
                    <div className="text-xs text-muted-foreground/70">{row.original.fromDesignationName}</div>
                </div>
            )
        },
        {
            header: "To",
            cell: ({ row }) => (
                <div className="text-sm">
                    <div className="font-medium">{row.original.toDepartmentName}</div>
                    <div className="text-xs text-muted-foreground">{row.original.toDesignationName}</div>
                </div>
            )
        },
        {
            accessorKey: "transferDate",
            header: "Date",
            cell: ({ row }) => <span>{format(new Date(row.original.transferDate), "dd MMM yyyy")}</span>
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
                    <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-500/20">
                        <IconArrowsExchange className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Migration & Transfers</h1>
                        <p className="text-sm text-muted-foreground">Manage employee internal movements and role changes.</p>
                    </div>
                </div>
                <Button className="gap-2 shadow-md rounded-xl" onClick={() => setIsSheetOpen(true)}>
                    <IconPlus className="size-4" />
                    New Transfer
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Requests</CardDescription>
                        <CardTitle className="text-2xl">{transfers.filter(t => t.status === "Pending").length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Approved This Month</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {transfers.filter(t => t.status === "Approved").length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total History</CardDescription>
                        <CardTitle className="text-2xl">{transfers.length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-background">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <IconLoader className="size-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Loading transfers...</p>
                        </div>
                    ) : (
                        <DataTable
                            data={transfers}
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
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <IconArrowsExchange className="size-6" />
                        </div>
                        <SheetTitle>Initiate Transfer</SheetTitle>
                        <SheetDescription>Create a new internal transfer request for an employee.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    value={formData.employeeId}
                                    onChange={e => setFormData(p => ({ ...p, employeeId: e.target.value }))}
                                >
                                    <option value="" disabled>Select Employee</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.fullNameEn} ({e.employeeId}) - {e.designationName}
                                        </option>
                                    ))}
                                </select>
                                <IconUser className="absolute right-3 top-3 size-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Target Department</Label>
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
                            <Label>Target Designation</Label>
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

                        <div className="space-y-2 flex flex-col">
                            <Label>Transfer Date</Label>
                            <DatePicker
                                date={formData.transferDate ? new Date(formData.transferDate) : undefined}
                                setDate={(date) => setFormData(p => ({ ...p, transferDate: date ? format(date, "yyyy-MM-dd") : "" }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                placeholder="Reason for transfer..."
                                value={formData.reason}
                                onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                            />
                        </div>

                        <SheetFooter className="pt-6">
                            <Button type="submit" className="w-full h-11 rounded-xl shadow-lg">
                                Create Transfer Request
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
