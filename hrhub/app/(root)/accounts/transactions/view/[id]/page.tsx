"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconPrinter,
    IconFileDescription,
    IconCalendar,
    IconBuildingBank,
    IconUser,
    IconReceipt2,
    IconCurrencyTaka,
    IconHash,
    IconFileSpreadsheet
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { accountService, AccountTransaction } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function TransactionViewPage() {
    const { id } = useParams()
    const router = useRouter()
    const [tx, setTx] = useState<AccountTransaction | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            loadTransaction()
        }
    }, [id])

    const loadTransaction = async () => {
        setLoading(true)
        try {
            const res = await accountService.getTransaction(parseInt(id as string))
            setTx(res.data)
        } catch (error) {
            toast.error("Failed to load transaction details")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const exportPDF = () => {
        if (!tx?.id) return
        accountService.exportVoucherPdf(tx.id)
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Voucher_${tx.transactionNumber || tx.id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => toast.error("Failed to export PDF"))
    }

    const exportExcel = () => {
        if (!tx?.id) return
        accountService.exportVoucherExcel(tx.id)
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Voucher_${tx.transactionNumber || tx.id}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => toast.error("Failed to export Excel"))
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        )
    }

    if (!tx) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <IconFileDescription className="h-16 w-16 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold">Transaction Not Found</h3>
                <p className="text-muted-foreground">The requested transaction could not be located in our records.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    const isIncome = tx.type === "Receive"

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border shadow-sm" onClick={() => router.back()}>
                        <IconArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Transaction Voucher</h2>
                        <p className="text-muted-foreground">Detailed audit trail for voucher #{tx.transactionNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={exportPDF}>
                        <IconFileDescription className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={exportExcel}>
                        <IconFileSpreadsheet className="h-4 w-4" />
                        Export Excel
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                        <IconPrinter className="h-4 w-4" />
                        Print Voucher
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-none shadow-sm ring-1 ring-border overflow-hidden">
                    <CardHeader className={`bg-gradient-to-r ${isIncome ? 'from-emerald-500/10 to-transparent border-l-4 border-l-emerald-500' : 'from-rose-500/10 to-transparent border-l-4 border-l-rose-500'} py-4`}>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <IconReceipt2 className={`h-5 w-5 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`} />
                                Core Particulars
                            </CardTitle>
                            <Badge className={isIncome ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-rose-500/10 text-rose-700 border-rose-200"}>
                                {tx.type} Transaction
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 px-8">
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                                        <IconHash className="h-3 w-3" /> Voucher Number
                                    </Label>
                                    <p className="text-xl font-black text-indigo-600 font-mono tracking-tight">{tx.transactionNumber}</p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                                        <IconCalendar className="h-3 w-3" /> Posting Date
                                    </Label>
                                    <p className="font-semibold text-lg">{new Date(tx.transactionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                                        <IconBuildingBank className="h-3 w-3" /> Branch Allocation
                                    </Label>
                                    <p className="font-semibold text-lg">{tx.branchName || "Main Headquarters"}</p>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-6 flex flex-col justify-center items-center border border-muted-foreground/10 text-center">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Total Amount Enclosed</Label>
                                <div className="flex items-center text-4xl font-black tracking-tighter text-foreground">
                                    <span className="text-2xl text-muted-foreground mr-1 opacity-50">৳</span>
                                    {formatCurrency(tx.amount).replace('৳', '')}
                                </div>
                                <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isIncome ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                    {isIncome ? 'Funds Inward' : 'Funds Outward'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t space-y-4 pb-4">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Financial Description & Narrative</Label>
                            <p className="text-sm leading-relaxed text-muted-foreground italic font-medium">
                                "{tx.description || "No specific narrative provided for this financial entry."}"
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-border h-fit">
                    <CardHeader className="bg-muted/10 border-b py-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logistical Meta</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y text-xs">
                            <div className="flex justify-between items-center p-4">
                                <span className="font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <IconFileDescription className="h-3.5 w-3.5" /> Category
                                </span>
                                <Badge variant="secondary" className="font-bold">{tx.category || "General"}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-4">
                                <span className="font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <IconBuildingBank className="h-3.5 w-3.5" /> Fund Source
                                </span>
                                <span className="font-black text-indigo-600">{tx.fundSource}</span>
                            </div>
                            <div className="flex justify-between items-center p-4">
                                <span className="font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <IconUser className="h-3.5 w-3.5" /> Prepared By
                                </span>
                                <span className="font-bold">{tx.preparedBy || "System Administrator"}</span>
                            </div>
                            <div className="flex justify-between items-center p-4">
                                <span className="font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <IconCalendar className="h-3.5 w-3.5" /> System Timestamp
                                </span>
                                <span className="text-muted-foreground font-medium">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
