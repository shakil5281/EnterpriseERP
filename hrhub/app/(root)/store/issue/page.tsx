"use client"

import * as React from "react"
import { IconPackageExport, IconPlus, IconPrinter } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { IssueForm } from "@/components/store/issue-form"

type IssueRecord = {
    id: string
    issueNo: string
    date: string
    department: string
    requisitionNo: string
    itemsCount: number
    status: string
}

const columns: ColumnDef<IssueRecord>[] = [
    {
        accessorKey: "issueNo",
        header: "Issue No",
        cell: ({ row }) => <div className="font-mono font-bold">{row.getValue("issueNo")}</div>,
    },
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "department",
        header: "Department/Line",
        cell: ({ row }) => <Badge variant="secondary">{row.getValue("department")}</Badge>,
    },
    {
        accessorKey: "requisitionNo",
        header: "Req. Ref",
    },
    {
        accessorKey: "itemsCount",
        header: "Items",
        cell: ({ row }) => <div className="text-center">{row.getValue("itemsCount")}</div>,
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" title="Print Challan">
                    <IconPrinter className="size-4 text-muted-foreground" />
                </Button>
            </div>
        )
    }
]

const initialData: IssueRecord[] = [
    { id: "1", issueNo: "ISS-2026-054", date: "Jan 30, 2026", department: "Sewing Line 01", requisitionNo: "REQ-112", itemsCount: 5, status: "Issued" },
    { id: "2", issueNo: "ISS-2026-053", date: "Jan 29, 2026", department: "Cutting Section", requisitionNo: "REQ-109", itemsCount: 2, status: "Issued" },
]

export default function IssuePage() {
    const [data, setData] = React.useState<IssueRecord[]>(initialData)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    const handleAddClick = () => {
        setIsSheetOpen(true)
    }

    const handleFormSubmit = (values: any) => {
        const newRecord: IssueRecord = {
            id: Math.random().toString(),
            issueNo: `ISS-2026-${Math.floor(Math.random() * 1000)}`,
            date: "Jan 30, 2026", // Mock date format
            department: values.department,
            requisitionNo: values.requisitionNo || "-",
            itemsCount: values.items.length,
            status: "Issued"
        }
        setData(prev => [newRecord, ...prev])
        toast.success("Material issued successfully")
        setIsSheetOpen(false)
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconPackageExport className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Material Issue</h1>
                        <p className="text-sm text-muted-foreground">
                            Issue materials to production lines and departments.
                        </p>
                    </div>
                </div>
                <Button onClick={handleAddClick}>
                    <IconPlus className="mr-2 size-4" />
                    New Issue
                </Button>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="New Issue"
                onAddClick={handleAddClick}
                searchKey="department"
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[700px] w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>New Material Issue</SheetTitle>
                        <SheetDescription>
                            Create issue challan based on requisition.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <IssueForm
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
