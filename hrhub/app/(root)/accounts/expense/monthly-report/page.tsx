"use client"

import React, { useEffect, useState } from "react"
import { IconDownload, IconArrowUpRight, IconCalendar } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, AccountTransaction } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"

export default function MonthlyExpenseReportPage() {
    const [data, setData] = useState<AccountTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    useEffect(() => {
        loadMonthlyData()
    }, [month, year])

    const loadMonthlyData = async () => {
        setLoading(true)
        try {
            const res = await accountService.getTransactions("Payment")
            const filtered = res.data.filter(t => {
                const d = new Date(t.transactionDate)
                return d.getMonth() + 1 === month && d.getFullYear() === year
            })
            setData(filtered)
        } finally {
            setLoading(false)
        }
    }

    const categoryTotals = data.reduce((acc: any, t) => {
        acc[t.category || "General"] = (acc[t.category || "General"] || 0) + t.amount
        return acc
    }, {})

    const total = Object.values(categoryTotals).reduce((a: any, b: any) => a + b, 0) as number

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Monthly Expense Report</h2>
                    <p className="text-muted-foreground">Aggregated cost analysis by category and branch</p>
                </div>
                <Button className="gap-2">
                    <IconDownload className="h-4 w-4" /> Export Excel
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="md:col-span-1 border-l-4 border-l-primary self-start">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase text-muted-foreground">
                            <IconCalendar className="h-4 w-4 text-primary" />
                            Time Period
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Month</Label>
                            <NativeSelect value={month.toString()} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <NativeSelectOption key={i + 1} value={(i + 1).toString()}>
                                        {new Date(0, i).toLocaleString('en', { month: 'long' })}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Year</Label>
                            <NativeSelect value={year.toString()} onChange={(e) => setYear(parseInt(e.target.value))}>
                                {[2024, 2025, 2026].map(y => <NativeSelectOption key={y} value={y.toString()}>{y}</NativeSelectOption>)}
                            </NativeSelect>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between border-b mb-6">
                        <div>
                            <CardTitle className="text-xl font-semibold">Expense Breakdown</CardTitle>
                            <CardDescription>Visualizing spending patterns</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Total Monthly Spend</p>
                            <p className="text-3xl font-bold text-rose-500 tracking-tighter">{formatCurrency(total)}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(categoryTotals).map(([cat, amt]: any) => (
                                <div key={cat} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                                            <IconArrowUpRight className="h-3 w-3 text-rose-400" />
                                            {cat}
                                        </span>
                                        <span className="font-bold">{formatCurrency(amt)} ({(amt / total * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-500 transition-all duration-500"
                                            style={{ width: `${(amt / total * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {Object.keys(categoryTotals).length === 0 && (
                                <div className="py-20 text-center italic text-muted-foreground">No data for this period.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
