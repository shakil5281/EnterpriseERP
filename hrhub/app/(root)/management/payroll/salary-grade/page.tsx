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
import { payrollService } from "@/lib/services/payroll"
import type { SalaryStructureDto } from "@/lib/services/payroll-types"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection } from "@/lib/payroll-utils"
import { NativeSelect } from "@/components/ui/native-select"

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

function mapStructure(s: SalaryStructureDto): SalaryGrade {
    const basic = s.components.find((c) => c.componentCode === "BASIC")?.amount ?? 0
    const house = s.components.find((c) => c.componentCode === "HOUSE")?.amount ?? 0
    const medical = s.components.find((c) => c.componentCode === "MEDICAL")?.amount ?? 0
    const transport = s.components.find((c) => c.componentCode === "CONVEYANCE")?.amount ?? 0
    const food = s.components.find((c) => c.componentCode === "FOOD")?.amount ?? 0
    const total = s.components.reduce((sum, c) => sum + c.amount, 0)
    return {
        id: s.id,
        gradeName: s.structureName,
        basicSalary: basic,
        houseRent: house,
        medicalAllowance: medical,
        transportAllowance: transport,
        foodAllowance: food,
        totalSalary: total || basic + house + medical + transport + food,
        description: s.structureCode,
    }
}

export default function SalaryGradePage() {
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [companyId, setCompanyId] = React.useState("")
    const [grades, setGrades] = React.useState<SalaryGrade[]>([])

    React.useEffect(() => {
        companyService.getAll().then((c) => {
            setCompanies(c)
            if (c[0]) setCompanyId(String(c[0].id))
        })
    }, [])

    React.useEffect(() => {
        const guid = companyGuidFromSelection(companies, companyId)
        if (!guid) return
        payrollService
            .getSalaryStructures(guid)
            .then((rows) => setGrades(rows.map(mapStructure)))
            .catch(() => toast.error("Failed to load salary structures"))
    }, [companyId, companies])
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

            <div className="px-2 flex gap-4 items-end">
                <div className="space-y-1">
                    <Label>Company</Label>
                    <NativeSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="min-w-[220px]">
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.companyNameEn}</option>
                        ))}
                    </NativeSelect>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Grades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{grades.length}</span>
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
                        data={grades}
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
