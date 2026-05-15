"use client"

import * as React from "react"
import {
    IconCalendar,
    IconPlus,
    IconChevronLeft,
    IconChevronRight,
    IconRefresh,
    IconCircleCheck,
    IconAlertCircle,
    IconClock,
    IconTrophy
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const styles = [
    {
        id: "JK-101",
        buyer: "H&M Global",
        shipDate: "2026-03-15",
        progress: 42,
        milestones: [
            { name: "Lab Dip", start: 0, duration: 10, status: "completed" },
            { name: "Fabric Booking", start: 8, duration: 5, status: "completed" },
            { name: "Fit Sample", start: 12, duration: 8, status: "delayed" },
            { name: "PP Meeting", start: 22, duration: 3, status: "pending" },
            { name: "Production", start: 25, duration: 25, status: "pending" },
            { name: "Final QA", start: 50, duration: 5, status: "pending" },
        ]
    },
    {
        id: "TS-202",
        buyer: "Zara International",
        shipDate: "2026-04-10",
        progress: 68,
        milestones: [
            { name: "Proto Approval", start: 5, duration: 12, status: "completed" },
            { name: "Bulk Yarn", start: 15, duration: 15, status: "on-track" },
            { name: "Dyeing", start: 28, duration: 10, status: "pending" },
            { name: "Sewing", start: 40, duration: 20, status: "pending" },
        ]
    }
]

const days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i - 15)
    return d
})

export default function TACalendarPage() {
    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">T&A Calendar</h1>
                    <p className="text-sm text-muted-foreground font-medium">Order lifecycle, critical milestones and production synchronization</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-border rounded-lg text-muted-foreground"
                    >
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button className="h-10 px-6 font-semibold shadow-sm shadow-indigo-500/20 text-white">
                        <IconPlus className="size-4 mr-2" />
                        Initialize T&A
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="On-Track" value="12" icon={IconCircleCheck} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KPICard title="Critical" value="04" icon={IconAlertCircle} color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400" />
                <KPICard title="Upcoming" value="28" icon={IconClock} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" />
                <KPICard title="Health Index" value="94%" icon={IconTrophy} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" />
            </div>

            {/* Content Timeline */}
            <Card className="border border-border bg-card shadow-none overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><IconChevronLeft className="size-4" /></Button>
                        <span className="text-[11px] font-bold px-3 text-foreground uppercase tracking-tight">March - May 2026</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><IconChevronRight className="size-4" /></Button>
                    </div>
                </div>
                <ScrollArea className="h-[600px]">
                    <div className="min-w-[2400px]">
                        {/* Gantt Header */}
                        <div className="flex border-b border-border sticky top-0 bg-background z-40">
                            <div className="w-80 p-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/30 border-r border-border">
                                Style & Client
                            </div>
                            <div className="flex-1 flex h-14">
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-16 flex flex-col items-center justify-center border-r border-border text-center",
                                            day.toDateString() === new Date().toDateString() ? 'bg-indigo-500/10' : ''
                                        )}
                                    >
                                        <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className={cn(
                                            "text-xs font-bold tabular-nums",
                                            day.toDateString() === new Date().toDateString() ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                                        )}>{day.getDate()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gantt Rows */}
                        <div className="divide-y divide-border">
                            {styles.map((style, idx) => (
                                <div key={idx} className="flex hover:bg-muted/10 transition-colors">
                                    <div className="w-80 p-5 border-r border-border sticky left-0 z-30 bg-card group">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-foreground">{style.id}</span>
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">{style.progress}%</span>
                                            </div>
                                            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight">{style.buyer}</span>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-3">
                                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${style.progress}%` }} />
                                            </div>
                                            <span className="text-[9px] uppercase font-bold text-muted-foreground/60 mt-2 tracking-widest">Ship: {style.shipDate}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative h-32 py-4">
                                        {/* Milestone Bars */}
                                        {style.milestones.map((ms, msIdx) => (
                                            <div
                                                key={msIdx}
                                                className={cn(
                                                    "absolute h-7 rounded-md flex items-center px-3 text-[10px] font-bold border transition-all hover:shadow-sm cursor-default",
                                                    ms.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                                        ms.status === 'delayed' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' :
                                                            ms.status === 'on-track' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-muted border-border text-muted-foreground/60'
                                                )}
                                                style={{
                                                    left: `${(ms.start + 15) * 16 * 4 + 4}px`,
                                                    width: `${ms.duration * 16 * 4 - 8}px`,
                                                    top: `${(msIdx % 3) * 32 + 8}px`,
                                                }}
                                            >
                                                <span className="truncate uppercase tracking-tight">{ms.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-slate-200 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
                    <h3 className="text-lg font-bold text-slate-900">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
