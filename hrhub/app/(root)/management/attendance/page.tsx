"use client"

import * as React from "react"
import {
    IconFingerprint,
    IconSearch,
    IconFilter,
    IconFileTypeXls,
    IconEdit,
    IconTrash,
    IconLoader,
    IconCalendar,
    IconClock,
    IconActivity,
    IconArrowLeft,
    IconInfoCircle,
    IconDownload
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Calendar23 from "@/components/calendar-23"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AdvancedFilter } from "@/components/attendance/advanced-filter"
import { CommonFilterParams } from "@/lib/services/attendance"
import { format } from "date-fns"

// --- Types ---

type AttendanceRecord = {
    id: number
    employeeId: string
    employeeName: string
    department: string
    date: string
    checkIn: string
    checkOut: string
    status: "Present" | "Late" | "Absent" | "Half Day" | "On Leave"
    workingHours: string
}

// --- Mock Data ---

const attendanceData: AttendanceRecord[] = [
    {
        id: 1,
        employeeId: "EMP001",
        employeeName: "John Doe",
        department: "Engineering",
        date: "2026-01-28",
        checkIn: "09:00 AM",
        checkOut: "06:00 PM",
        status: "Present",
        workingHours: "9h 0m",
    },
    {
        id: 2,
        employeeId: "EMP002",
        employeeName: "Jane Smith",
        department: "HR",
        date: "2026-01-28",
        checkIn: "09:15 AM",
        checkOut: "06:00 PM",
        status: "Late",
        workingHours: "8h 45m",
    },
    {
        id: 3,
        employeeId: "EMP003",
        employeeName: "Michael Brown",
        department: "Product",
        date: "2026-01-28",
        checkIn: "-",
        checkOut: "-",
        status: "On Leave",
        workingHours: "0h",
    },
    {
        id: 4,
        employeeId: "EMP004",
        employeeName: "Emily Davis",
        department: "Design",
        date: "2026-01-28",
        checkIn: "08:50 AM",
        checkOut: "05:50 PM",
        status: "Present",
        workingHours: "9h 0m",
    },
    {
        id: 5,
        employeeId: "EMP005",
        employeeName: "Chris Wilson",
        department: "Engineering",
        date: "2026-01-28",
        checkIn: "10:30 AM",
        checkOut: "06:30 PM",
        status: "Half Day",
        workingHours: "4h 0m",
    },
]

// --- Columns ---

const columns: ColumnDef<AttendanceRecord>[] = [
    {
        accessorKey: "employeeId",
        header: "ID",
        cell: ({ row }) => <span className="font-bold text-xs tabular-nums text-muted-foreground">{row.getValue("employeeId")}</span>,
    },
    {
        accessorKey: "employeeName",
        header: "Personnel",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-black text-sm text-foreground tracking-tight">{row.getValue("employeeName")}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">{row.original.department}</span>
            </div>
        )
    },
    {
        accessorKey: "date",
        header: "Logged Date",
        cell: ({ row }) => <span className="text-xs font-bold tabular-nums text-muted-foreground">{row.getValue("date")}</span>,
    },
    {
        accessorKey: "checkIn",
        header: "Shift In",
        cell: ({ row }) => <span className="text-xs font-black text-foreground">{row.getValue("checkIn")}</span>,
    },
    {
        accessorKey: "checkOut",
        header: "Shift Out",
        cell: ({ row }) => <span className="text-xs font-black text-foreground">{row.getValue("checkOut")}</span>,
    },
    {
        accessorKey: "workingHours",
        header: "Intensity",
        cell: ({ row }) => <span className="text-xs font-black tabular-nums text-primary">{row.getValue("workingHours")}</span>,
    },
    {
        accessorKey: "status",
        header: "Protocol",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant="outline" className={cn(
                    "font-black text-[10px] uppercase h-6 px-3 rounded-full border-none shadow-sm",
                    status === "Present" ? "bg-primary text-white" :
                        status === "Absent" ? "bg-destructive text-white" :
                            "bg-muted text-muted-foreground"
                )}>
                    {status}
                </Badge>
            )
        },
    },
]

export default function AttendancePage() {
    const router = useRouter()
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>({
        date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        status: "all"
    })
    const [isLoading, setIsLoading] = React.useState(false)

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 text-center sm:text-left">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <IconFingerprint className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">Force Terminal</h1>
                        <p className="text-muted-foreground text-sm">Real-time personnel availability and movement tracking</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Button variant="outline" size="sm" className="rounded-full h-10 px-6 border-2 font-bold gap-2" onClick={() => router.push("/management/attendance/manual-entry")}>
                        <IconEdit className="size-4" />
                        Log Correction
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full h-10 px-6 border-2 font-bold gap-2 text-primary hover:bg-primary/5" onClick={() => router.push("/management/attendance/attendance-logs")}>
                        <IconActivity className="size-4" />
                        Attendance Logs
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full h-10 px-6 font-bold gap-2 text-destructive hover:bg-destructive/10" onClick={() => toast.info("Delete functionality not implemented yet")}>
                        <IconTrash className="size-4" />
                        Purge
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                <KPICard title="Forces Present" value="142" icon={IconFingerprint} subtitle="Current deployment" />
                <KPICard title="Late Units" value="12" icon={IconClock} className="text-amber-600" subtitle="Protocol variance" />
                <KPICard title="Approved Absences" value="5" icon={IconCalendar} subtitle="Administrative leaves" />
                <KPICard title="Active Gaps" value="3" icon={IconFingerprint} className="text-destructive" subtitle="Missing personnel" />
            </div>

            {/* Filter Section */}
            <div className="px-6">
                <AdvancedFilter
                    onFilterChange={(newFilters: CommonFilterParams) => {
                        if (newFilters.date) {
                            setDate(new Date(newFilters.date + "T00:00:00"))
                        }
                        setFullFilters(newFilters)
                        // In a real app, you would fetch data here
                        toast.info("Filters synchronized")
                    }}
                    initialFilters={fullFilters}
                />
            </div>

            {/* Main Table */}
            <div className="px-6 pb-6">
                <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-black uppercase tracking-tight">Deployment Registry</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase mt-1">Real-time availability matrix</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-4 py-1.5 rounded-full border border-muted-foreground/5 shadow-inner">
                                <IconInfoCircle className="size-3.5" />
                                Updated just now
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={attendanceData}
                            columns={columns}
                            showActions={false}
                            showTabs={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, className, subtitle }: any) {
    return (
        <Card className="border-none shadow-sm group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className={cn("text-3xl font-black mt-2 tracking-tighter", className)}>{value}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 flex items-center gap-1 uppercase opacity-70 italic">
                        <span className="h-1 w-1 rounded-full bg-primary/40 animate-pulse" />
                        {subtitle}
                    </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-2xl group-hover:bg-primary/10 transition-colors duration-300">
                    <Icon className="size-6 text-muted-foreground group-hover:text-primary" />
                </div>
            </CardContent>
        </Card>
    )
}
