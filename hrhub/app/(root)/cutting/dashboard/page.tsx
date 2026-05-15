"use client"

import React from "react"
import {
    IconScissors,
    IconClipboardList,
    IconBoxSeam,
    IconTexture,
    IconTrash,
    IconArrowRight
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default function CuttingDashboard() {
    const stats = [
        {
            title: "Today's Target",
            value: "5,000 Pcs",
            icon: IconClipboardList,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Total Cut Today",
            value: "4,250 Pcs",
            icon: IconScissors,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Fabric Consumed",
            value: "1,200 Yds",
            icon: IconTexture,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            title: "Wastage Rate",
            value: "2.4%",
            icon: IconTrash,
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        },
        {
            title: "Bundles Prepared",
            value: "150 Units",
            icon: IconBoxSeam,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        },
        {
            title: "Sent to Sewing",
            value: "3,800 Pcs",
            icon: IconArrowRight,
            color: "text-cyan-500",
            bg: "bg-cyan-500/10"
        }
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Cutting Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                Real-time floor status
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Recent Cutting Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground py-10 text-center">No active batches in progress.</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-none shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Floor Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {[
                            { label: "Spreading Lay #04", status: "In Progress", progress: 65 },
                            { label: "Marker Print #12", status: "Pending", progress: 0 },
                            { label: "Bundle Seq #88", status: "Completed", progress: 100 },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>{item.label}</span>
                                    <span className="text-muted-foreground">{item.status}</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
