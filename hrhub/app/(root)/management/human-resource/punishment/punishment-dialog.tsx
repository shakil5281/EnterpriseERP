"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { punishmentService, type EmployeePunishment } from "@/lib/services/punishment"
import { employeeService, type EmployeeSimple } from "@/lib/services/employee"
import { IconSearch, IconLoader } from "@tabler/icons-react"
import { DatePicker } from "@/components/ui/date-picker"

const formSchema = z.object({
    employeeId: z.number().min(1, "Please select an employee"),
    punishmentType: z.string().min(1, "Please select punishment type"),
    reason: z.string().min(10, "Reason must be at least 10 characters"),
    fineAmount: z.number().min(0),
    suspensionDays: z.number().min(0),
    punishmentDate: z.string().min(1, "Please select date"),
    effectiveDate: z.string(),
    expiryDate: z.string(),
    status: z.string().min(1),
    remarks: z.string(),
})

interface FormValues {
    employeeId: number;
    punishmentType: string;
    reason: string;
    fineAmount: number;
    suspensionDays: number;
    punishmentDate: string;
    status: string;
    effectiveDate: string;
    expiryDate: string;
    remarks: string;
}

interface PunishmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    punishment?: EmployeePunishment
    onSuccess: () => void
}

export function PunishmentDialog({ open, onOpenChange, punishment, onSuccess }: PunishmentDialogProps) {
    const [employees, setEmployees] = React.useState<EmployeeSimple[]>([])
    const [isSearching, setIsSearching] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employeeId: 0,
            punishmentType: "Warning",
            reason: "",
            fineAmount: 0,
            suspensionDays: 0,
            punishmentDate: new Date().toISOString().split("T")[0],
            status: "Active",
            remarks: "",
            effectiveDate: "",
            expiryDate: "",
        },
    })

    React.useEffect(() => {
        if (punishment) {
            form.reset({
                employeeId: punishment.employeeId,
                punishmentType: punishment.punishmentType,
                reason: punishment.reason,
                fineAmount: punishment.fineAmount,
                suspensionDays: punishment.suspensionDays,
                punishmentDate: new Date(punishment.punishmentDate).toISOString().split("T")[0],
                effectiveDate: punishment.effectiveDate ? new Date(punishment.effectiveDate).toISOString().split("T")[0] : "",
                expiryDate: punishment.expiryDate ? new Date(punishment.expiryDate).toISOString().split("T")[0] : "",
                status: punishment.status,
                remarks: punishment.remarks || "",
            } as FormValues)
            setSearchTerm(punishment.employeeCard)
        } else if (open) {
            form.reset({
                employeeId: 0,
                punishmentType: "Warning",
                reason: "",
                fineAmount: 0,
                suspensionDays: 0,
                punishmentDate: new Date().toISOString().split("T")[0],
                status: "Active",
                remarks: "",
                effectiveDate: "",
                expiryDate: "",
            } as FormValues)
            setSearchTerm("")
        }
    }, [punishment, open, form])

    const handleSearch = async () => {
        if (!searchTerm) return
        setIsSearching(true)
        try {
            const data = await employeeService.getEmployeesSimple({ searchTerm })
            setEmployees(data)
            if (data.length === 1) {
                form.setValue("employeeId", data[0].id)
            }
        } catch (error) {
            toast.error("Failed to search employees")
        } finally {
            setIsSearching(false)
        }
    }

    const onSubmit = async (values: FormValues) => {
        try {
            // Clean up empty strings to undefined if backend prefers that, 
            // but usually empty strings are fine for optional fields.
            const payload = {
                ...values,
                effectiveDate: values.effectiveDate || undefined,
                expiryDate: values.expiryDate || undefined,
                remarks: values.remarks || undefined,
            }

            if (punishment) {
                await punishmentService.updatePunishment(punishment.id, payload as any)
                toast.success("Punishment updated successfully")
            } else {
                await punishmentService.createPunishment(payload as any)
                toast.success("Punishment recorded successfully")
            }
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save punishment record")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{punishment ? "Edit Punishment" : "Record New Punishment"}</DialogTitle>
                    <DialogDescription>
                        Fill in the details to record a disciplinary action for an employee.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2 col-span-2">
                                <FormLabel>Search Employee (Name or ID)</FormLabel>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search by name or employee ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                                        disabled={!!punishment}
                                    />
                                    <Button type="button" size="icon" variant="outline" onClick={handleSearch} disabled={!!punishment || isSearching}>
                                        {isSearching ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                    </Button>
                                </div>
                                <FormField<FormValues>
                                    control={form.control}
                                    name="employeeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <NativeSelect
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                    disabled={!!punishment || (employees.length === 0 && !punishment)}
                                                >
                                                    <option value={0}>Select Employee</option>
                                                    {employees.map((emp) => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {emp.employeeId} - {emp.fullNameEn} ({emp.designationName})
                                                        </option>
                                                    ))}
                                                    {punishment && (
                                                        <option value={punishment.employeeId}>
                                                            {punishment.employeeCard} - {punishment.employeeName}
                                                        </option>
                                                    )}
                                                </NativeSelect>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField<FormValues>
                                control={form.control}
                                name="punishmentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Punishment Type</FormLabel>
                                        <FormControl>
                                            <NativeSelect {...field}>
                                                <option value="Warning">Warning</option>
                                                <option value="Fine">Fine</option>
                                                <option value="Suspension">Suspension</option>
                                                <option value="Termination">Termination</option>
                                                <option value="Demotion">Demotion</option>
                                                <option value="Show Cause">Show Cause</option>
                                            </NativeSelect>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<FormValues>
                                control={form.control}
                                name="punishmentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-1.5">
                                        <FormLabel>Date of Action</FormLabel>
                                        <DatePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<FormValues>
                                control={form.control}
                                name="fineAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fine Amount (৳)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field} 
                                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<FormValues>
                                control={form.control}
                                name="suspensionDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Suspension Days</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field} 
                                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<FormValues>
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            <NativeSelect {...field}>
                                                <option value="Active">Active</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Revoked">Revoked</option>
                                            </NativeSelect>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <FormField<FormValues>
                                control={form.control}
                                name="effectiveDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-1.5">
                                        <FormLabel>Effective Date</FormLabel>
                                        <DatePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<FormValues>
                                control={form.control}
                                name="expiryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-1.5">
                                        <FormLabel>Expiry Date</FormLabel>
                                        <DatePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="col-span-2">
                                <FormField<FormValues>
                                    control={form.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for Punishment</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detailed description of the incident..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="col-span-2">
                                <FormField<FormValues>
                                    control={form.control}
                                    name="remarks"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Remarks (Internal)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Any additional notes..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700">
                                {punishment ? "Update Record" : "Save Record"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
