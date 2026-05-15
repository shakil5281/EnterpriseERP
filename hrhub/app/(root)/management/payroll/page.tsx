"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCash } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns"

export default function PayrollPage() {
    const nextPayDay = startOfMonth(addMonths(new Date(), 1))

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1 px-6">
                <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
                <p className="text-muted-foreground text-sm">Overview of payroll activities and status</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 px-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Next Pay Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{format(nextPayDay, "MMMM d, yyyy")}</div>
                        <p className="text-sm text-muted-foreground mt-1">Scheduled Date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Payroll Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Processing Progress</span>
                            <span className="font-medium">75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                    </CardContent>
                </Card>
            </div>

            <div className="px-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Payroll Summary - {format(new Date(), "MMMM yyyy")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Gross Salary</p>
                                <p className="text-2xl font-bold">৳1,25,000</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Deductions</p>
                                <p className="text-2xl font-bold text-rose-600">৳12,500</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Net Salary</p>
                                <p className="text-2xl font-bold text-emerald-600">৳1,12,500</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Employees Paid</p>
                                <p className="text-2xl font-bold">142 / 145</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
