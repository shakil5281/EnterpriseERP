"use client"

import React, { useEffect, useState } from "react"
import {
    IconTrendingUp,
    IconPrinter,
    IconDownload,
    IconSearch,
    IconEye,
    IconEdit,
    IconTrash,
    IconFilter,
    IconX,
    IconDotsVertical
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { accountService, AccountTransaction, Branch } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"

export default function DailyReceivedReportPage() {
    const [data, setData] = useState<AccountTransaction[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRows, setSelectedRows] = useState<number[]>([])

    // Filters
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        searchTerm: "",
        branchId: "all",
        fundSource: "all",
        category: "all"
    })

    const [showFilters, setShowFilters] = useState(true)

    useEffect(() => {
        loadData()
        loadBranches()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await accountService.getTransactions("Receive")
            setData(res.data)
        } catch (error) {
            toast.error("Failed to load transactions")
        } finally {
            setLoading(false)
        }
    }

    const loadBranches = async () => {
        try {
            const res = await accountService.getBranches()
            setBranches(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    const filteredData = data.filter(t => {
        const matchesDate = filters.date ? t.transactionDate.split('T')[0] === filters.date : true
        const matchesSearch = filters.searchTerm
            ? t.transactionNumber?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            t.category?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
            : true
        const matchesBranch = filters.branchId === "all" ? true : t.branchId?.toString() === filters.branchId
        const matchesFund = filters.fundSource === "all" ? true : t.fundSource === filters.fundSource
        const matchesCategory = filters.category === "all" ? true : t.category === filters.category

        return matchesDate && matchesSearch && matchesBranch && matchesFund && matchesCategory
    })

    const categories = Array.from(new Set(data.map(t => t.category).filter(Boolean))) as string[]

    const toggleSelectAll = (checked: boolean | string) => {
        if (!checked) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredData.map(t => t.id!).filter(id => id !== undefined))
        }
    }

    const toggleSelectRow = (id: number, checked: boolean | string) => {
        setSelectedRows(prev =>
            checked ? [...prev, id] : prev.filter(rowId => rowId !== id)
        )
    }

    const totalInflow = filteredData.reduce((s, t) => s + t.amount, 0)

    const resetFilters = () => {
        setFilters({
            date: new Date().toISOString().split('T')[0],
            searchTerm: "",
            branchId: "all",
            fundSource: "all",
            category: "all"
        })
    }

    const handleExportExcel = async () => {
        try {
            const response = await accountService.exportReportExcel("Receive")
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `Daily_Received_Report_${filters.date || "Export"}.xlsx`)
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
            link.setAttribute("download", `Daily_Received_Report_${filters.date || "Export"}.pdf`)
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
                    <h2 className="text-3xl font-bold tracking-tight">Daily Received Report</h2>
                    <p className="text-muted-foreground">Comprehensive overview of daily collections and income streams</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
                        <IconFilter className="h-4 w-4" />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf}>
                        <IconDownload className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm border-indigo-500" onClick={handleExportExcel}>
                        <IconDownload className="h-4 w-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {showFilters && (
                <Card className="border-none shadow-sm bg-muted/20">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Advanced Filters</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2"
                            onClick={resetFilters}
                        >
                            <IconX className="h-3 w-3 mr-1" /> Reset Filters
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Search Records</Label>
                                <div className="relative">
                                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Voucher, category..."
                                        className="h-9 pl-8 text-xs"
                                        value={filters.searchTerm}
                                        onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Report Date</Label>
                                <Input
                                    type="date"
                                    className="h-9 text-xs"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">By Branch</Label>
                                <NativeSelect
                                    value={filters.branchId}
                                    onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                                    className="h-9 text-xs"
                                >
                                    <NativeSelectOption value="all">Global (All Branches)</NativeSelectOption>
                                    {branches.map(b => (
                                        <NativeSelectOption key={b.id} value={b.id?.toString() || ""}>{b.branchName}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Asset Source</Label>
                                <NativeSelect
                                    value={filters.fundSource}
                                    onChange={(e) => setFilters({ ...filters, fundSource: e.target.value })}
                                    className="h-9 text-xs"
                                >
                                    <NativeSelectOption value="all">All Sources</NativeSelectOption>
                                    <NativeSelectOption value="Cash">Cash Liquidity</NativeSelectOption>
                                    <NativeSelectOption value="Bank">Bank Deposit</NativeSelectOption>
                                    <NativeSelectOption value="HandCash">Hand Cash</NativeSelectOption>
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Category</Label>
                                <NativeSelect
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    className="h-9 text-xs"
                                >
                                    <NativeSelectOption value="all">All Categories</NativeSelectOption>
                                    {categories.map(c => (
                                        <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="md:col-span-1 border-l-4 border-l-indigo-500 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Items Found</div>
                        <div className="text-2xl font-bold">{filteredData.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Matching current filters</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-l-4 border-l-emerald-500 shadow-sm">
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Total Funds Inflow</p>
                            <p className="text-4xl font-bold text-emerald-700 tracking-tighter">
                                {formatCurrency(totalInflow)}
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <IconTrendingUp className="h-8 w-8 text-emerald-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="shadow-sm border-none bg-card ring-1 ring-border">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 py-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <IconTrendingUp className="h-5 w-5 text-emerald-600" />
                        Reception Register
                    </CardTitle>
                    {selectedRows.length > 0 && (
                        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{selectedRows.length} items selected</span>
                            <div className="h-3 w-px bg-indigo-200 dark:bg-indigo-800" />
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-500 hover:bg-rose-100 font-bold">
                                Bulk Delete
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-0 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/5">
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="w-12 text-center">SL</TableHead>
                                <TableHead className="w-28 text-center">Date</TableHead>
                                <TableHead className="w-32">Voucher #</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Fund Source</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-28 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-24 italic text-muted-foreground animate-pulse">
                                        Synchronizing ledger entries...
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-24 text-muted-foreground font-medium">
                                        No transactions found matching the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((tx, index) => (
                                    <TableRow key={tx.id || index} className="group hover:bg-muted/5 transition-colors">
                                        <TableCell>
                                            <Checkbox
                                                checked={tx.id ? selectedRows.includes(tx.id) : false}
                                                onCheckedChange={(checked) => tx.id && toggleSelectRow(tx.id, checked)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-medium text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-center">
                                            {tx.transactionDate?.split('T')[0]}
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px] font-bold text-indigo-600">
                                            {tx.transactionNumber}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {tx.branchName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tight bg-muted/30 whitespace-nowrap">
                                                {tx.category || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium text-muted-foreground">{tx.fundSource}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600 font-mono text-sm">
                                            {formatCurrency(tx.amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <IconDotsVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <Link href={`/accounts/transactions/view/${tx.id}`}>
                                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                                            <IconEye className="h-4 w-4 text-blue-600" />
                                                            <span>View Details</span>
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer">
                                                        <IconEdit className="h-4 w-4 text-amber-600" />
                                                        <span>Edit Record</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                                        <IconTrash className="h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
