"use client"

import React, { useEffect, useState } from "react"
import { IconBusinessplan, IconPlus, IconSearch } from "@tabler/icons-react"
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

export default function HandCashPage() {
    const [transactions, setTransactions] = useState<AccountTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadTransactions()
    }, [])

    const loadTransactions = async () => {
        try {
            const res = await accountService.getTransactions(undefined, "HandCash")
            setTransactions(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transactionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hand Cash</h2>
                    <p className="text-muted-foreground">Monitor in-hand liquidity and petty cash transactions</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/accounts/transactions/receive">
                        <Button variant="outline" className="gap-2">
                            <IconPlus className="h-4 w-4" />
                            Add Hand Cash
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <IconBusinessplan className="h-5 w-5 text-amber-500" />
                            Petty Cash Ledger
                        </CardTitle>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ledger..."
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
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Particulars</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 italic">Loading hand cash...</TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No hand cash records found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx, index) => (
                                        <TableRow key={tx.id || index}>
                                            <TableCell className="text-xs">{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : "-"}</TableCell>
                                            <TableCell className="font-mono text-xs">{tx.transactionNumber}</TableCell>
                                            <TableCell className="text-sm">{tx.description || tx.category}</TableCell>
                                            <TableCell className={cn("text-right font-bold", tx.type === "Receive" || tx.type === "Income" ? "text-emerald-600" : "text-rose-600")}>
                                                {tx.type === "Receive" || tx.type === "Income" ? "" : "-"}{formatCurrency(tx.amount)}
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
