"use client"

import {
    IconBuildingFactory2,
    IconActivity,
    IconAlertTriangle,
    IconChecklist,
    IconTrendingUp,
    IconTrendingDown,
    IconArrowRight,
    IconPlus,
    IconFileAnalytics,
    IconSettings
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductionOverviewChart } from "@/components/production/production-overview-chart"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ProductionDashboard() {
    return (
        <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Production Dashboard</h1>
                    <p className="text-muted-foreground">Overview of production activities and key performance indicators.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <IconFileAnalytics className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                    <Button size="sm">
                        <IconPlus className="mr-2 h-4 w-4" />
                        New Entry
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <IconActivity className="h-16 w-16 text-primary/10 -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Output</CardTitle>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none">+20.1%</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">15,231</div>
                        <p className="text-xs text-muted-foreground mt-1">Units produced this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Lines</CardTitle>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none">Optimal</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12/14</div>
                        <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[85%]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">85% operational capacity</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Downtime</CardTitle>
                        <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-none">-15%</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2h 14m</div>
                        <p className="text-xs text-muted-foreground mt-1">Total downtime today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">QA Pass Rate</CardTitle>
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground shadow-none">98.5%</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.5%</div>
                        <p className="text-xs text-muted-foreground mt-1">Target: 99.0%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                {/* Main Chart */}
                <div className="xl:col-span-2">
                    <ProductionOverviewChart />
                </div>

                {/* Right Column: Alerts & Quick Actions */}
                <div className="space-y-4 md:space-y-8">
                    {/* Recent Activity / Alerts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest alerts and status updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                <IconAlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Line 3 Maintenance Required</p>
                                    <p className="text-xs text-muted-foreground">Hydraulic pressure fluctuation detected.</p>
                                    <p className="text-[10px] text-muted-foreground pt-1">10 mins ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                <IconChecklist className="h-5 w-5 text-emerald-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Batch #4092 Completed</p>
                                    <p className="text-xs text-muted-foreground">2,500 units moved to packaging.</p>
                                    <p className="text-[10px] text-muted-foreground pt-1">1 hour ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                <IconTrendingDown className="h-5 w-5 text-rose-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Efficiency Drop on Line 1</p>
                                    <p className="text-xs text-muted-foreground">Operator break extended.</p>
                                    <p className="text-[10px] text-muted-foreground pt-1">2 hours ago</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Access */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Access</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Link href="/production/daily-report">
                                <Button variant="ghost" className="w-full justify-start">
                                    <IconFileAnalytics className="mr-2 h-4 w-4" />
                                    Daily Reports
                                    <IconArrowRight className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </Link>
                            <Link href="/production/line-assign">
                                <Button variant="ghost" className="w-full justify-start">
                                    <IconSettings className="mr-2 h-4 w-4" />
                                    Line Assignments
                                    <IconArrowRight className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
