"use client"

import * as React from "react"
import {
    IconReport,
    IconFileAnalytics,
    IconTrendingUp,
    IconChartPie,
    IconFileDownload,
    IconCalendar,
    IconFileDescription,
    IconChartBar,
    IconArrowRight,
    IconStar,
    IconMail
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function MerchandisingReportsPage() {
    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconReport className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Merchandising Reports</h1>
                        <p className="text-muted-foreground text-sm">Analytics and performance insights</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <IconCalendar className="size-4" />
                        Custom Range
                    </Button>
                    <Button size="sm" className="gap-2">
                        <IconFileAnalytics className="size-4" />
                        Generate BI
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
                <KPICard
                    title="Order Profitability"
                    value="+14.2%"
                    icon={IconTrendingUp}
                    color="text-emerald-600"
                    bgColor="bg-emerald-100"
                />
                <KPICard
                    title="Lead Time Compliance"
                    value="92.4%"
                    icon={IconStar}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Wastage Variance"
                    value="-0.8%"
                    icon={IconChartBar}
                    color="text-indigo-600"
                    bgColor="bg-indigo-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
                <Card className="lg:col-span-2 border-none shadow-sm h-full">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Standard Reports</CardTitle>
                        <CardDescription>Industry standard analytical views</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                        {[
                            { title: "Executive Style Summary", desc: "Consolidated view of all active styles with FOB and margins.", icon: IconFileDescription },
                            { title: "Order Follow-up Report", desc: "Daily tracking of PO milestones vs T&A commitments.", icon: IconFileAnalytics },
                            { title: "Fabric Procurement Health", desc: "Detailed status of all open grey and finished fabric bookings.", icon: IconChartPie },
                            { title: "Shipment & Logistics Log", desc: "Forwarder performance and container utilization metrics.", icon: IconFileDownload },
                            { title: "Consumption Audit", desc: "Comparison of planned vs actual fabric usage per floor.", icon: IconChartBar }
                        ].map((rep, i) => (
                            <div key={i} className="p-4 rounded-xl border hover:bg-muted/30 transition-colors cursor-pointer group flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <rep.icon className="size-5" />
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><IconFileDownload className="size-4" /></Button>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{rep.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{rep.desc}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden">
                        <CardContent className="p-6">
                            <IconChartPie className="size-10 mb-4 opacity-80" />
                            <h3 className="text-xl font-bold">Dynamic BI Builder</h3>
                            <p className="text-primary-foreground/80 text-sm mt-2 leading-relaxed">Create custom pivot charts and dashboards for your department.</p>
                            <Button variant="secondary" className="mt-6 w-full font-bold h-10 gap-2">
                                Start Building
                                <IconArrowRight className="size-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Scheduled Emails</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[
                                { name: "Daily Morning Digest", time: "08:30 AM", recipient: "Managers" },
                                { name: "Weekly Shipment Wrap", time: "Friday, 04:00 PM", recipient: "Logistics Team" }
                            ].map((sch, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                                        <IconMail className="size-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{sch.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{sch.time} • To {sch.recipient}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="pt-4 px-4 pb-4">
                            <Button variant="ghost" className="w-full text-xs font-bold h-8 text-primary">Manage Schedules</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className={cn("text-2xl font-bold mt-1", color)}>{value}</h3>
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-6" />
                </div>
            </CardContent>
        </Card>
    )
}
