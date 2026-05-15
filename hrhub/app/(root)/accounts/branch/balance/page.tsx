"use client"

import React, { useEffect, useState } from "react"
import { IconHierarchy, IconTrendingUp, IconTrendingDown, IconBuildingBank } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, Branch } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function BranchBalancePage() {
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        accountService.getBranches().then(res => {
            setBranches(res.data)
            setLoading(false)
        })
    }, [])

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Branch Balances</h2>
                    <p className="text-muted-foreground font-medium text-sm">
                        Real-time liquidity monitoring across organizational nodes
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse h-48" />
                    ))
                ) : branches.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground font-medium border rounded-lg bg-muted/20">
                        No active structural nodes found in the ledger.
                    </div>
                ) : (
                    branches.map((branch, index) => (
                        <Card key={`${branch.id}-${branch.branchName}-${index}`} className="group hover:border-primary transition-colors">
                            <CardHeader className="relative pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                                        <IconBuildingBank className="h-5 w-5" />
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${branch.isActive
                                            ? "text-emerald-600 border-emerald-600/30 bg-emerald-600/5 whitespace-nowrap"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        {branch.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4 text-lg font-semibold truncate tracking-tight">
                                    {branch.branchName}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Code: {branch.branchCode || "N/A"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Available Capital</p>
                                    <div className="text-2xl font-bold text-foreground">
                                        {formatCurrency(branch.currentBalance || 0)}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Initial Stake</span>
                                        <span className="font-medium">{formatCurrency(branch.initialBalance)}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Net Growth</span>
                                        {(branch.currentBalance! >= branch.initialBalance) ? (
                                            <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                                <IconTrendingUp className="h-3 w-3" />
                                                <span>+{((branch.currentBalance! - branch.initialBalance) / (branch.initialBalance || 1) * 100).toFixed(1)}%</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-rose-500 font-bold">
                                                <IconTrendingDown className="h-3 w-3" />
                                                <span>{((branch.currentBalance! - branch.initialBalance) / (branch.initialBalance || 1) * 100).toFixed(1)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
