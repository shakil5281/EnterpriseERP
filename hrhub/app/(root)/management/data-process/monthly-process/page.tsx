"use client"

import * as React from "react"
import { IconCash, IconCalculator } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function MonthlyProcessPage() {
    const [month, setMonth] = React.useState<string>((new Date().getMonth() + 1).toString())
    const [year, setYear] = React.useState<string>(new Date().getFullYear().toString())
    const [processing, setProcessing] = React.useState(false)
    const [progress, setProgress] = React.useState(0)

    const handleProcess = () => {
        setProcessing(true)
        setProgress(0)

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setProcessing(false)
                    toast.success(`Salary processed for ${month}/${year}`)
                    return 0
                }
                return prev + 2
            })
        }, 100)
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 w-full">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <IconCash className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Monthly Process</h1>
                </div>
                <p className="text-muted-foreground">Generate monthly salary sheets, tax calculations, and final payroll.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Select the period for salary processing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2023">2023</SelectItem>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-100 dark:border-blue-900/50">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-blue-700 dark:text-blue-300">Total Eligible Employees:</span>
                            <span className="font-bold text-blue-900 dark:text-blue-100">142</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                            <span className="font-medium text-blue-700 dark:text-blue-300">Working Days:</span>
                            <span className="font-bold text-blue-900 dark:text-blue-100">26</span>
                        </div>
                    </div>

                    {processing ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Calculating Payroll...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Button onClick={() => toast.info("Checking data integrity...")} variant="outline" className="flex-1">
                                Check Data
                            </Button>
                            <Button onClick={handleProcess} className="flex-1 gap-2">
                                <IconCalculator className="size-4" />
                                Process Salary
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
