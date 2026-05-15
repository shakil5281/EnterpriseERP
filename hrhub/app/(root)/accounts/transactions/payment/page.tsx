"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconReceipt, IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, Branch } from "@/lib/services/accounts"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export default function PaymentEntryPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState<Branch[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [formData, setFormData] = useState({
        transactionDate: new Date().toISOString().split('T')[0],
        type: "Payment",
        fundSource: "Cash",
        branchId: "",
        amount: 0,
        category: "General Expense",
        referenceNumber: "",
        description: "",
        preparedBy: "Admin"
    })

    useEffect(() => {
        if (date) {
            setFormData(prev => ({ ...prev, transactionDate: date.toISOString().split('T')[0] }))
        }
    }, [date])

    useEffect(() => {
        accountService.getBranches().then(res => setBranches(res.data))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.branchId) {
            toast.error("Please select a branch")
            return
        }
        setLoading(true)
        try {
            await accountService.createTransaction({
                ...formData,
                branchId: parseInt(formData.branchId)
            } as any)
            toast.success("Payment recorded successfully")
            router.push("/accounts/cash-bank/cash-book")
        } catch (error) {
            toast.error("Failed to record payment")
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
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Payment Entry</h2>
                        <p className="text-muted-foreground">Authorize and document outgoing capital disbursements</p>
                    </div>
                </div>
            </div>

            <Card className="max-w-3xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <IconReceipt className="h-5 w-5 text-rose-500" />
                        <CardTitle>Disbursement Details</CardTitle>
                    </div>
                    <CardDescription>Specify the allocation and magnitude of funds for this payment.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="date">Expenditure Date *</Label>
                                <DatePicker date={date} setDate={setDate} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branch">Source Branch *</Label>
                                <NativeSelect value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                                    <NativeSelectOption value="" disabled>Select source branch...</NativeSelectOption>
                                    {branches.map((b, index) => (
                                        <NativeSelectOption key={`${b.id}-${index}`} value={b.id!.toString()}>{b.branchName}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fundSource">Payment Channel *</Label>
                                <NativeSelect value={formData.fundSource} onChange={(v) => setFormData({ ...formData, fundSource: v.target.value })}>
                                    <NativeSelectOption value="Cash">Liquid Cash</NativeSelectOption>
                                    <NativeSelectOption value="Bank">Bank Transfer</NativeSelectOption>
                                    <NativeSelectOption value="HandCash">Petty/Hand Cash</NativeSelectOption>
                                </NativeSelect>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Transaction Magnitude *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        placeholder="0.00"
                                        className="pl-7 font-bold text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">Expense Registry</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g. Utility, Tax, Salary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ref">Voucher / Check Ref</Label>
                                <Input
                                    id="ref"
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                    placeholder="CHK-4402, EXP-991"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Particulars / Narrative</Label>
                            <Input
                                id="desc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Formal context for this disbursement..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="gap-2 bg-rose-600 hover:bg-rose-700">
                                {loading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <IconDeviceFloppy className="h-4 w-4" />
                                )}
                                {loading ? "Authorizing..." : "Record Payment"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
