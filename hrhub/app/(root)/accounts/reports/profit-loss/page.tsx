"use client"

import React, { useEffect, useState } from "react"
import { IconChartBar, IconPrinter, IconDownload, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, AccountSummary } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export default function ProfitLossPage() {
    const [summary, setSummary] = useState<AccountSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        accountService.getSummary()
            .then(res => setSummary(res.data))
            .finally(() => setLoading(false))
    }, [])

    const totalIncome = summary?.todaysReceive || 0
    const totalExpense = summary?.todaysPayment || 0
    const netProfit = totalIncome - totalExpense

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Profit & Loss</h2>
                    <p className="text-muted-foreground">Comprehensive income statement and net earnings analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <IconPrinter className="h-4 w-4" />
                        Print
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <IconDownload className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="flex justify-center">
                <Card className="w-full max-w-3xl overflow-hidden border">
                    <div className={`h-1.5 w-full ${netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <CardHeader className="text-center pt-8">
                        <CardTitle className="text-2xl font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                            <IconChartBar className="h-6 w-6 text-primary" />
                            Income Statement
                        </CardTitle>
                        <CardDescription>Fiscal Period Summary</CardDescription>
                    </CardHeader>
                    <CardContent className="md:px-12 pb-12">
                        <div className="space-y-10 mt-6">
                            {/* Revenue Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <IconTrendingUp className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-700">Operating Revenue</h3>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-muted/50">
                                        <span className="text-muted-foreground">Gross Received Income</span>
                                        <span className="font-semibold">{formatCurrency(totalIncome)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-base pt-2">
                                        <span className="text-muted-foreground/80">TOTAL REVENUE (A)</span>
                                        <span className="text-emerald-700">{formatCurrency(totalIncome)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expense Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <IconTrendingDown className="h-5 w-5 text-rose-600" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-rose-700">Operating Expenses</h3>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-muted/50">
                                        <span className="text-muted-foreground">Total Operating Payments</span>
                                        <span className="font-semibold">{formatCurrency(totalExpense)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-base pt-2">
                                        <span className="text-muted-foreground/80">TOTAL EXPENSES (B)</span>
                                        <span className="text-rose-700">{formatCurrency(totalExpense)}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Bottom Line */}
                            <div className={`p-8 rounded-lg border ${netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Earnings (A - B)</h4>
                                        <p className={`text-4xl font-bold mt-1 ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                            {netProfit >= 0 ? "SURPLUS" : "DEFICIT"}: {formatCurrency(Math.abs(netProfit))}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-xl ${netProfit >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                                        {netProfit >= 0 ?
                                            <IconTrendingUp className="h-10 w-10 text-emerald-600" /> :
                                            <IconTrendingDown className="h-10 w-10 text-rose-600" />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
