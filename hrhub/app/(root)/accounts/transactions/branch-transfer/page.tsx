"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconArrowsLeftRight, IconArrowLeft, IconDeviceFloppy, IconAlertCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, Branch } from "@/lib/services/accounts"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export default function BranchTransferPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState<Branch[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [formData, setFormData] = useState({
        transactionDate: new Date().toISOString().split('T')[0],
        fromBranchId: "",
        toBranchId: "",
        fundSource: "Cash",
        amount: 0,
        description: "",
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
        if (!formData.fromBranchId || !formData.toBranchId) {
            toast.error("Please select both branches")
            return
        }
        if (formData.fromBranchId === formData.toBranchId) {
            toast.error("Source and destination branches cannot be the same")
            return
        }
        setLoading(true)
        try {
            const payment = {
                transactionDate: formData.transactionDate,
                type: "Payment",
                fundSource: formData.fundSource,
                branchId: parseInt(formData.fromBranchId),
                amount: formData.amount,
                category: "Branch Transfer Out",
                description: `Transfer to ${branches.find(b => b.id?.toString() === formData.toBranchId)?.branchName}. ${formData.description}`
            }

            const receive = {
                transactionDate: formData.transactionDate,
                type: "Receive",
                fundSource: formData.fundSource,
                branchId: parseInt(formData.toBranchId),
                amount: formData.amount,
                category: "Branch Transfer In",
                description: `Transfer from ${branches.find(b => b.id?.toString() === formData.fromBranchId)?.branchName}. ${formData.description}`
            }

            await accountService.createTransaction(payment as any)
            await accountService.createTransaction(receive as any)

            toast.success("Branch transfer completed")
            router.push("/accounts/branch/balance")
        } catch (error) {
            toast.error("Failed to complete transfer")
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
                        <h2 className="text-3xl font-bold tracking-tight">Branch Transfer</h2>
                        <p className="text-muted-foreground">Execute capital migration between structural nodes</p>
                    </div>
                </div>
            </div>

            <Card className="max-w-3xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <IconArrowsLeftRight className="h-5 w-5 text-blue-500" />
                        <CardTitle>Transfer Configuration</CardTitle>
                    </div>
                    <CardDescription>Manage internal liquidity rebalancing between organizational branches.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Execution Date *</Label>
                                <DatePicker date={date} setDate={setDate} />
                            </div>
                            <div className="space-y-2">
                                <Label>Asset Type *</Label>
                                <NativeSelect value={formData.fundSource} onChange={(v) => setFormData({ ...formData, fundSource: v.target.value })}>
                                    <NativeSelectOption value="Cash">Liquid Cash</NativeSelectOption>
                                    <NativeSelectOption value="Bank">Bank Balance</NativeSelectOption>
                                    <NativeSelectOption value="HandCash">Hand Cash</NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-muted/30 border border-border">
                            <div className="space-y-2">
                                <Label className="text-rose-600 font-bold">Source Branch (From)</Label>
                                <NativeSelect value={formData.fromBranchId} onChange={(e) => setFormData({ ...formData, fromBranchId: e.target.value })} className="border-rose-200 dark:border-rose-900">
                                    <NativeSelectOption value="" disabled>Select Source</NativeSelectOption>
                                    {branches.map((b, index) => <NativeSelectOption key={`${b.id}-${index}`} value={b.id!.toString()}>{b.branchName}</NativeSelectOption>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-emerald-600 font-bold">Target Branch (To)</Label>
                                <NativeSelect value={formData.toBranchId} onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })} className="border-emerald-200 dark:border-emerald-900">
                                    <NativeSelectOption value="" disabled>Select Target</NativeSelectOption>
                                    {branches.map((b, index) => <NativeSelectOption key={`${b.id}-${index}`} value={b.id!.toString()}>{b.branchName}</NativeSelectOption>)}
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Movement Magnitude *</Label>
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

                        <div className="space-y-2">
                            <Label>Internal Memo</Label>
                            <Input
                                id="desc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Formal context for internal migration..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                {loading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <IconArrowsLeftRight className="h-4 w-4" />
                                )}
                                {loading ? "Processing..." : "Confirm Transfer"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
