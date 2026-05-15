"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { IconFileInvoice, IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService } from "@/lib/services/accounts"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export default function CreateAdvancePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        employeeOrContractorName: "",
        date: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        paidAmount: 0,
        paymentType: "Advance",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await accountService.createAdvance(formData)
            toast.success("Advance recorded successfully")
            router.push("/accounts/advance/partial-payment") // Redirect to list/partial
        } catch (error) {
            toast.error("Failed to record advance")
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
                        <h2 className="text-3xl font-bold tracking-tight">Create Advance</h2>
                        <p className="text-muted-foreground">Issue advance or contractual payment to person/entity</p>
                    </div>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <IconFileInvoice className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Advance Details</CardTitle>
                    </div>
                    <CardDescription>Enter the agreement amount and initial payment for this advance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Employee / Contractor Name *</Label>
                            <Input
                                id="name"
                                required
                                value={formData.employeeOrContractorName}
                                onChange={(e) => setFormData({ ...formData, employeeOrContractorName: e.target.value })}
                                placeholder="Name of the person"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Payment Category *</Label>
                                <NativeSelect value={formData.paymentType} onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}>
                                    <NativeSelectOption value="Advance">Salary Advance</NativeSelectOption>
                                    <NativeSelectOption value="Contractual">Contractual Advance</NativeSelectOption>
                                    <NativeSelectOption value="Project">Project Initial Fund</NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="total">Total Agreed Amount *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                                    <Input
                                        id="total"
                                        type="number"
                                        required
                                        value={formData.totalAmount}
                                        onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                                        className="pl-7"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paid">Initial Paid Amount *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                                    <Input
                                        id="paid"
                                        type="number"
                                        required
                                        value={formData.paidAmount}
                                        onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) })}
                                        className="pl-7"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50 border border-border mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Auto-calculated Due:</span>
                                <span className="text-lg font-bold text-indigo-600">
                                    {formatCurrency(formData.totalAmount - formData.paidAmount)}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <IconDeviceFloppy className="h-4 w-4" />
                                {loading ? "Saving..." : "Record Advance"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
