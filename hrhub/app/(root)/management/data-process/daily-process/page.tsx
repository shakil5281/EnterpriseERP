"use client"

import * as React from "react"
import {
    IconCalendarStats,
    IconCheck,
    IconLoader2,
    IconInfoCircle,
    IconUser,
    IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { eachDayOfInterval, format } from "date-fns"
import { attendanceService } from "@/lib/services/attendance"
import { companyService, type Company } from "@/lib/services/company"
import { NativeSelect } from "@/components/ui/native-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useRouter } from "next/navigation"

function isGuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default function DailyProcessPage() {
    const router = useRouter()
    const [range, setRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    })
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [companyId, setCompanyId] = React.useState("")
    const [processing, setProcessing] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [result, setResult] = React.useState<string | null>(null)

    React.useEffect(() => {
        companyService
            .getAll()
            .then((rows) => {
                setCompanies(rows)
                if (rows.length === 1) {
                    setCompanyId(rows[0].entityId)
                }
            })
            .catch((error) => {
                console.error(error)
                toast.error("Failed to load companies")
            })
    }, [])

    const handleProcess = async () => {
        if (!range?.from) {
            toast.error("Please select a date range")
            return
        }
        if (!companyId || !isGuid(companyId)) {
            toast.error("Please select a company")
            return
        }

        const end = range.to ?? range.from
        const days = eachDayOfInterval({ start: range.from, end })

        setProcessing(true)
        setProgress(5)
        setResult(null)

        try {
            let totalRecords = 0
            let processed = 0
            for (const day of days) {
                const result = await attendanceService.processDaily({
                    companyId,
                    date: format(day, "yyyy-MM-dd"),
                })
                totalRecords += result.recordsProcessed
                processed += 1
                setProgress(Math.round((processed / days.length) * 100))
            }

            const label =
                days.length === 1
                    ? format(days[0], "dd MMM yyyy")
                    : `${format(range.from, "dd MMM yyyy")} – ${format(end, "dd MMM yyyy")}`

            setResult(`Processed ${totalRecords} employee-day records for ${label}.`)
            toast.success(`Daily process completed (${totalRecords} records)`)
        } catch (error: unknown) {
            console.error(error)
            const message =
                error instanceof Error
                    ? error.message
                    : (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(message || "Processing failed")
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
                        <CardDescription>
                            Select company and date range to run attendance processing via the platform API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Company</Label>
                                <NativeSelect
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    className="h-10"
                                    disabled={processing}
                                >
                                    <option value="">Select company</option>
                                    {companies.map((company) => (
                                        <option key={company.entityId} value={company.entityId}>
                                            {company.companyNameEn}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Target Date Range</Label>
                                <DateRangePicker
                                    date={range}
                                    setDate={setRange}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {processing ? (
                            <div className="space-y-3 py-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <IconLoader2 className="size-4 animate-spin text-primary" />
                                        Processing attendance...
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
                                    disabled={processing || !range?.from || !companyId}
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
                            <p>
                                Each day in the selected range is sent to{" "}
                                <code className="text-[11px]">POST /api/v1/Attendance/process</code> with{" "}
                                <code className="text-[11px]">companyId</code> and <code className="text-[11px]">date</code>.
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
