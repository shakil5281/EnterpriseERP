"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconChartBar,
    IconSearch,
    IconDownload,
    IconRefresh,
    IconActivity,
    IconClock,
    IconArrowLeft,
    IconUsers,
    IconBuildingCommunity,
    IconBox,
    IconLayoutList,
    IconLoader2
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { overtimeService, type DailyOTSummary, type OTSummaryResponse } from "@/lib/services/overtime"
import { type CommonFilterParams } from "@/lib/services/attendance"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AdvancedFilter } from "@/components/attendance/advanced-filter"

export default function DailyOTSummaryPage() {
    const router = useRouter()
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [isLoading, setIsLoading] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>({
        date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
    })
    const [data, setData] = React.useState<OTSummaryResponse | null>(null)
    const [hasSearched, setHasSearched] = React.useState(false)

    const fetchData = React.useCallback(async (filters: CommonFilterParams) => {
        setIsLoading(true)
        try {
            const res = await overtimeService.getDailyOTSummary(filters)
            setData(res)
            setHasSearched(true)
        } catch (error: any) {
            toast.error("Analysis failed")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData(fullFilters)
    }, [fullFilters, fetchData])

    const getColumns = (title: string): ColumnDef<DailyOTSummary>[] => [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "name",
            header: title,
            cell: ({ row }) => (
                <div className="font-semibold text-sm text-foreground">{row.original.name}</div>
            )
        },
        {
            accessorKey: "employeeCount",
            header: "Staff Count",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-medium bg-muted/50 text-muted-foreground border-transparent">
                    {row.original.employeeCount} Personnel
                </Badge>
            )
        },
        {
            accessorKey: "totalOTHours",
            header: "Total OT Hours",
            cell: ({ row }) => {
                const grandTotal = data?.grandTotalOTHours || 1
                const percent = (row.original.totalOTHours / grandTotal) * 100
                return (
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">
                                {row.original.totalOTHours.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">hrs</span>
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                                {percent.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={percent} className="h-1.5 bg-muted" />
                    </div>
                )
            }
        },
        {
            accessorKey: "averageOTPerEmployee",
            header: "Avg OT / Person",
            cell: ({ row }) => (
                <span className="text-sm font-medium text-foreground">
                    {row.original.averageOTPerEmployee.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">hrs</span>
                </span>
            )
        }
    ]

    const handleExport = async () => {
        setIsExporting(true)
        try {
            await overtimeService.exportDailyOTSummaryExcel(fullFilters)
            toast.success("Summary exported successfully")
        } catch (error) {
            toast.error("Export failed")
        } finally {
            setIsExporting(false)
        }
    }

    const avgOTPerEmployee = data && data.totalEmployees > 0 ? (data.grandTotalOTHours / data.totalEmployees).toFixed(2) : "0.00"

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily OT Summary</h1>
                        <p className="text-sm text-muted-foreground">Detailed overtime distribution across different organizational levels</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExport}
                        disabled={!data || isExporting}
                    >
                        {isExporting ? (
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <IconDownload className="mr-2 h-4 w-4" />
                        )}
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Filters */}
                <div className="px-6">
                    <AdvancedFilter
                        onFilterChange={(newFilters: CommonFilterParams) => {
                            if (newFilters.date) setDate(new Date(newFilters.date))
                            setFullFilters(newFilters)
                        }}
                        initialFilters={fullFilters}
                    />
                </div>

                {hasSearched && data && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-card">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Grand Total OT</p>
                                <h3 className="text-2xl font-bold mt-1 text-primary">{data.grandTotalOTHours.toFixed(1)} <span className="text-sm font-medium">hrs</span></h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/10 dark:to-card">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Employees</p>
                                <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{data.totalEmployees}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-card">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg OT / Person</p>
                                <h3 className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{avgOTPerEmployee} <span className="text-sm font-medium">hrs</span></h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-card">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Report Date</p>
                                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{format(new Date(data.date), "dd MMM yy")}</h3>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <IconLoader2 className="size-10 animate-spin text-primary opacity-20" />
                        <p className="mt-4 text-sm text-muted-foreground font-medium">Generating OT Analytics...</p>
                    </div>
                ) : hasSearched && data ? (
                    <div className="px-6">
                        <Tabs defaultValue="department" className="w-full space-y-6">
                            <TabsList className="bg-muted/50 p-1 h-11 w-full justify-start rounded-lg">
                                <TabsTrigger value="department" className="gap-2 px-4 h-9">
                                    <IconBuildingCommunity className="size-4" /> Department
                                </TabsTrigger>
                                <TabsTrigger value="section" className="gap-2 px-4 h-9">
                                    <IconBox className="size-4" /> Section
                                </TabsTrigger>
                                <TabsTrigger value="line" className="gap-2 px-4 h-9">
                                    <IconLayoutList className="size-4" /> Line
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="department" className="mt-0">
                                <Card className="border shadow-none overflow-hidden">
                                    <CardHeader className="bg-muted/30 border-b py-4">
                                        <CardTitle className="text-base font-semibold">Department Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable columns={getColumns("Department")} data={data.departmentSummaries} showColumnCustomizer={false} showActions={false} showTabs={false} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="section" className="mt-0">
                                <Card className="border shadow-none overflow-hidden">
                                    <CardHeader className="bg-muted/30 border-b py-4">
                                        <CardTitle className="text-base font-semibold">Section Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable columns={getColumns("Section")} data={data.sectionSummaries} showColumnCustomizer={false} showActions={false} showTabs={false} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="line" className="mt-0">
                                <Card className="border shadow-none overflow-hidden">
                                    <CardHeader className="bg-muted/30 border-b py-4">
                                        <CardTitle className="text-base font-semibold">Line Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable columns={getColumns("Line")} data={data.lineSummaries} showColumnCustomizer={false} showActions={false} showTabs={false} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="mx-6 flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-muted/20 text-muted-foreground outline-none">
                        <IconChartBar size={48} stroke={1.5} className="opacity-20" />
                        <p className="mt-4 font-medium">Select a date to view OT analytics</p>
                    </div>
                )}
            </div>
        </div>
    )
}
