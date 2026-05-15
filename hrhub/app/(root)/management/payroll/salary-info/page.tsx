"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import {
    IconCurrencyTaka,
    IconSearch,
    IconFilter,
    IconBuildingBank,
    IconDownload,
    IconHistory,
    IconUserCircle,
    IconCreditCard,
    IconCheck,
    IconAlertCircle
} from "@tabler/icons-react"
import { type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

interface EmployeeSalaryInfo {
    id: string
    employeeId: string
    employeeName: string
    designation: string
    grade: string
    grossSalary: number
    paymentMode: "Bank" | "Cash" | "Mobile Banking"
    bankName: string
    accountNo: string
    status: "Active" | "Pending Update"
}

const mockEmployeeSalaries: EmployeeSalaryInfo[] = [
    {
        id: "1",
        employeeId: "EMP-2024-001",
        employeeName: "Abdur Rahman",
        designation: "Assistant Manager",
        grade: "Grade 02",
        grossSalary: 65000,
        paymentMode: "Bank",
        bankName: "Dutch-Bangla Bank",
        accountNo: "123.456.7890",
        status: "Active"
    },
    {
        id: "2",
        employeeId: "EMP-2024-045",
        employeeName: "Fatima Begum",
        designation: "Senior Executive",
        grade: "Grade 03",
        grossSalary: 48000,
        paymentMode: "Bank",
        bankName: "City Bank",
        accountNo: "987.654.3210",
        status: "Active"
    },
    {
        id: "3",
        employeeId: "EMP-2024-112",
        employeeName: "Sohan Ahmed",
        designation: "Junior Officer",
        grade: "Grade 04",
        grossSalary: 32000,
        paymentMode: "Cash",
        bankName: "-",
        accountNo: "-",
        status: "Pending Update"
    }
]

export default function SalaryInformationPage() {
    const columns: ColumnDef<EmployeeSalaryInfo>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.employeeId}</span>,
        },
        {
            accessorKey: "employeeName",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <IconUserCircle className="size-5 text-slate-400" />
                    </div>
                    <div>
                        <div className="font-medium text-sm">{row.original.employeeName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.original.designation}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "grade",
            header: "Grade",
            cell: ({ row }) => <Badge variant="outline" className="text-[10px] font-bold">{row.original.grade}</Badge>,
        },
        {
            accessorKey: "grossSalary",
            header: "Gross Salary",
            cell: ({ row }) => (
                <span className="font-mono font-bold text-primary">
                    ৳{row.original.grossSalary.toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "paymentMode",
            header: "Payment Mode",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    {row.original.paymentMode === "Bank" ? (
                        <IconBuildingBank className="size-3.5 text-blue-500" />
                    ) : (
                        <IconCreditCard className="size-3.5 text-amber-500" />
                    )}
                    <span className="text-xs">{row.original.paymentMode}</span>
                </div>
            ),
        },
        {
            accessorKey: "bankName",
            header: "Bank Detail",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-medium">{row.original.bankName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{row.original.accountNo}</span>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge 
                        variant={status === "Active" ? "outline" : "secondary"}
                        className={`text-[10px] gap-1 px-2 ${status === "Active" ? "border-green-500/50 text-green-600 bg-green-50" : "bg-amber-100 text-amber-600 border-amber-200"}`}
                    >
                        {status === "Active" ? <IconCheck className="size-2.5" /> : <IconAlertCircle className="size-2.5" />}
                        {status}
                    </Badge>
                )
            },
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                        <IconCurrencyTaka className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Salary Information</h1>
                        <p className="text-sm text-muted-foreground">Detailed employee compensation packages and payment settings.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <IconHistory className="size-4" />
                        History
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <IconDownload className="size-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-muted/30">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconFilter className="size-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">Advanced Search</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Employee Search</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input placeholder="Name or ID..." className="h-9 pl-9 bg-background" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Salary Grade</Label>
                            <NativeSelect className="h-9 bg-background">
                                <option>All Grades</option>
                                <option>Grade 01</option>
                                <option>Grade 02</option>
                                <option>Grade 03</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Mode</Label>
                            <NativeSelect className="h-9 bg-background">
                                <option>All Modes</option>
                                <option>Bank</option>
                                <option>Cash</option>
                                <option>Mobile Banking</option>
                            </NativeSelect>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full h-9 bg-slate-800 hover:bg-slate-700">Apply Filters</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <DataTable
                    data={mockEmployeeSalaries}
                    columns={columns}
                    showTabs={false}
                    showActions={true}
                    enableSelection={true}
                    searchKey="employeeName"
                    onEditClick={(info) => toast.info(`Editing salary info for ${info.employeeName}`)}
                />
            </div>
        </div>
    )
}
