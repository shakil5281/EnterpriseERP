"use client"

import React, { useEffect, useState } from "react"
import { IconTrendingUp, IconCalendarTime, IconDownload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, AccountTransaction } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function MonthlyReceivedReport() {
    const [data, setData] = useState<AccountTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    useEffect(() => {
        loadMonthlyIncome()
    }, [month, year])

    const loadMonthlyIncome = async () => {
        setLoading(true)
        try {
            const res = await accountService.getTransactions("Receive")
            const filtered = res.data.filter(t => {
                const d = new Date(t.transactionDate)
                return d.getMonth() + 1 === month && d.getFullYear() === year
            })
            setData(filtered)
        } finally {
            setLoading(false)
        }
    }

    const categoryAggregation = data.reduce((acc: any, t) => {
        acc[t.category || "Other"] = (acc[t.category || "Other"] || 0) + t.amount
        return acc
    }, {})

    const total = data.reduce((s, t) => s + t.amount, 0)

    const handleExportExcel = async () => {
        try {
            const response = await accountService.exportReportExcel("Receive")
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `Monthly_Income_Report_${month}_${year}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error("Failed to export Excel report")
        }
    }

    const handleExportPdf = async () => {
        try {
            const response = await accountService.exportReportPdf("Receive")
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `Monthly_Income_Report_${month}_${year}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error("Failed to export PDF report")
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Monthly Income Report</h2>
                    <p className="text-muted-foreground">Aggregated revenue analysis across all streams</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportPdf}>
                        <IconDownload className="h-4 w-4" />
                        Download PDF
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                        <IconDownload className="h-4 w-4" />
                        Download Excel
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-l-4 border-l-primary self-start">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase text-muted-foreground">
                            <IconCalendarTime className="h-4 w-4 text-primary" />
                            Period Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
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
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 border-l-4 border-l-emerald-500">
                    <CardContent className="pt-10 flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Cumulative Monthly Inflow</p>
                            <p className="text-6xl font-bold mt-2 tracking-tighter text-emerald-700">
                                {formatCurrency(total)}
                            </p>
                            <div className="mt-6">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                                    {data.length} Transactions Recorded
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <IconTrendingUp className="h-10 w-10 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Income Categorization</CardTitle>
                    <CardDescription>Performance of different revenue streams</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(categoryAggregation).map(([cat, amt]: any) => (
                            <div key={cat} className="p-4 rounded-lg bg-muted/30 border hover:border-emerald-500/30 transition-all">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{cat}</p>
                                <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(amt)}</p>
                                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${(amt / total * 100)}%` }} />
                                </div>
                            </div>
                        ))}
                        {Object.keys(categoryAggregation).length === 0 && (
                            <div className="col-span-full py-10 text-center text-muted-foreground italic">No data found for this period.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
