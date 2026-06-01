"use client"

import * as React from "react"
import {
    IconFileText,
    IconPrinter,
    IconDownload,
    IconCircleCheck,
    IconClock,
    IconAlertCircle,
    IconEye,
    IconUser,
    IconBriefcase,
    IconInfoCircle,
    IconPlus,
    IconActivity
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AdvancedFilter } from "@/components/attendance/advanced-filter"
import { CommonFilterParams } from "@/lib/services/attendance"
import { format } from "date-fns"

// --- Data Type ---
interface JobCardRecord {
    id: string
    name: string
    department: string
    designation: string
    month: string
    present: number
    absent: number
    late: number
    ot: string
    status: "Verified" | "Pending" | "Review"
    image: string
}

// --- Mock Data ---
const MOCK_DATA: JobCardRecord[] = [
    {
        id: "EMP1024",
        name: "Sarah Wilson",
        department: "Engineering",
        designation: "Software Engineer",
        month: "January 2026",
        present: 22,
        absent: 1,
        late: 2,
        ot: "12h",
        status: "Verified",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
        id: "EMP1025",
        name: "Michael Ross",
        department: "Marketing",
        designation: "Sales Lead",
        month: "January 2026",
        present: 20,
        absent: 3,
        late: 0,
        ot: "5h",
        status: "Pending",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
        id: "EMP1026",
        name: "Emma Thompson",
        department: "HR",
        designation: "HR Manager",
        month: "January 2026",
        present: 23,
        absent: 0,
        late: 1,
        ot: "0h",
        status: "Verified",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
    },
    {
        id: "EMP1027",
        name: "David Miller",
        department: "Engineering",
        designation: "DevOps Engineer",
        month: "January 2026",
        present: 21,
        absent: 2,
        late: 5,
        ot: "20h",
        status: "Review",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
    },
    {
        id: "EMP1028",
        name: "Sophia Garcia",
        department: "Sales",
        designation: "Account Manager",
        month: "January 2026",
        present: 19,
        absent: 4,
        late: 2,
        ot: "8h",
        status: "Verified",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia"
    }
]

// --- Table Columns ---
const columns: ColumnDef<JobCardRecord>[] = [
    {
        accessorKey: "name",
        header: "Personnel",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar className="size-8 rounded-lg shadow-inner ring-1 ring-black/5">
                    <AvatarImage src={row.original.image} />
                    <AvatarFallback className="font-bold">{row.original.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tight text-foreground">{row.original.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">{row.original.id}</span>
                </div>
            </div>
        )
    },
    {
        accessorKey: "department",
        header: "Unit",
        cell: ({ row }) => (
            <span className="text-xs font-bold text-muted-foreground uppercase">{row.original.department}</span>
        )
    },
    {
        accessorKey: "month",
        header: "Period",
        cell: ({ row }) => (
            <span className="text-xs font-black tabular-nums text-foreground">{row.original.month}</span>
        )
    },
    {
        id: "stats",
        header: "Metrics (P/A/L)",
        cell: ({ row }) => (
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-primary tabular-nums">{row.original.present}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground italic opacity-50">Pres</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-destructive tabular-nums">{row.original.absent}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground italic opacity-50">Abs</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-orange-600 tabular-nums">{row.original.late}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground italic opacity-50">Late</span>
                </div>
            </div>
        )
    },
    {
        accessorKey: "ot",
        header: "OT Logic",
        cell: ({ row }) => (
            <Badge variant="outline" className="bg-primary/10 text-primary border-none font-black text-[10px] h-6 px-3">
                {row.original.ot}
            </Badge>
        )
    },
    {
        accessorKey: "status",
        header: "Protocol",
        cell: ({ row }) => {
            const status = row.original.status
            return (
                <Badge variant="outline" className={cn(
                    "font-black text-[10px] uppercase h-7 px-3 rounded-full border-none shadow-sm",
                    status === "Verified" && "bg-primary text-white",
                    status === "Pending" && "bg-amber-500 text-white",
                    status === "Review" && "bg-blue-600 text-white"
                )}>
                    {status}
                </Badge>
            )
        }
    }
]

export default function JobCardListPage() {
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>({
        date: format(new Date(), "yyyy-MM-01"),
        status: "all"
    })

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 text-center sm:text-left">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconFileText className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter">Tactical Cards</h1>
                        <p className="text-muted-foreground text-sm">Consolidated monthly performance and audit logs</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Button variant="outline" size="sm" className="rounded-full h-10 px-6 border-2 font-bold gap-2">
                        <IconDownload className="size-4" />
                        Export
                    </Button>
                    <Button size="sm" className="rounded-full h-10 px-6 font-bold gap-2 bg-primary shadow-lg shadow-primary/20 text-white uppercase tracking-tighter">
                        <IconPrinter className="size-4" />
                        Print All
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="px-6">
                <AdvancedFilter
                    onFilterChange={setFullFilters}
                    initialFilters={fullFilters}
                    showMonth={true}
                    showDate={false}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 px-6">
                <StatCard title="Serialized Assets" value="1,284" icon={IconFileText} subtitle="Active registry" />
                <StatCard title="Audit Pending" value="12" icon={IconClock} className="text-destructive" subtitle="Verification Required" />
                <StatCard title="Billing Cycle" value="Jan 2026" icon={IconPlus} className="text-primary" subtitle="Current Node" />
            </div>

            {/* Main Content */}
            <div className="px-6">
                <Card className="border-none shadow-sm overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-black uppercase tracking-tight">Personnel Registry</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase mt-1 opacity-60">Verified attendance matrices</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-4 py-1.5 rounded-full border border-muted-foreground/5 shadow-inner">
                                <IconActivity className="size-3.5" />
                                Monitoring active
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={MOCK_DATA}
                            columns={columns}
                            searchKey="name"
                            addLabel="New Card"
                            showTabs={true}
                            tabs={[
                                { label: "Total Unit", value: "all" },
                                { label: "Engine", value: "Engineering" },
                                { label: "Growth", value: "Marketing" },
                                { label: "Ops", value: "HR" },
                            ]}
                            filterKey="department"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, className, subtitle }: any) {
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
