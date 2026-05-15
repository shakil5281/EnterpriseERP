"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    code: z.string().min(1, "Item code is required"),
    category: z.string().min(1, "Category is required"),
    unit: z.string().min(1, "Unit is required"),
    minStock: z.number().min(0, "Min stock level must be positive"), // Use manual coercion in onChange
    status: z.string().min(1, "Status is required"),
    description: z.string().optional(),
})

interface ItemFormProps {
    initialData?: z.infer<typeof formSchema>
    onSubmit: (values: z.infer<typeof formSchema>) => void
    onCancel: () => void
}

export function ItemForm({ initialData, onSubmit, onCancel }: ItemFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            code: "",
            category: "",
            unit: "",
            minStock: 0,
            status: "Active",
            description: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Item Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="ITM-001" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || "Active"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Cotton 80s" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Raw Material">Raw Material (Fabric)</SelectItem>
                                        <SelectItem value="Accessories">Accessories (Buttons, Zippers)</SelectItem>
                                        <SelectItem value="Chemicals">Chemicals & Dyes</SelectItem>
                                        <SelectItem value="Spares">Machinery Spares</SelectItem>
                                        <SelectItem value="Packaging">Packaging Materials</SelectItem>
                                        <SelectItem value="General">General Store</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                                        <SelectItem value="mtr">Meter (mtr)</SelectItem>
                                        <SelectItem value="yds">Yards (yds)</SelectItem>
                                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                        <SelectItem value="box">Box</SelectItem>
                                        <SelectItem value="cone">Cone</SelectItem>
                                        <SelectItem value="drum">Drum</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Low Stock Alert Level</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={e => {
                                        const val = e.target.value === "" ? 0 : parseFloat(e.target.value)
                                        field.onChange(val)
                                    }}
                                />
                            </FormControl>
                            <FormDescription>System will alert when stock falls below this.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional details..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Item</Button>
                </div>
            </form>
        </Form>
    )
}
