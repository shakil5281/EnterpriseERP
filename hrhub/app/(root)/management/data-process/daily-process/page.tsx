"use client"

import * as React from "react"
import {
    IconCalendarStats,
    IconPlayerPlay,
    IconBuildingFactory2,
    IconCheck,
    IconLoader2,
    IconInfoCircle,
    IconUser,
    IconRefresh
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { attendanceService } from "@/lib/services/attendance"
import { organogramService } from "@/lib/services/organogram"
import { NativeSelect } from "@/components/ui/native-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useRouter } from "next/navigation"

export default function DailyProcessPage() {
    const router = useRouter()
    const [range, setRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    })
    const [departmentId, setDepartmentId] = React.useState<string>("all")
    const [departments, setDepartments] = React.useState<any[]>([])
    const [processing, setProcessing] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [result, setResult] = React.useState<string | null>(null)

    React.useEffect(() => {
        organogramService.getDepartments().then(setDepartments).catch(console.error)
    }, [])

    const handleProcess = async () => {
        if (!range?.from) return toast.error("Please select a date range")

        setProcessing(true)
        setProgress(15)
        setResult(null)

        try {
            const payload = {
                startDate: format(range.from, "yyyy-MM-dd"),
                endDate: range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd"),
                departmentId: departmentId !== "all" ? parseInt(departmentId) : undefined,
            }

            setProgress(45)
            const response = await attendanceService.processDailyData(payload)
            setProgress(100)
            setResult(response.message)
            toast.success("Bulk process completed")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Processing failed")
            setProgress(0)
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <IconCalendarStats className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Daily Data Process</h1>
                </div>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => router.push("/management/data-process/daily-process/single")}
                >
                    <IconUser className="size-4" />
                    Process Single Employee
                </Button>
            </div>

            <div className="px-4 lg:px-6 max-w-3xl">
                <Card className="border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Bulk Processing Parameters</CardTitle>
                        <CardDescription>Select the group and date range for massive attendance recalculation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Target Date Range</Label>
                                <DateRangePicker
                                    date={range}
                                    setDate={setRange}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Department / Scope</Label>
                                <NativeSelect
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    className="h-10"
                                    disabled={processing}
                                >
                                    <option value="all">Whole Organization</option>
                                    {departments.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>
                        </div>

                        {processing ? (
                            <div className="space-y-3 py-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <IconLoader2 className="size-4 animate-spin text-primary" />
                                        Engine is calculating bulk data...
                                    </span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        ) : (
                            <div className="space-y-4 pt-2">
                                {result && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md flex items-center gap-2 text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1">
                                        <IconCheck className="size-4 stroke-3" />
                                        <p className="text-sm font-medium">{result}</p>
                                    </div>
                                )}

                                <Button
                                    onClick={handleProcess}
                                    className="w-full h-11 font-semibold gap-2 transition-all active:scale-[0.98]"
                                    disabled={processing || !range?.from}
                                >
                                    <IconRefresh className="size-4" />
                                    Run Bulk Process
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t py-4">
                        <div className="flex gap-2 items-start text-xs text-muted-foreground">
                            <IconInfoCircle className="size-4 shrink-0 text-primary opacity-70" />
                            <p>Bulk processing may take a few moments depending on the number of employees and date range selected.</p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
