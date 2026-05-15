"use client"

import React, { useEffect, useState } from "react"
import { IconPrinter, IconDownload, IconScale } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, AccountSummary } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export default function BalanceSheetPage() {
    const [summary, setSummary] = useState<AccountSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        accountService.getSummary()
            .then(res => setSummary(res.data))
            .finally(() => setLoading(false))
    }, [])

    const assets = [
        { name: "Cash in Hand", amount: summary?.totalCashBalance || 0 },
        { name: "Bank Accounts", amount: summary?.totalBankBalance || 0 },
        { name: "Employee Hand Cash", amount: summary?.totalHandCash || 0 },
    ]

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Balance Sheet</h2>
                    <p className="text-muted-foreground">Snapshot of your organization's financial position</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <IconPrinter className="h-4 w-4" />
                        Print
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <IconDownload className="h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="text-center border-b pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/5 rounded-full border border-primary/20">
                            <IconScale className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold uppercase tracking-wide">Global Balance Sheet</CardTitle>
                    <CardDescription className="text-sm font-medium">As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold border-b border-primary w-fit pb-1 text-primary">ASSETS</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Assets</p>
                                    {assets.map((asset, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-muted/50">
                                            <span className="text-muted-foreground">{asset.name}</span>
                                            <span className="font-semibold">{formatCurrency(asset.amount)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 flex justify-between items-center font-bold text-lg border-t-4 border-foreground mt-8">
                                    <span>TOTAL ASSETS</span>
                                    <span className="border-b-4 border-double border-foreground leading-none">{formatCurrency(totalAssets)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold border-b border-rose-500 w-fit pb-1 text-rose-500 uppercase">Liabilities & Equity</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Liabilities</p>
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-muted/50 text-muted-foreground italic">
                                        <span>No outstanding liabilities</span>
                                        <span>{formatCurrency(0)}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Owner's Equity</p>
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-muted/50">
                                        <span>Initial Capital Contribution</span>
                                        <span className="font-semibold">{formatCurrency(totalAssets)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between items-center font-bold text-lg border-t-4 border-foreground mt-8">
                                    <span>TOTAL LIABILITIES & EQUITY</span>
                                    <span className="border-b-4 border-double border-foreground leading-none">{formatCurrency(totalAssets)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center pb-8">
                        <div className="space-y-3">
                            <div className="h-px bg-muted-foreground/30 w-full" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Prepared By</p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-px bg-muted-foreground/30 w-full" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Accounting Manager</p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-px bg-muted-foreground/30 w-full" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Authorized Signature</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
