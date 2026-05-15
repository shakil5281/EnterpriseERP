"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    IconChartLine,
    IconPlus,
    IconFilter,
    IconCurrencyTaka,
    IconSettings,
    IconSearch,
    IconEdit,
    IconTrash
} from "@tabler/icons-react"
import { type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

interface SalaryGrade {
    id: string
    gradeName: string
    basicSalary: number
    houseRent: number
    medicalAllowance: number
    transportAllowance: number
    foodAllowance: number
    totalSalary: number
    description: string
}

const mockGrades: SalaryGrade[] = [
    {
        id: "1",
        gradeName: "Grade 01",
        basicSalary: 45000,
        houseRent: 22500,
        medicalAllowance: 5000,
        transportAllowance: 3000,
        foodAllowance: 2000,
        totalSalary: 77500,
        description: "Senior Management and Technical leads"
    },
    {
        id: "2",
        gradeName: "Grade 02",
        basicSalary: 35000,
        houseRent: 17500,
        medicalAllowance: 4000,
        transportAllowance: 2500,
        foodAllowance: 2000,
        totalSalary: 61000,
        description: "Mid-level Management and Engineers"
    },
    {
        id: "3",
        gradeName: "Grade 03",
        basicSalary: 25000,
        houseRent: 12500,
        medicalAllowance: 3000,
        transportAllowance: 2000,
        foodAllowance: 2000,
        totalSalary: 44500,
        description: "Junior Staff and Associates"
    }
]

export default function SalaryGradePage() {
    const columns: ColumnDef<SalaryGrade>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "gradeName",
            header: "Grade Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <IconChartLine className="size-4 text-primary" />
                    </div>
                    <span className="font-bold text-slate-700">{row.original.gradeName}</span>
                </div>
            ),
        },
        {
            accessorKey: "basicSalary",
            header: "Basic Salary",
            cell: ({ row }) => <span className="font-mono">৳{row.original.basicSalary.toLocaleString()}</span>,
        },
        {
            accessorKey: "houseRent",
            header: "House Rent",
            cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">৳{row.original.houseRent.toLocaleString()}</span>,
        },
        {
            accessorKey: "totalSalary",
            header: "Gross Total",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-mono font-bold bg-primary/5 text-primary border-primary/10">
                    ৳{row.original.totalSalary.toLocaleString()}
                </Badge>
            ),
        },
        {
            accessorKey: "description",
            header: "Applicability",
            cell: ({ row }) => <span className="text-xs text-muted-foreground italic">{row.original.description}</span>,
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                        <IconSettings className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Salary Grades</h1>
                        <p className="text-sm text-muted-foreground">Configure pay scales and salary structures for the organization.</p>
                    </div>
                </div>
                <Button className="gap-2" onClick={() => toast.info("New grade setup modal coming soon")}>
                    <IconPlus className="size-4" />
                    Create New Grade
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Grades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">08</span>
                            <span className="text-xs text-green-600 font-medium">+1 this month</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Gross</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">৳54,200</span>
                            <span className="text-xs text-muted-foreground font-medium">across all levels</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Max Potential</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">৳145,000</span>
                            <span className="text-xs text-blue-600 font-medium">Grade 01-Special</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-muted/30">
                <CardHeader className="pb-3 border-b border-muted">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconFilter className="size-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">Structure Overview</CardTitle>
                        </div>
                        <div className="relative w-64">
                            <IconSearch className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                            <Input placeholder="Search grades..." className="h-8 pl-8 text-xs bg-background" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={mockGrades}
                        columns={columns}
                        showTabs={false}
                        showActions={true}
                        enableSelection={true}
                        searchKey="gradeName"
                        onEditClick={(grade) => toast.info(`Editing ${grade.gradeName}`)}
                        onDelete={(grade) => toast.error(`Deleting ${grade.gradeName}`)}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
