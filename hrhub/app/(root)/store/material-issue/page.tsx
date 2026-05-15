"use client"

import * as React from "react"
import { IconPackageExport } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type MaterialIssue = {
    id: string
    department: string
    requester: string
    date: string
    itemsCount: number
    status: string
}

const columns: ColumnDef<MaterialIssue>[] = [
    {
        accessorKey: "id",
        header: "Issue ID",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
    },
    {
        accessorKey: "department",
        header: "Department",
    },
    {
        accessorKey: "requester",
        header: "Requested By",
    },
    {
        accessorKey: "date",
        header: "Date Issued",
    },
    {
        accessorKey: "itemsCount",
        header: "Items",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Issued" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

const data: MaterialIssue[] = [
    { id: "ISS-5001", department: "Cutting", requester: "John Doe", date: "Jan 29, 2026", itemsCount: 3, status: "Issued" },
    { id: "ISS-5002", department: "Sewing", requester: "Jane Smith", date: "Jan 29, 2026", itemsCount: 8, status: "Approved" },
]

export default function MaterialIssuePage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconPackageExport className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Material Issue</h1>
                    <p className="text-sm text-muted-foreground">
                        Track materials issued to production departments.
                    </p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="New Issue"
                onAddClick={() => toast.info("New Issue clicked")}
                onEditClick={(row) => toast.info(`View ${row.id}`)}
                onDelete={(row) => toast.success(`Deleted ${row.id}`)}
                showTabs={true}
            />
        </div>
    )
}
