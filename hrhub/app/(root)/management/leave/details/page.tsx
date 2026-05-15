"use client"

import { IconCalendar, IconClock, IconFileText, IconUser } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sampleHistory = [
    { type: "Casual Leave", from: "2026-04-01", to: "2026-04-02", days: 2, status: "Approved" },
    { type: "Sick Leave", from: "2026-03-12", to: "2026-03-12", days: 1, status: "Approved" },
    { type: "Earn Leave", from: "2026-02-22", to: "2026-02-24", days: 3, status: "Pending" },
]

export default function LeaveDetailsPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Leave Details</h1>
                    <p className="text-sm text-muted-foreground">Simple overview of employee leave information</p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto">Edit Details</Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Employee Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem icon={IconUser} label="Employee Name" value="Shakil Ahmed" />
                        <DetailItem icon={IconFileText} label="Employee ID" value="EMP-1733" />
                        <DetailItem icon={IconCalendar} label="Department" value="Human Resource" />
                        <DetailItem icon={IconClock} label="Joined On" value="12 Jan 2024" />
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Total Leave" value="24 Days" />
                        <StatCard title="Used Leave" value="11 Days" />
                        <StatCard title="Remaining" value="13 Days" />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recent Leave History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {sampleHistory.map((item, index) => (
                                    <div key={index} className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-sm">{item.type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.from} to {item.to} ({item.days} day{item.days > 1 ? "s" : ""})
                                            </p>
                                        </div>
                                        <Badge variant={item.status === "Approved" ? "default" : "secondary"}>{item.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    )
}

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-xl font-bold">{value}</p>
            </CardContent>
        </Card>
    )
}
