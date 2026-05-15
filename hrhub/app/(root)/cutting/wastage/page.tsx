"use client"

import React from "react"
import { IconTrash, IconAlertTriangle, IconChartBar, IconFilter } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export default function WastageTrackingPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-500">Wastage Tracking</h2>
                    <p className="text-muted-foreground">Monitor fabric loss and identify optimization opportunities</p>
                </div>
                <Button variant="outline" className="gap-2 text-rose-600 border-rose-600/20 hover:bg-rose-50">
                    <IconAlertTriangle className="h-4 w-4" />
                    Flag Abnormal Loss
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Monthly Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-rose-500 tracking-tighter">3.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">+0.4% from last month</p>
                        <div className="mt-4 h-1 w-full bg-muted rounded-full">
                            <div className="h-full bg-rose-500 w-[32%]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 border-none shadow-sm bg-card/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Loss by Department/Reason</CardTitle>
                            <CardDescription>Breakdown of fabric waste contributors</CardDescription>
                        </div>
                        <IconChartBar className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { label: "End-of-Roll Bits", value: "450 Yds", pct: 45, color: "bg-rose-500" },
                            { label: "Marker Gaps", value: "280 Yds", pct: 30, color: "bg-amber-500" },
                            { label: "Quality Rejects", value: "120 Yds", pct: 15, color: "bg-orange-500" },
                            { label: "Human Error", value: "80 Yds", pct: 10, color: "bg-red-500" },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                    <span>{item.label}</span>
                                    <span className="font-mono">{item.value} ({item.pct}%)</span>
                                </div>
                                <Progress value={item.pct} className={`h-2 ${item.color.replace('bg-', '')}`} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-card/60 mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Detailed Wastage Log</CardTitle>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <IconFilter className="h-4 w-4" /> Filter Logs
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-20 text-center text-muted-foreground italic border-2 border-dashed rounded-2xl">
                        Connect to real-time scale sensors for live wastage logging.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
