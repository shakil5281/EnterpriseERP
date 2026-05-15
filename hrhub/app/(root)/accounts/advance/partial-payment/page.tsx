"use client"

import React, { useEffect, useState } from "react"
import { IconFileInvoice, IconPlus, IconSearch, IconWallet } from "@tabler/icons-react"
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
import { accountService, AdvancePayment } from "@/lib/services/accounts"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function AdvanceListPage() {
    const [advances, setAdvances] = useState<AdvancePayment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadAdvances()
    }, [])

    const loadAdvances = async () => {
        try {
            const res = await accountService.getAdvances()
            setAdvances(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredAdvances = advances.filter(a =>
        a.employeeOrContractorName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Advances & Contracts</h2>
                    <p className="text-muted-foreground">Monitor partial payments and outstanding advance balances</p>
                </div>
                <Link href="/accounts/advance/create">
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <IconPlus className="h-4 w-4" />
                        Issue Advance
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Total Committed</div>
                        <div className="text-2xl font-bold mt-1">
                            {formatCurrency(advances.reduce((sum, a) => sum + a.totalAmount, 0))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Disbursed</div>
                        <div className="text-2xl font-bold mt-1">
                            {formatCurrency(advances.reduce((sum, a) => sum + a.paidAmount, 0))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Pending Dues</div>
                        <div className="text-2xl font-bold mt-1">
                            {formatCurrency(advances.reduce((sum, a) => sum + (a.dueAmount || 0), 0))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Active Entities</div>
                        <div className="text-2xl font-bold mt-1">
                            {advances.filter(a => a.status === "Pending").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <IconFileInvoice className="h-5 w-5 text-indigo-500" />
                            Advance Ledger
                        </CardTitle>
                        <div className="relative w-full sm:w-72">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
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
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Balance Due</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">Fetching advance ledger...</TableCell>
                                    </TableRow>
                                ) : filteredAdvances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No active advances found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAdvances.map((adv, index) => (
                                        <TableRow key={adv.id || index}>
                                            <TableCell className="text-xs">
                                                {adv.date ? new Date(adv.date).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell className="font-semibold text-sm">{adv.employeeOrContractorName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {adv.paymentType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(adv.totalAmount)}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(adv.paidAmount)}</TableCell>
                                            <TableCell className="text-right text-rose-600 font-bold">{formatCurrency(adv.dueAmount || 0)}</TableCell>
                                            <TableCell>
                                                <Badge variant={adv.status === "Settled" ? "default" : "outline"} className={adv.status === "Pending" ? "text-amber-600 border-amber-600" : ""}>
                                                    {adv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" disabled={adv.status === "Settled"}>
                                                    <IconWallet className="h-4 w-4" />
                                                </Button>
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
