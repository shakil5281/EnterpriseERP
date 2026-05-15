"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconDownload, IconFileAnalytics, IconCalendar } from "@tabler/icons-react"

export default function DailyFinishingReportPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                        <IconFileAnalytics className="size-6 text-pink-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Finishing Report</h1>
                        <p className="text-muted-foreground">Comprehensive daily overview of finishing productivity and quality metrics.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconCalendar className="size-4 mr-2" />
                        April 29, 2026
                    </Button>
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
                        <IconDownload className="size-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Finished", value: "2,450", color: "text-blue-600" },
                    { label: "Ironing Done", value: "2,120", color: "text-orange-600" },
                    { label: "Packed Today", value: "1,890", color: "text-indigo-600" },
                    { label: "Efficiency", value: "92%", color: "text-green-600" },
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
                    <CardTitle className="text-lg">Productivity Chart (Placeholder)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
                        <p className="text-muted-foreground italic">Chart visualization will be implemented here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
