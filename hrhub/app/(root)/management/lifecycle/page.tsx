"use client"

import * as React from "react"
import {
    IconUserPlus,
    IconUserCheck,
    IconRefresh,
    IconUserMinus,
    IconDotsVertical,
    IconSearch,
    IconFilter,
    IconCircleCheck,
    IconCircleX,
    IconClock,
    IconTrendingUp,
    IconCalendarEvent,
    IconArrowRight,
    IconMail
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const STAGES = [
    { id: "onboarding", name: "Onboarding", icon: IconUserPlus, color: "text-blue-500", bg: "bg-blue-500/10", count: 12, progress: 65 },
    { id: "probation", name: "Probation", icon: IconClock, color: "text-amber-500", bg: "bg-amber-500/10", count: 8, progress: 40 },
    { id: "review", name: "Annual Review", icon: IconRefresh, color: "text-indigo-500", bg: "bg-indigo-500/10", count: 24, progress: 90 },
    { id: "offboarding", name: "Offboarding", icon: IconUserMinus, color: "text-rose-500", bg: "bg-rose-500/10", count: 3, progress: 20 },
]

const RECENT_EMPLOYEES = [
    { id: 1, name: "Sarah Jenkins", role: "Product Designer", stage: "Onboarding", days: 3, avatar: "SJ", progress: 75 },
    { id: 2, name: "Michael Chen", role: "Frontend Developer", stage: "Probation", days: 45, avatar: "MC", progress: 50 },
    { id: 3, name: "Jessica Williams", role: "HR Manager", stage: "Review", days: 365, avatar: "JW", progress: 10 },
    { id: 4, name: "David Miller", role: "Backend Engineer", stage: "Offboarding", days: 1200, avatar: "DM", progress: 95 },
]

export default function LifecyclePage() {
    return (
        <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Employee Lifecycle
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage every stage of your employees' journey from hire to retire.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <IconRefresh className="mr-2 size-4" />
                        Sync Data
                    </Button>
                    <Button size="sm" className="shadow-lg shadow-primary/20">
                        <IconUserPlus className="mr-2 size-4" />
                        Initiate Lifecycle
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAGES.map((stage) => (
                    <Card key={stage.id} className="relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                            <div className={`${stage.bg} ${stage.color} p-2 rounded-lg`}>
                                <stage.icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stage.count}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Progress value={stage.progress} className="h-1" />
                                <span className="text-[10px] font-medium text-muted-foreground">{stage.progress}%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                <IconTrendingUp className="size-3 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">+12%</span> from last month
                            </p>
                        </CardContent>
                        {/* Decorative background icon */}
                        <stage.icon className="absolute -right-4 -bottom-4 size-24 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content: Lifecycle Management */}
                <Card className="xl:col-span-2 border-none bg-accent/5 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Active Lifecycle Cases</CardTitle>
                                <CardDescription>Currently monitoring {RECENT_EMPLOYEES.length} active employee transitions.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input placeholder="Search employee..." className="pl-9 h-9 w-[200px] lg:w-[300px]" />
                                </div>
                                <Button variant="outline" size="icon" className="size-9">
                                    <IconFilter className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="grid gap-4 mt-6">
                            {RECENT_EMPLOYEES.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background rounded-xl border hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-12 border-2 border-muted group-hover:border-primary/20 transition-colors">
                                            <AvatarFallback className="bg-primary/5 text-primary font-bold">{emp.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-semibold text-base">{emp.name}</h4>
                                            <p className="text-xs text-muted-foreground">{emp.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 mt-4 md:mt-0">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <span>Stage Progress</span>
                                                <span>{emp.progress}%</span>
                                            </div>
                                            <Progress value={emp.progress} className="h-1.5" />
                                        </div>

                                        <div className="hidden lg:flex flex-col items-center px-4 border-l border-r border-dashed">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Stage</span>
                                            <Badge variant="outline" className="mt-1 bg-accent/50 text-[10px] font-bold">
                                                {emp.stage}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Duration</span>
                                            <span className="text-sm font-medium">{emp.days} Days</span>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <IconDotsVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <IconUserCheck className="mr-2 size-4 text-blue-500" />
                                                    View Timeline
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <IconMail className="mr-2 size-4 text-indigo-500" />
                                                    Send Reminder
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-rose-500">
                                                    <IconCircleX className="mr-2 size-4" />
                                                    Stop Process
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="px-0 pt-6">
                        <Button variant="ghost" className="w-full border-2 border-dashed border-muted hover:border-primary/20 hover:bg-transparent h-12">
                            View All Lifecycle Records
                            <IconArrowRight className="ml-2 size-4" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Sidebar: Insights & Timeline */}
                <div className="space-y-8">
                    {/* Lifecycle Insight Card */}
                    <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <IconCalendarEvent className="size-5 text-primary" />
                                Upcoming Transitions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            {[
                                { name: "Robert Fox", event: "Probation End", date: "Feb 02", type: "probation" },
                                { name: "Bessie Cooper", event: "Annual Review", date: "Feb 05", type: "review" },
                                { name: "Arlene McCoy", event: "Exit Interview", date: "Feb 08", type: "offboarding" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/10">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{item.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">{item.event}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-black h-6">{item.date}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Timeline / Activity Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Global Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                                {[
                                    { title: "Onboarding Started", user: "Wade Warren", time: "2 hours ago", color: "bg-blue-500" },
                                    { title: "Probation Cleared", user: "Guy Hawkins", time: "5 hours ago", color: "bg-emerald-500" },
                                    { title: "Resignation Submitted", user: "Eleanor Pena", time: "Yesterday", color: "bg-rose-500" },
                                    { title: "Review Scheduled", user: "Kathryn Murphy", time: "2 days ago", color: "bg-indigo-500" },
                                ].map((activity, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between gap-4 pl-8 group">
                                        <div className={`absolute left-0 size-8 rounded-full border-4 border-background ${activity.color} flex items-center justify-center -translate-x-1/2`}>
                                            <IconClock className="size-3 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-none">{activity.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{activity.user}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase min-w-fit">{activity.time}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Metric Card */}
                    <div className="p-6 rounded-3xl bg-slate-950 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Average Retention</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black">94.2%</span>
                                <span className="text-emerald-400 text-xs font-bold mb-1.5 flex items-center">
                                    <IconTrendingUp className="size-3 mr-0.5" />
                                    +2.1%
                                </span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-4 leading-relaxed font-medium">
                                Your organization's retention rate has outperformed industry standards by <span className="text-slate-300">8.4%</span> this quarter.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <div className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 text-[10px] font-bold">Top Talent: 100%</div>
                                <div className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 text-[10px] font-bold">New Grads: 88%</div>
                            </div>
                        </div>
                        {/* Abstract background blobs */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-40 bg-primary/20 blur-[80px] rounded-full" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 size-32 bg-indigo-500/10 blur-[60px] rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
