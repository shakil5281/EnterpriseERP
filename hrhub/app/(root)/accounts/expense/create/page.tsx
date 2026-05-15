"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconReceiptOff, IconArrowLeft, IconPlus, IconTrash, IconDeviceFloppy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, Branch } from "@/lib/services/accounts"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export default function CreateExpenseSheetPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState<Branch[]>([])
    const [selectedBranch, setSelectedBranch] = useState("")
    const [items, setItems] = useState([{ category: "General", description: "", amount: 0 }])

    useEffect(() => {
        accountService.getBranches().then(res => setBranches(res.data))
    }, [])

    const addItem = () => setItems([...items, { category: "General", description: "", amount: 0 }])
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
            ; (newItems as any)[index][field] = value
        setItems(newItems)
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBranch) {
            toast.error("Please select a branch")
            return
        }
        setLoading(true)
        try {
            for (const item of items) {
                if (item.amount > 0) {
                    await accountService.createTransaction({
                        transactionDate: new Date().toISOString().split('T')[0],
                        type: "Payment",
                        fundSource: "Cash",
                        branchId: parseInt(selectedBranch),
                        amount: item.amount,
                        category: "Sheet: " + item.category,
                        description: item.description,
                        preparedBy: "Admin"
                    } as any)
                }
            }
            toast.success("Expense sheet recorded successfully")
            router.push("/accounts/expense/daily")
        } catch (error) {
            toast.error("Failed to save expense sheet")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Create Expense Sheet</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-4">
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Line Items</CardTitle>
                                <CardDescription>Breakdown your daily expenses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="w-40 text-right">Amount</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Input
                                                            value={item.category}
                                                            onChange={(e) => updateItem(index, "category", e.target.value)}
                                                            placeholder="e.g. Tea"
                                                            className="h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, "description", e.target.value)}
                                                            placeholder="Details..."
                                                            className="h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">৳</span>
                                                            <Input
                                                                type="number"
                                                                className="text-right pl-7 h-9"
                                                                value={item.amount}
                                                                onChange={(e) => updateItem(index, "amount", parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
                                                            <IconTrash className="h-4 w-4 text-rose-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Button type="button" variant="outline" className="mt-4 gap-2 border-dashed w-full" onClick={addItem}>
                                    <IconPlus className="h-4 w-4" /> Add Item
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">Expense Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Charged to Branch</Label>
                                    <NativeSelect value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                                        <NativeSelectOption value="" disabled>Select Target Branch</NativeSelectOption>
                                        {branches.map((b, index) => <NativeSelectOption key={`${b.id}-${index}`} value={b.id!.toString()}>{b.branchName}</NativeSelectOption>)}
                                    </NativeSelect>
                                </div>
                                <div className="h-px bg-border w-full my-4" />
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="font-semibold text-muted-foreground uppercase text-[10px]">Total Sheet Sum</span>
                                    <span className="text-3xl font-bold text-primary">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                                <Button type="submit" className="w-full gap-2 mt-4" disabled={loading}>
                                    <IconDeviceFloppy className="h-4 w-4" />
                                    {loading ? "Saving..." : "Finalize Sheet"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
