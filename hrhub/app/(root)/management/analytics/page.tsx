"use client"

import * as React from "react"
import {
    IconChartBar,
    IconTrendingUp,
    IconUsers,
    IconTarget,
    IconCalendar,
    IconDownload,
    IconFilter,
    IconArrowUpRight,
    IconArrowDownRight,
    IconInfoCircle,
    IconHierarchy,
    IconReportAnalytics,
    IconBuildingSkyscraper,
    IconUserCheck,
    IconBriefcase,
    IconActivity
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// --- Mock Data ---

const AREA_DATA = [
    { month: "Jan", output: 4000, target: 4400 },
    { month: "Feb", output: 3000, target: 4200 },
    { month: "Mar", output: 2000, target: 4000 },
    { month: "Apr", output: 2780, target: 3900 },
    { month: "May", output: 1890, target: 3800 },
    { month: "Jun", output: 2390, target: 4000 },
    { month: "Jul", output: 3490, target: 4100 },
]

const DEPT_DATA = [
    { name: "Engineering", value: 45, color: "var(--primary)" },
    { name: "Marketing", value: 15, color: "#6366f1" },
    { name: "Sales", value: 20, color: "#a855f7" },
    { name: "Support", value: 10, color: "#ec4899" },
    { name: "HR/Ops", value: 10, color: "#f43f5e" },
]

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">

            {/* 1. Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Workforce Analytics</h1>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                        Comprehensive audit of your organization's human capital performance.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select defaultValue="30d">
                        <SelectTrigger className="w-[130px] h-9">
                            <IconCalendar className="mr-2 size-4 text-muted-foreground" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="1y">Full Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="hidden sm:flex h-9">
                        <IconFilter className="mr-2 size-4" />
                        Filter
                    </Button>
                    <Button size="sm" className="h-9">
                        <IconDownload className="mr-2 size-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* 2. KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Headcount"
                    value="1,284"
                    trend="+4.2%"
                    positive
                    description="12 New hires this month"
                    icon={IconUsers}
                    className="text-blue-600"
                />
                <KPICard
                    title="Turnover Rate"
                    value="2.14%"
                    trend="-0.5%"
                    positive
                    description="Industry avg: 4.8%"
                    icon={IconUserCheck}
                    className="text-emerald-600"
                />
                <KPICard
                    title="Open Positions"
                    value="42"
                    trend="+8"
                    negative={false}
                    description="6 High-priority roles"
                    icon={IconBriefcase}
                    className="text-amber-600"
                />
                <KPICard
                    title="Target Achievement"
                    value="94.2%"
                    trend="-1.2%"
                    negative
                    description="Critical projects delayed"
                    icon={IconTarget}
                    className="text-rose-600"
                />
            </div>

            {/* 3. Main Chart Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Workforce Output Trend */}
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Productivity Trends</CardTitle>
                        <CardDescription>Daily output vs target benchmarks</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={AREA_DATA}>
                                <defs>
                                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "4 4" }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        <span className="text-muted-foreground">Actual:</span>
                                                        <span className="font-bold text-primary">${payload[0].value}</span>
                                                        <span className="text-muted-foreground">Target:</span>
                                                        <span className="font-medium">${payload[1].value}</span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="target"
                                    stroke="var(--muted-foreground)"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fill="transparent"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="output"
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorOutput)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Right Column Mix */}
                <div className="space-y-6">
                    {/* Department Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Dept. Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={DEPT_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {DEPT_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                        <span className="font-medium">{payload[0].name}: </span>
                                                        <span>{payload[0].value}%</span>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-4 pt-0">
                            <div className="grid grid-cols-2 w-full gap-y-2 gap-x-4">
                                {DEPT_DATA.slice(0, 4).map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Quick Insight Card - Simplified */}
                    <Card className="bg-slate-900 text-white border-none">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 text-blue-400 mb-3">
                                <IconInfoCircle className="size-5" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Efficiency Insight</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2">
                                Productivity is up <span className="text-emerald-400">12%</span> in Eng. Dept.
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                High correlation found between updated toolsets and output benchmarks this quarter.
                            </p>
                            <Button variant="outline" size="sm" className="w-full border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white">
                                View Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 4. Detailed Table / List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Talent Performance Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Performance Audit</CardTitle>
                                <CardDescription>Top performing divisions</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: "Frontend Core", score: 98, trend: "+2", color: "bg-primary" },
                            { name: "Enterprise Sales", score: 92, trend: "-1", color: "bg-indigo-500" },
                            { name: "Backend Infrastructure", score: 89, trend: "+4", color: "bg-emerald-500" },
                            { name: "Customer Experience", score: 85, trend: "0", color: "bg-amber-500" },
                        ].map((div) => (
                            <div key={div.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div className="flex gap-3 items-center">
                                    <div className={cn("size-9 rounded-md flex items-center justify-center text-white font-bold text-sm", div.color)}>
                                        {div.score}
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium">{div.name}</h5>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {div.trend.startsWith('+') ? <IconArrowUpRight className="size-3 text-emerald-600" /> : <IconArrowDownRight className="size-3 text-rose-600" />}
                                            <span className={cn("text-xs font-medium", div.trend.startsWith('+') ? "text-emerald-600" : "text-rose-600")}>
                                                {div.trend}% vs Target
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Score</span>
                                    <Progress value={div.score} className="w-20 h-1.5" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Organizational Health */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Organizational Health</CardTitle>
                        <CardDescription>Workforce balance metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <HealthStat
                            label="Manager Span"
                            value="1:8"
                            description="Healthy ratio"
                            icon={IconBuildingSkyscraper}
                            status="success"
                        />
                        <HealthStat
                            label="Avg. Tenure"
                            value="3.2y"
                            description="+0.4y Increase"
                            icon={IconCalendar}
                            status="warning"
                        />
                        <HealthStat
                            label="Skill Gap"
                            value="14%"
                            description="In Cloud/AI roles"
                            icon={IconTrendingUp}
                            status="error"
                        />
                        <HealthStat
                            label="Remote %"
                            value="82%"
                            description="Stable distribution"
                            icon={IconReportAnalytics}
                            status="success"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// --- Subcomponents ---

function KPICard({ title, value, trend, positive, negative, description, icon: Icon, className }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <div className={cn("p-2 rounded-lg bg-muted/50", className)}>
                        <Icon className="size-4" />
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge
                            variant={positive ? "outline" : negative ? "destructive" : "secondary"}
                            className={cn(
                                "h-5 px-1.5 text-[10px] font-medium border-0",
                                positive ? "bg-emerald-50 text-emerald-700" : negative ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"
                            )}
                        >
                            {trend}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function HealthStat({ label, value, description, icon: Icon, status }: any) {
    const statusColors = {
        success: "text-emerald-500",
        warning: "text-amber-500",
        error: "text-rose-500"
    }

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
            <div className="p-2 bg-muted/50 rounded-md mt-0.5">
                <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
                <div className="text-lg font-bold leading-none">{value}</div>
                <div className="text-sm font-medium mt-1">{label}</div>
                <div className={cn("text-xs mt-1 font-medium", statusColors[status as keyof typeof statusColors])}>
                    {description}
                </div>
            </div>
        </div>
    )
}
