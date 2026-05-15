"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { IconTrash, IconPlus, IconCalendar } from "@tabler/icons-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const itemSchema = z.object({
    itemId: z.string().min(1, "Item is required"),
    unit: z.string(),
    stock: z.number().optional(), // For display
    quantity: z.number().min(1, "Qty > 0"),
    remarks: z.string().optional(),
})

const formSchema = z.object({
    department: z.string().min(1, "Department/Line is required"),
    requisitionNo: z.string().optional(),
    date: z.date({ message: "Date is required" }),
    items: z.array(itemSchema).min(1, "At least one item is required"),
})

const itemsList = [
    { id: "1", name: "Cotton Yarn 80/1", unit: "kg", stock: 5000 },
    { id: "2", name: "Polyester Fabric", unit: "yds", stock: 12000 },
    { id: "3", name: "Plastic Buttons 14L", unit: "pcs", stock: 50000 },
]

interface IssueFormProps {
    onSubmit: (values: z.infer<typeof formSchema>) => void
    onCancel: () => void
}

export function IssueForm({ onSubmit, onCancel }: IssueFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            department: "",
            requisitionNo: "",
            date: new Date(),
            items: [
                { itemId: "", unit: "", quantity: 0, remarks: "" }
            ],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Department / Line</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Cutting">Cutting Section</SelectItem>
                                        <SelectItem value="Sewing Line 01">Sewing Line 01</SelectItem>
                                        <SelectItem value="Sewing Line 02">Sewing Line 02</SelectItem>
                                        <SelectItem value="Finishing">Finishing</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="requisitionNo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Req. No (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="REQ-..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Issue Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Item</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Issue Qty</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.itemId`}
                                            render={({ field: itemField }) => (
                                                <Select
                                                    onValueChange={(val) => {
                                                        itemField.onChange(val)
                                                        const selectedItem = itemsList.find(i => i.id === val)
                                                        if (selectedItem) {
                                                            form.setValue(`items.${index}.unit`, selectedItem.unit)
                                                            // Could also set stock for display if added to schema/state
                                                        }
                                                    }}
                                                    defaultValue={itemField.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Item" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {itemsList.map(i => (
                                                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {/* Mock displaying stock based on selection */}
                                        <span className="text-sm text-muted-foreground">
                                            {itemsList.find(i => i.id === form.watch(`items.${index}.itemId`))?.stock || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.remarks`}
                                            render={({ field }) => (
                                                <Input {...field} value={field.value || ""} placeholder="For..." />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-destructive hover:text-destructive/90"
                                        >
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-4 border-t bg-muted/20">
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => append({ itemId: "", unit: "", quantity: 0, remarks: "" })}
                        >
                            <IconPlus className="mr-2 size-4" />
                            Add Item
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" size="lg">
                        Confirm Issue
                    </Button>
                </div>
            </form>
        </Form >
    )
}
