"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    IconPrinter,
    IconDownload,
    IconLoader,
    IconArrowLeft,
    IconBuilding,
    IconPhone,
    IconMail
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { payrollService, type Payslip } from "@/lib/services/payroll"
import { toast } from "sonner"
import Link from "next/link"

export default function PayslipPage() {
    const params = useParams()
    const router = useRouter()
    const id = parseInt(params.id as string)

    const [isLoading, setIsLoading] = React.useState(true)
    const [data, setData] = React.useState<Payslip | null>(null)

    React.useEffect(() => {
        if (id) {
            payrollService.getPayslip(id)
                .then(setData)
                .catch(() => toast.error("Failed to load payslip"))
                .finally(() => setIsLoading(false))
        }
    }, [id])

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <IconLoader className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!data) return (
        <div className="container mx-auto py-10 text-center">
            <h2 className="text-xl font-semibold">Payslip not found</h2>
            <Button variant="link" onClick={() => router.back()}>Go Back</Button>
        </div>
    )

    return (
        <div className="min-h-screen bg-muted/20 pb-10">
            {/* Control Bar - Hidden when printing */}
            <div className="bg-background border-b sticky top-0 z-30 print:hidden">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-[800px]">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                        <IconArrowLeft className="size-4" />
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2" onClick={handlePrint}>
                            <IconPrinter className="size-4" />
                            Print
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handlePrint}>
                            <IconDownload className="size-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 max-w-[800px] print:p-0 print:max-w-none">
                <Card className="bg-white shadow-sm border print:border-0 print:shadow-none">
                    <CardContent className="p-8 print:p-8 space-y-6">

                        {/* Company Header */}
                        <div className="flex justify-between items-start border-b pb-6">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary print:border print:bg-transparent">
                                    <IconBuilding className="size-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-primary">ERP Hub Ltd.</h1>
                                    <p className="text-sm text-muted-foreground">Ashulia, Savar, Dhaka</p>
                                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><IconPhone className="size-3" /> +880 1234 567890</span>
                                        <span className="flex items-center gap-1"><IconMail className="size-3" /> info@erphub.com</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold text-slate-800">PAYSLIP</h2>
                                <p className="text-sm font-medium text-muted-foreground mt-1">
                                    {data.monthName} {data.year}
                                </p>
                            </div>
                        </div>

                        {/* Employee Info */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">Employee Name</span>
                                <span className="font-semibold block">{data.employeeName}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">Employee ID</span>
                                <span className="font-semibold block">{data.employeeId}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">Designation</span>
                                <span className="font-semibold block">{data.designation}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">Department</span>
                                <span className="font-semibold block">{data.department}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">Joining Date</span>
                                <span className="font-semibold block">{data.joinedDate}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">Bank Account</span>
                                <span className="font-semibold block">{data.bankAccountNo}</span>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-4 gap-4 text-center border print:bg-transparent">
                            <div>
                                <span className="text-xs text-muted-foreground block">Total Days</span>
                                <span className="font-bold text-sm">{data.totalDays}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Present</span>
                                <span className="font-bold text-sm text-emerald-600">{data.presentDays}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Absent</span>
                                <span className="font-bold text-sm text-rose-600">{data.absentDays}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">OT Hours</span>
                                <span className="font-bold text-sm">{data.otHours}</span>
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div className="grid grid-cols-2 gap-8 pt-2">
                            {/* Earnings */}
                            <div>
                                <h3 className="font-semibold text-sm mb-3 text-emerald-700 uppercase tracking-wider text-xs border-b pb-2">Earnings</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Basic Salary</span>
                                        <span className="font-medium">৳{data.basicSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">House Rent</span>
                                        <span className="font-medium">৳{((data.grossSalary - data.basicSalary) * 0.4).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Medical</span>
                                        <span className="font-medium">৳{((data.grossSalary - data.basicSalary) * 0.2).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Conveyance</span>
                                        <span className="font-medium">৳{((data.grossSalary - data.basicSalary) * 0.2).toLocaleString()}</span>
                                    </div>
                                    {data.otAmount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Overtime</span>
                                            <span className="font-bold">৳{data.otAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {data.attendanceBonus > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Attendance Bonus</span>
                                            <span className="font-medium">৳{data.attendanceBonus.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold">
                                        <span>Total Earnings</span>
                                        <span>৳{data.totalEarning.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div>
                                <h3 className="font-semibold text-sm mb-3 text-rose-700 uppercase tracking-wider text-xs border-b pb-2">Deductions</h3>
                                <div className="space-y-2 text-sm">
                                    {data.absentDays > 0 ? (
                                        <div className="flex justify-between text-rose-600">
                                            <span>Absent Deduction</span>
                                            <span className="font-medium">৳{(data.absentDays * (data.grossSalary / data.totalDays)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Absent Deduction</span>
                                            <span>-</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Provident Fund</span>
                                        <span>-</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Tax</span>
                                        <span>-</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold">
                                        <span>Total Deductions</span>
                                        <span>৳{data.totalDeduction.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg border flex items-center justify-between mt-4 print:bg-transparent print:border-black">
                            <span className="font-bold text-lg text-slate-700">Net Payable Amount</span>
                            <span className="font-bold text-2xl text-slate-900">৳{data.netPayable.toLocaleString()}</span>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 pt-12 mt-8">
                            <div className="text-center">
                                <div className="h-px bg-slate-300 w-3/4 mx-auto mb-2" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Employee Signature</span>
                            </div>
                            <div className="text-center">
                                <div className="h-px bg-slate-300 w-3/4 mx-auto mb-2" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Authorized Signature</span>
                            </div>
                        </div>

                        <div className="text-center pt-8 text-[10px] text-muted-foreground">
                            <p>This is a computer-generated document. No signature is required.</p>
                            <p>Generated on {new Date().toLocaleDateString()}</p>
                        </div>

                    </CardContent>
                </Card>
            </main>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-0 { border: none !important; }
                    .print\\:bg-transparent { background: transparent !important; }
                    .print\\:border-black { border-color: black !important; }
                }
            `}</style>
        </div>
    )
}
