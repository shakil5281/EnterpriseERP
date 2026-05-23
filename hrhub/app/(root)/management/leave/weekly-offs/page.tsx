"use client"

import * as React from "react"
import { IconCalendarOff, IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { leaveService, type WeeklyOff } from "@/lib/services/leave"
import { getHttpErrorMessage } from "@/lib/api-response"
import { toast } from "sonner"
import { useCompanyContext } from "@/components/providers/company-context"
import { LeaveCompanyBar } from "@/components/leave/leave-company-bar"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function WeeklyOffsPage() {
    const { activeCompanyId } = useCompanyContext()
    const [isLoading, setIsLoading] = React.useState(false)
    const [rows, setRows] = React.useState<WeeklyOff[]>([])
    const [day, setDay] = React.useState("Friday")

    const load = React.useCallback(async () => {
        if (!activeCompanyId) return
        setIsLoading(true)
        try {
            setRows(await leaveService.listWeeklyOffs(activeCompanyId))
        } catch (e) {
            toast.error(getHttpErrorMessage(e, "Failed to load weekly offs"))
        } finally {
            setIsLoading(false)
        }
    }, [activeCompanyId])

    React.useEffect(() => {
        load()
    }, [load])

    const handleAdd = async () => {
        if (!activeCompanyId) return
        try {
            await leaveService.createWeeklyOff({ companyId: activeCompanyId, dayOfWeekName: day })
            toast.success("Weekly off added")
            load()
        } catch (e) {
            toast.error(getHttpErrorMessage(e, "Failed to add weekly off"))
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await leaveService.deleteWeeklyOff(id)
            toast.success("Removed")
            load()
        } catch (e) {
            toast.error(getHttpErrorMessage(e, "Failed to delete"))
        }
    }

    const columns: ColumnDef<WeeklyOff>[] = [
        { accessorKey: "dayOfWeekName", header: "Day" },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <LeavePermissionGate permission="WEEKLY_OFF_MANAGE">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
                        <IconTrash className="size-4 text-destructive" />
                    </Button>
                </LeavePermissionGate>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconCalendarOff className="size-7" /> Weekly Offs
            </h1>
            <LeaveCompanyBar onRefresh={load} isLoading={isLoading} showYear={false} />
            <LeavePermissionGate permission="WEEKLY_OFF_MANAGE">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Add weekly off</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1">
                            <Label>Day of week</Label>
                            <NativeSelect value={day} onChange={(e) => setDay(e.target.value)}>
                                {DAYS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </NativeSelect>
                        </div>
                        <Button className="gap-2" onClick={handleAdd}>
                            <IconPlus className="size-4" /> Add
                        </Button>
                    </CardContent>
                </Card>
            </LeavePermissionGate>
            <Card>
                <CardContent className="pt-6">
                    <DataTable columns={columns} data={rows} isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>
        </div>
    )
}
