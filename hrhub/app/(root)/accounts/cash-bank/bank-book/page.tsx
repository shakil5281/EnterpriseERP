"use client"

import React, { useEffect, useState } from "react"
import { IconBuildingBank, IconPlus, IconSearch } from "@tabler/icons-react"
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
import { accountService, AccountTransaction } from "@/lib/services/accounts"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function BankBookPage() {
    const [transactions, setTransactions] = useState<AccountTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadTransactions()
    }, [])

    const loadTransactions = async () => {
        try {
            const res = await accountService.getTransactions(undefined, "Bank")
            setTransactions(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transactionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const deposits = transactions.filter(t => t.type === "Receive" || t.type === "Income").reduce((sum, t) => sum + t.amount, 0)
    const withdrawals = transactions.filter(t => t.type === "Payment" || t.type === "Expense").reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Bank Book</h2>
                    <p className="text-muted-foreground">Digital ledger for all banking transactions</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/accounts/transactions/receive">
                        <Button variant="outline" className="gap-2">
                            <IconPlus className="h-4 w-4" />
                            Bank Deposit
                        </Button>
                    </Link>
                    <Link href="/accounts/transactions/payment">
                        <Button variant="outline" className="gap-2">
                            <IconPlus className="h-4 w-4" />
                            Bank Withdrawal
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Deposits</div>
                        <div className="text-2xl font-bold mt-1">
                            {formatCurrency(deposits)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Total Withdrawals</div>
                        <div className="text-2xl font-bold mt-1">
                            {formatCurrency(withdrawals)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-slate-700">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Bank Balance</div>
                        <div className="text-2xl font-bold mt-1 text-slate-700">
                            {formatCurrency(deposits - withdrawals)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <IconBuildingBank className="h-5 w-5 text-blue-600" />
                            Bank Statement
                        </CardTitle>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference/CHQ</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Particulars</TableHead>
                                    <TableHead className="text-right">Deposit</TableHead>
                                    <TableHead className="text-right">Withdrawal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 italic text-muted-foreground">Syncing with bank data...</TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-medium">No bank transactions found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx, index) => (
                                        <TableRow key={tx.id || index}>
                                            <TableCell className="text-xs">
                                                {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-blue-600">{tx.referenceNumber || tx.transactionNumber}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                    {tx.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">{tx.branchName}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {tx.description || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 font-mono">
                                                {tx.type === "Receive" || tx.type === "Income" ? formatCurrency(tx.amount) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-rose-600 font-mono">
                                                {tx.type === "Payment" || tx.type === "Expense" ? formatCurrency(tx.amount) : "-"}
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
