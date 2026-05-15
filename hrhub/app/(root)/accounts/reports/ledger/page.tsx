"use client"

import React, { useEffect, useState } from "react"
import { IconFileAnalytics, IconPrinter, IconSearch, IconFilter, IconArrowLeftRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { accountService, Branch } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export default function LedgerReportPage() {
    const [reportData, setReportData] = useState<any[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({
        branchId: "all",
        fundSource: "all"
    })

    useEffect(() => {
        accountService.getBranches().then(res => setBranches(res.data))
        fetchReport()
    }, [])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const bId = filters.branchId === "all" ? undefined : parseInt(filters.branchId)
            const fSrc = filters.fundSource === "all" ? undefined : filters.fundSource
            const res = await accountService.getLedgerReport(bId, fSrc)
            setReportData(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">General Ledger</h2>
                    <p className="text-muted-foreground">Comprehensive record of all account entries and ledger activities</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <IconPrinter className="h-4 w-4" />
                    Print Ledger
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Filter by Branch</Label>
                            <NativeSelect
                                value={filters.branchId}
                                onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                                className="w-56 h-9"
                            >
                                <NativeSelectOption value="all">Global Ledger</NativeSelectOption>
                                {branches.map((b, index) => (
                                    <NativeSelectOption key={`${b.id}-${index}`} value={b.id!.toString()}>
                                        {b.branchName}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Account Category</Label>
                            <NativeSelect
                                value={filters.fundSource}
                                onChange={(e) => setFilters({ ...filters, fundSource: e.target.value })}
                                className="w-56 h-9"
                            >
                                <NativeSelectOption value="all">All Liquid Sources</NativeSelectOption>
                                <NativeSelectOption value="Cash">Cash Account</NativeSelectOption>
                                <NativeSelectOption value="Bank">Bank Account</NativeSelectOption>
                                <NativeSelectOption value="HandCash">Hand Cash</NativeSelectOption>
                            </NativeSelect>
                        </div>

                        <Button onClick={fetchReport} disabled={loading} className="h-9">
                            Generate Report
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference / Particulars</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Debit (Out)</TableHead>
                                    <TableHead className="text-right">Credit (In)</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 italic">Generating formal ledger...</TableCell>
                                    </TableRow>
                                ) : reportData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No ledger entries found for the selected filters.</TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs font-medium">{new Date(item.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="max-w-xs truncate text-xs">{item.title}</TableCell>
                                            <TableCell>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-tight border border-primary/20">
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-rose-600 font-semibold">{item.amount < 0 ? formatCurrency(Math.abs(item.amount)) : "-"}</TableCell>
                                            <TableCell className="text-right font-mono text-emerald-600 font-semibold">{item.amount > 0 ? formatCurrency(item.amount) : "-"}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">{formatCurrency(reportData.slice(0, i + 1).reduce((sum, d) => sum + d.amount, 0))}</TableCell>
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
