"use client"

import * as React from "react"
import { IconSettings, IconLoader, IconCheck, IconPlayerPlay } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { payrollService } from "@/lib/services/payroll"
import { organogramService } from "@/lib/services/organogram"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection } from "@/lib/payroll-utils"
import { useAuth } from "@/components/providers/auth-provider"

const MONTHS = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
]

export default function SalaryProcessPage() {
    const { user } = useAuth()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [departmentId, setDepartmentId] = React.useState("all")
    const [departments, setDepartments] = React.useState<any[]>([])

    const [status, setStatus] = React.useState<"idle" | "processing" | "success">("idle")
    const [progress, setProgress] = React.useState(0)
    const [message, setMessage] = React.useState("")

    React.useEffect(() => {
        companyService.getAll().then(setCompanies)
    }, [])

    React.useEffect(() => {
        if (selectedCompanyId !== "all") {
            organogramService.getDepartments({ companyId: parseInt(selectedCompanyId) }).then(setDepartments)
        } else {
            setDepartments([])
            setDepartmentId("all")
        }
    }, [selectedCompanyId])

    const handleProcess = async () => {
        setStatus("processing")
        setProgress(10)
        setMessage("Initializing payroll engine...")

        try {
            // Fake progress for UX
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 90) {
                        clearInterval(interval)
                        return 90
                    }
                    return p + 2
                })
            }, 100)

            const companyGuid = selectedCompanyId === "all" ? undefined : companyGuidFromSelection(companies, selectedCompanyId)
            if (!companyGuid) {
                toast.error("Select a company to process payroll")
                setStatus("idle")
                return
            }
            const res = await payrollService.processSalary({
                year,
                month,
                companyGuid,
                processedBy: user?.id,
            })

            clearInterval(interval)
            setProgress(100)
            setStatus("success")
            setMessage(res.message || "Payroll processed successfully")
            toast.success("Payroll processed successfully")
        } catch (error: any) {
            setStatus("idle")
            toast.error(error.response?.data?.message || "Failed to process payroll")
        }
    }

    return (
        <div className="container max-w-2xl mx-auto py-10 animate-in fade-in duration-500">
            <div className="space-y-1 mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Salary Processing</h1>
                <p className="text-muted-foreground text-sm">Execute payroll generation for the selected period</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Process Configuration</CardTitle>
                    <CardDescription>Select period and scope for salary calculation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                                <option value={2028}>2028</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Company Scope</Label>
                            <NativeSelect value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
                                <option value="all">Select Company</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.companyNameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Department Scope</Label>
                            <NativeSelect value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={selectedCompanyId === "all"}>
                                <option value="all">Entire Organization</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg flex gap-4">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-background border flex items-center justify-center text-muted-foreground">
                            <IconSettings className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold">Ready to Process</h4>
                            <p className="text-xs text-muted-foreground">
                                This will calculate salaries for <strong>{MONTHS.find(m => m.value === month)?.label} {year}</strong>. Existing draft calculations will be overwritten.
                            </p>
                        </div>
                    </div>

                    {status === "idle" && (
                        <Button
                            className="w-full gap-2"
                            size="lg"
                            onClick={handleProcess}
                        >
                            <IconPlayerPlay className="size-4" />
                            Run Processing
                        </Button>
                    )}

                    {status === "processing" && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium animate-pulse">{message}</span>
                                <span className="font-bold">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <IconCheck className="size-6" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Processing Complete</h3>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setStatus("idle")}
                            >
                                Process Another
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
