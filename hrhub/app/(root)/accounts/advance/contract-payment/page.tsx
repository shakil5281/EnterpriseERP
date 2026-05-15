"use client"

import React, { useEffect, useState } from "react"
import { IconPrinter, IconUserCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, AdvancePayment } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function ContractualPaymentSheet() {
    const [data, setData] = useState<AdvancePayment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        accountService.getAdvances().then(res => {
            // Filter for Contractual payments
            const filtered = res.data.filter(a => a.paymentType === "Contractual")
            setData(filtered)
            setLoading(false)
        })
    }, [])

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Contractual Payment Sheet</h2>
                    <p className="text-muted-foreground">Detailed statement of agreement-based financial obligations</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <IconPrinter className="h-4 w-4" />
                    Print Sheet
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconUserCheck className="h-5 w-5 text-indigo-500" />
                                Vendor & Contractor Ledger
                            </CardTitle>
                            <CardDescription>Consolidated view of contract values and settlements</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Contract Liability</p>
                            <p className="text-3xl font-bold text-indigo-700 tracking-tighter">
                                {formatCurrency(data.reduce((s, a) => s + a.totalAmount, 0))}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contractor Name</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead className="text-right">Total Agreement</TableHead>
                                    <TableHead className="text-right">Total Paid</TableHead>
                                    <TableHead className="text-right">Remaining Due</TableHead>
                                    <TableHead className="text-center">Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 italic">Loading contracts...</TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic font-medium">No active contracts found.</TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((adv, index) => (
                                        <TableRow key={adv.id || index}>
                                            <TableCell className="font-semibold text-sm">{adv.employeeOrContractorName}</TableCell>
                                            <TableCell className="text-sm">{new Date(adv.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(adv.totalAmount)}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(adv.paidAmount)}</TableCell>
                                            <TableCell className="text-right text-rose-600 font-bold">{formatCurrency(adv.dueAmount || 0)}</TableCell>
                                            <TableCell className="w-32">
                                                <div className="flex items-center gap-2 px-4">
                                                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${(adv.paidAmount / adv.totalAmount * 100)}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold">{(adv.paidAmount / adv.totalAmount * 100).toFixed(0)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={adv.status === "Settled" ? "default" : "outline"} className={adv.status === "Pending" ? "text-amber-600 border-amber-600" : ""}>
                                                    {adv.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
