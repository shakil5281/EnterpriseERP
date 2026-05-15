"use client"

import React, { useEffect, useState } from "react"
import {
    IconCash,
    IconBuildingBank,
    IconReceipt,
    IconArrowsDownUp,
    IconBusinessplan,
    IconClock
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { accountService, AccountSummary } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default function AccountsDashboard() {
    const [summary, setSummary] = useState<AccountSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        accountService.getSummary()
            .then(res => setSummary(res.data))
            .catch(err => console.error("Failed to load summary", err))
            .finally(() => setLoading(false))
    }, [])

    const stats = [
        {
            title: "Cash Balance",
            value: summary?.totalCashBalance || 0,
            icon: IconCash,
            color: "text-emerald-600",
            border: "border-l-emerald-500"
        },
        {
            title: "Bank Balance",
            value: summary?.totalBankBalance || 0,
            icon: IconBuildingBank,
            color: "text-blue-600",
            border: "border-l-blue-500"
        },
        {
            title: "Hand Cash",
            value: summary?.totalHandCash || 0,
            icon: IconBusinessplan,
            color: "text-amber-600",
            border: "border-l-amber-500"
        },
        {
            title: "Today's Receive",
            value: summary?.todaysReceive || 0,
            icon: IconArrowsDownUp,
            color: "text-indigo-600",
            border: "border-l-indigo-500"
        },
        {
            title: "Today's Payment",
            value: summary?.todaysPayment || 0,
            icon: IconReceipt,
            color: "text-rose-600",
            border: "border-l-rose-500"
        },
        {
            title: "Active Advances",
            value: summary?.activeAdvances || 0,
            icon: IconClock,
            color: "text-slate-600",
            border: "border-l-slate-500"
        }
    ]

    const quickLinks = [
        { name: "Receive Entry", url: "/accounts/transactions/receive" },
        { name: "Payment Entry", url: "/accounts/transactions/payment" },
        { name: "Cash Book", url: "/accounts/cash-bank/cash-book" },
        { name: "Bank Book", url: "/accounts/cash-bank/bank-book" },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
                    <p className="text-muted-foreground">Real-time fiscal intelligence and asset monitoring</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, i) => (
                    <Card key={i} className={stat.border}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? "..." : formatCurrency(stat.value)}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">
                                Current organizational status
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-none border bg-muted/10">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <IconReceipt className="h-12 w-12 mb-3 opacity-10" />
                            <p className="text-sm font-medium">No recent transactions found in current scope.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {quickLinks.map((link) => (
                            <Link key={link.name} href={link.url}>
                                <div className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted transition-colors text-sm font-semibold border border-transparent hover:border-border cursor-pointer">
                                    {link.name}
                                    <span className="text-muted-foreground opacity-50">→</span>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
