"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconDownload, IconChartPie, IconCalendar, IconReportSearch } from "@tabler/icons-react"

export default function ShipmentReportPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <IconReportSearch className="size-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Shipment Report</h1>
                        <p className="text-muted-foreground">Analyze export performance, delivery timelines, and logistics costs.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconCalendar className="size-4 mr-2" />
                        This Month
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <IconDownload className="size-4 mr-2" />
                        Export Data
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                    { label: "On-Time Deliveries", value: "94.2%", color: "text-emerald-600" },
                    { label: "Delayed Batches", value: "3", color: "text-amber-600" },
                    { label: "Avg. Transit Time", value: "4.2 Days", color: "text-blue-600" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none bg-accent/5">
                        <CardContent className="pt-6">
                            <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none bg-accent/5">
                <CardHeader>
                    <CardTitle className="text-lg">Shipment Destination Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
                        <IconChartPie className="size-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground italic">Geographic distribution and carrier performance analytics will be visualized here.</p>
                        <Button variant="outline" size="sm" className="mt-4">Load Detailed Data</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
