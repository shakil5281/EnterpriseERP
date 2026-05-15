"use client"

import * as React from "react"
import { IconArrowsExchange, IconArrowRight, IconCheck, IconX, IconEye } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

type MigrationRecord = {
    id: number
    employeeId: string
    employeeName: string
    avatar?: string
    type: "Transfer" | "Promotion" | "Shift Change"
    source: string
    destination: string
    requestDate: string
    effectiveDate: string
    status: "Pending" | "Approved" | "Rejected"
}

const migrationData: MigrationRecord[] = [
    {
        id: 1,
        employeeId: "EMP001",
        employeeName: "John Doe",
        type: "Promotion",
        source: "Senior Dev",
        destination: "Team Lead",
        requestDate: "2023-10-01",
        effectiveDate: "2023-11-01",
        status: "Pending",
    },
    {
        id: 2,
        employeeId: "EMP005",
        employeeName: "David Wilson",
        type: "Transfer",
        source: "Engineering",
        destination: "Product",
        requestDate: "2023-09-20",
        effectiveDate: "2023-10-01",
        status: "Approved",
    },
    {
        id: 3,
        employeeId: "EMP023",
        employeeName: "Sarah Connor",
        type: "Shift Change",
        source: "Morning Slot",
        destination: "Evening Slot",
        requestDate: "2023-10-05",
        effectiveDate: "2023-10-10",
        status: "Rejected",
    },
    {
        id: 4,
        employeeId: "EMP012",
        employeeName: "Michael Scott",
        type: "Transfer",
        source: "Scranton Branch",
        destination: "Corporate",
        requestDate: "2023-10-12",
        effectiveDate: "2023-11-01",
        status: "Pending",
    },
]

const columns: ColumnDef<MigrationRecord>[] = [
    {
        id: "sl",
        header: "SL",
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
    },
    {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={row.original.avatar} alt={row.original.employeeName} />
                    <AvatarFallback>{row.original.employeeName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.employeeId}</span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const type = row.getValue("type") as string;
            let variant: "default" | "secondary" | "outline" = "outline";
            if (type === 'Promotion') variant = 'default';
            if (type === 'Transfer') variant = 'secondary';

            return <Badge variant={variant} className="font-normal">{type}</Badge>
        }
    },
    {
        id: "migration",
        header: "Migration Details",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{row.original.source}</span>
                <IconArrowRight className="size-3 text-muted-foreground/50" />
                <span className="font-medium">{row.original.destination}</span>
            </div>
        ),
    },
    {
        accessorKey: "effectiveDate",
        header: "Effective Date",
        cell: ({ row }) => {
            return <span className="text-sm font-variant-numeric text-muted-foreground">{row.getValue("effectiveDate")}</span>;
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
            if (status === "Approved") variant = "default" // Using default (primary color) for Success-like look in this theme, or could use specific custom class
            if (status === "Rejected") variant = "destructive"
            if (status === "Pending") variant = "secondary" // Yellow/Warning usually, but secondary fits pending

            // Custom styling for "Approved" to be green if default isn't green typically, but shadcn default is black/white.
            // Let's stick to badges provided. 
            // We can also use direct classes for specific colors.
            let className = "";
            if (status === "Approved") className = "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400";
            if (status === "Pending") className = "bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400";

            return <Badge variant={status === "Rejected" ? "destructive" : "secondary"} className={className}>{status}</Badge>
        },
    },
    {
        id: "row-actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
            <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => toast.info(`Viewing details for ${row.original.employeeName}`)}>
                    <IconEye className="size-4 text-muted-foreground" />
                </Button>
                {row.original.status === "Pending" && (
                    <>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => toast.success(`Approved ${row.original.type} for ${row.original.employeeName}`)}>
                            <IconCheck className="size-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => toast.error(`Rejected ${row.original.type} for ${row.original.employeeName}`)}>
                            <IconX className="size-4 text-destructive" />
                        </Button>
                    </>
                )}
            </div>
        )
    }
]

export default function MigrationPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconArrowsExchange className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Migration & Transfers</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage employee position changes, transfers, and internal movements.
                    </p>
                </div>
            </div>

            <DataTable
                data={migrationData}
                columns={columns}
                addLabel="New Migration"
                onAddClick={() => toast.info("New Migration Requested")}
                onEditClick={(row) => toast.info(`Edit Migration for ${row.employeeName}`)}
                onDelete={(row) => toast.success(`Migration record deleted`)}
                showTabs={true}
            />
        </div>
    )
}
