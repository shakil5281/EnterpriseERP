"use client"

import * as React from "react"
import { IconWalk } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export default function MovementPage() {
    const columns: ColumnDef<any>[] = [
        { accessorKey: "date", header: "Date" },
        { accessorKey: "employeeName", header: "Employee" },
        { accessorKey: "type", header: "Type" },
        { accessorKey: "location", header: "Location/Reason" },
        { accessorKey: "outTime", header: "Out Time" },
        { accessorKey: "inTime", header: "In Time" },
    ]

    const data = [
        { id: "1", date: "2024-05-20", employeeName: "Mike Ross", type: "Official", location: "Client Meeting", outTime: "10:00 AM", inTime: "02:00 PM" },
        { id: "2", date: "2024-05-20", employeeName: "Rachel Zane", type: "Personal", location: "Bank", outTime: "01:00 PM", inTime: "02:00 PM" },
    ]

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex items-center gap-2 mb-1">
                <IconWalk className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Movement Register</h1>
            </div>
            <p className="text-muted-foreground">Track employee movements during working hours.</p>
            <DataTable columns={columns} data={data} showColumnCustomizer={false} />
        </div>
    )
}
