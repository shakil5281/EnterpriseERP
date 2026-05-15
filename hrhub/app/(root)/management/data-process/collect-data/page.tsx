"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { companyService, Company as ICompany } from "@/lib/services/company"
import { NativeSelect } from "@/components/ui/native-select"
import {
    IconBuilding,
    IconCloudDownload,
    IconDeviceDesktop,
    IconRefresh,
    IconSearch,
    IconCalendarEvent,
    IconHistory
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { attendanceService } from "@/lib/services/attendance"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"

interface AttendanceLog {
    id: number;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    logTime: string;
    deviceId: string;
    verificationMode: string;
}

export default function CollectDataPage() {
    const { user, hasRole, loading: authLoading } = useAuth()
    const [range, setRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    })
    const [progress, setProgress] = React.useState(0)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [logs, setLogs] = React.useState<AttendanceLog[]>([])
    const [isLoadingLogs, setIsLoadingLogs] = React.useState(false)
    const [companies, setCompanies] = React.useState<ICompany[]>([])
    const [selectedCompany, setSelectedCompany] = React.useState<string>("all")

    const fetchCompanies = React.useCallback(async () => {
        try {
            const comps = await companyService.getAll()
            if (hasRole("SuperAdmin") || hasRole("Admin")) {
                setCompanies(comps)
            } else {
                const assignedIds = user?.assignedCompanyIds || []
                const userCompanies = comps.filter(c => assignedIds.includes(c.id))
                setCompanies(userCompanies)
                if (userCompanies.length > 0 && selectedCompany === "all") {
                    setSelectedCompany(userCompanies[0].id.toString())
                }
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error)
        }
    }, [hasRole, user?.assignedCompanyIds, selectedCompany])

    React.useEffect(() => {
        if (!authLoading && user) {
            fetchCompanies()
        }
    }, [authLoading, user, fetchCompanies])

    const fetchLogs = React.useCallback(async () => {
        setIsLoadingLogs(true)
        try {
            let companyIdParam: number | undefined = undefined;
            if (selectedCompany && selectedCompany !== "all") {
                companyIdParam = parseInt(selectedCompany, 10);
                if (Number.isNaN(companyIdParam)) {
                    companyIdParam = undefined;
                }
            } else if (selectedCompany === "all" && user && !hasRole("SuperAdmin") && !hasRole("Admin")) {
                const assignedIds = user.assignedCompanyIds || [];
                if (assignedIds.length > 0) {
                    companyIdParam = assignedIds[0];
                }
            }

            const data = await attendanceService.getAttendanceLogs({
                startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                endDate: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
                companyId: companyIdParam
            })
            setLogs(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch attendance logs")
        } finally {
            setIsLoadingLogs(false)
        }
    }, [range, selectedCompany, user, hasRole])

    React.useEffect(() => {
        if (!authLoading && user) {
            fetchLogs()
        }
    }, [fetchLogs, authLoading, user])

    const handleCollect = async () => {
        if (!range?.from) return toast.error("Please select a date range");

        setIsProcessing(true)
        setProgress(0)

        try {
            // Fake progress for UI feedback during long sync
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 95));
            }, 300);

            let companyIdParam: number | undefined = undefined;
            if (selectedCompany && selectedCompany !== "all") {
                companyIdParam = parseInt(selectedCompany, 10);
                if (Number.isNaN(companyIdParam)) {
                    companyIdParam = undefined;
                }
            } else if (selectedCompany === "all" && user && !hasRole("SuperAdmin") && !hasRole("Admin")) {
                const assignedIds = user.assignedCompanyIds || [];
                if (assignedIds.length > 0) {
                    companyIdParam = assignedIds[0];
                } else {
                    toast.error("You are not assigned to any company.");
                    setIsProcessing(false);
                    return;
                }
            }

            const payload = {
                startDate: format(range.from, "yyyy-MM-dd"),
                endDate: range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd"),
                companyId: companyIdParam
            }

            const response = await attendanceService.syncData(payload);

            clearInterval(interval);
            setProgress(100);

            toast.success(response.message);
            fetchLogs() // Refresh table
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Sync failed");
        } finally {
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
            }, 500);
        }
    }

    const columns: ColumnDef<AttendanceLog>[] = [
        {
            accessorKey: "employeeId",
            header: "Employee ID",
            cell: ({ row }) => <span>{row.getValue("employeeId")}</span>,
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => <span>{row.getValue("employeeName")}</span>,
        },
        {
            accessorKey: "departmentName",
            header: "Department",
        },
        {
            accessorKey: "logTime",
            header: "Punch Time",
            cell: ({ row }) => {
                const date = new Date(row.getValue("logTime"));
                return (
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-bold tabular-nums">{format(date, "hh:mm:ss a")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "deviceId",
            header: "Device",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">{row.getValue("deviceId") || "N/A"}</span>
            )
        },
        {
            accessorKey: "verificationMode",
            header: "Mode",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] uppercase font-normal">
                    {row.getValue("verificationMode") || "Device"}
                </Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-4 p-6 w-full min-h-screen bg-background">
            {/* Header Section */}
            <div className="flex flex-col border-b pb-4 md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Collect Attendance Data</h1>
                    <p className="text-sm text-muted-foreground">Sync biometric logs from database engine.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={fetchLogs} disabled={isLoadingLogs}>
                        <IconRefresh className={cn("size-4", isLoadingLogs && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
                {/* Configuration Area */}
                <div className="space-y-4">
                    <Card className="border shadow-none">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <IconCalendarEvent className="size-4" />
                                Date Range
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="range"
                                selected={range}
                                onSelect={setRange}
                                className="border rounded-md"
                                initialFocus
                            />
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <IconBuilding className="size-4" />
                                Company Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <Label className="text-xs font-medium">Target Company</Label>
                            <NativeSelect
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                disabled={(!hasRole("SuperAdmin") && !hasRole("Admin")) && companies.length <= 1}
                                className="h-9 text-sm"
                            >
                                {(hasRole("SuperAdmin") || hasRole("Admin")) && <option value="all">All Companies</option>}
                                {companies.map(c => (
                                    <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>
                                ))}
                            </NativeSelect>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="text-sm font-semibold">Synchronization</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {isProcessing ? (
                                <div className="space-y-2 py-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Syncing logs...</span>
                                        <span className="font-bold">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                </div>
                            ) : (
                                <Button
                                    onClick={handleCollect}
                                    className="w-full h-10 font-medium"
                                    disabled={!range?.from}
                                >
                                    <IconCloudDownload className="mr-2 size-4" />
                                    Fetch Logs
                                </Button>
                            )}
                            <p className="text-[11px] text-muted-foreground text-center">
                                Imports new records from the ZKTeco database file.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Logs Table */}
                <Card className="border shadow-none flex flex-col min-h-[600px]">
                    <CardHeader className="py-3 px-4 border-b">
                        <div className="flex items-center gap-2">
                            <IconHistory className="size-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-semibold">Activity Logs</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <DataTable
                            columns={columns}
                            data={logs}
                            searchKey="employeeName"
                            showActions={false}
                            isLoading={isLoadingLogs}
                            showColumnCustomizer={false}
                            showTabs={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
