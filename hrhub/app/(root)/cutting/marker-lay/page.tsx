"use client"

import React from "react"
import { IconScissors, IconLayout, IconMaximize, IconMinimize } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MarkerLayPlanningPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Marker & Lay Planning</h2>
                    <p className="text-muted-foreground">Optimization of fabric utilization through precise marker placement</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <IconLayout className="h-5 w-5 text-indigo-500" />
                            Active Markers
                        </CardTitle>
                        <CardDescription>Generated CAD patterns awaiting spreading</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { id: "M-102", style: "Casual Shirt L/S", width: "58\"", length: "8.5m", efficiency: "88.5%", status: "Approved" },
                            { id: "M-105", style: "Chino Pants (Olive)", width: "60\"", length: "12.2m", efficiency: "85.2%", status: "Printing" },
                        ].map((m) => (
                            <div key={m.id} className="p-4 rounded-xl border border-muted-foreground/10 bg-muted/20 hover:ring-2 hover:ring-primary/20 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-black text-sm">{m.id} - {m.style}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Width: {m.width} | Length: {m.length}
                                        </p>
                                    </div>
                                    <Badge variant={m.status === "Approved" ? "default" : "secondary"}>
                                        {m.status}
                                    </Badge>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Efficiency</span>
                                        <span className="text-sm font-black text-emerald-600">{m.efficiency}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest">
                                        View CAD
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <IconMaximize className="h-5 w-5 text-blue-500" />
                            Current Lay Spreading
                        </CardTitle>
                        <CardDescription>Floor activity monitored in real-time</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-6 rounded-2xl bg-primary/5 border-l-4 border-l-primary flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-primary">Table #04 Spreading</p>
                                <p className="text-xl font-black mt-1">Batch #554 (PO-2024)</p>
                                <p className="text-xs text-muted-foreground mt-1">Current Layer: 45 / 80 Total Plies</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-primary">56%</p>
                                <p className="text-[10px] font-bold uppercase opacity-60">Complete</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border bg-muted/10 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Active Spreading Tables</p>
                                <p className="text-2xl font-black">08</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-muted/10 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Average Lay Efficiency</p>
                                <p className="text-2xl font-black">74%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
