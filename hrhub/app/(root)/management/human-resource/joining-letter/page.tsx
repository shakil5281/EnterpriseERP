"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    IconFileText,
    IconPrinter,
    IconDownload,
    IconSearch,
    IconArrowLeft,
    IconSignature,
    IconBuilding,
    IconCalendar
} from "@tabler/icons-react"
import { toast } from "sonner"
import { format } from "date-fns"

export default function JoiningLetterPage() {
    const router = useRouter()
    const [searchId, setSearchId] = React.useState("")
    const [showLetter, setShowLetter] = React.useState(false)

    // Mock employee data
    const employee = {
        employeeId: "EMP-2024-089",
        name: "Shakil Ahmed",
        designation: "Senior Software Engineer",
        department: "IT & Development",
        joinDate: "15 May 2024",
        salary: "85,000",
        manager: "Arifur Rahman",
        managerDesignation: "Head of Engineering",
        company: "HR Hub Tech Ltd.",
        companyAddress: "123 Business Avenue, Gulshan, Dhaka-1212",
        referenceNo: "HRH/2024/JL/1029"
    }

    const today = format(new Date(), "MMMM dd, yyyy")

    const handleSearch = () => {
        if (!searchId.trim()) {
            toast.error("Please enter an Employee ID")
            return
        }
        setShowLetter(true)
        toast.success("Employee joining details loaded")
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                        <IconFileText className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Joining Letter</h1>
                        <p className="text-sm text-muted-foreground">Generate and issue official joining letters for new employees.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <IconArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Search Section */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-end gap-4 max-w-2xl">
                        <div className="flex-1 space-y-2 w-full">
                            <Label htmlFor="search-id" className="text-xs font-bold uppercase text-muted-foreground">Find Employee</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    id="search-id"
                                    placeholder="Enter Employee ID..."
                                    className="pl-10 h-10 bg-background"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>
                        <Button className="h-10 px-8" onClick={handleSearch}>
                            Generate Letter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showLetter ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Controls */}
                    <div className="xl:col-span-3 space-y-4 order-2 xl:order-1">
                        <Card className="border-none shadow-md">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base font-semibold">Document Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <Button className="w-full gap-2" onClick={() => window.print()}>
                                    <IconPrinter className="size-4" />
                                    Print Document
                                </Button>
                                <Button variant="outline" className="w-full gap-2" onClick={() => toast.info("Downloading PDF...")}>
                                    <IconDownload className="size-4" />
                                    Download PDF
                                </Button>
                                <hr className="my-2" />
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Issuing Date</Label>
                                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-xs font-medium">
                                            <IconCalendar className="size-3.5" />
                                            {today}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Reference No.</Label>
                                        <div className="p-2 rounded-md bg-muted text-xs font-mono">
                                            {employee.referenceNo}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                            <h4 className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1.5">
                                <IconSignature className="size-3.5" />
                                Digital Signature
                            </h4>
                            <p className="text-[10px] text-blue-600/80 leading-relaxed">
                                This letter is digitally signed and valid without a physical seal once issued through the HR Portal.
                            </p>
                        </div>
                    </div>

                    {/* Letter Preview */}
                    <div className="xl:col-span-9 order-1 xl:order-2 flex justify-center pb-12">
                        <div className="w-full max-w-[800px] bg-white shadow-2xl rounded-sm border border-slate-200 min-h-[1000px] p-16 flex flex-col font-serif text-slate-800 print:shadow-none print:border-none print:p-0">
                            
                            {/* Letterhead */}
                            <div className="flex justify-between items-start border-b-2 border-primary pb-8 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="size-12 bg-primary rounded-lg flex items-center justify-center text-white">
                                        <IconBuilding className="size-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tighter text-primary uppercase">{employee.company}</h2>
                                        <p className="text-[10px] text-slate-400 font-sans uppercase tracking-[0.2em] font-bold">Excellence in Enterprise HR</p>
                                    </div>
                                </div>
                                <div className="text-right font-sans">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Headquarters</p>
                                    <p className="text-[11px] text-slate-600 max-w-[200px]">{employee.companyAddress}</p>
                                </div>
                            </div>

                            {/* Letter Metadata */}
                            <div className="flex justify-between mb-12 font-sans">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reference</p>
                                    <p className="text-sm font-semibold">{employee.referenceNo}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-sm font-semibold">{today}</p>
                                </div>
                            </div>

                            {/* Recipient */}
                            <div className="mb-10">
                                <p className="font-bold text-slate-900 mb-1">To,</p>
                                <p className="text-lg font-bold text-slate-900 leading-tight">{employee.name}</p>
                                <p className="text-sm text-slate-600">{employee.designation}</p>
                                <p className="text-sm text-slate-600">{employee.department}</p>
                            </div>

                            {/* Subject */}
                            <div className="mb-10">
                                <p className="font-bold text-slate-900 underline underline-offset-4">Subject: Appointment Letter for the position of {employee.designation}</p>
                            </div>

                            {/* Content */}
                            <div className="space-y-6 text-sm leading-relaxed text-slate-700 text-justify mb-12">
                                <p>Dear <strong>{employee.name}</strong>,</p>
                                
                                <p>
                                    With reference to your application and subsequent interview you had with us, we are pleased to offer you the position of 
                                    <strong> {employee.designation}</strong> in the <strong>{employee.department}</strong> department of 
                                    <strong> {employee.company}</strong>.
                                </p>

                                <p>
                                    Your appointment will be effective from your date of joining, which is confirmed as <strong>{employee.joinDate}</strong>. 
                                    As discussed, your starting gross salary will be <strong>BDT {employee.salary}/-</strong> per month, subject to statutory deductions.
                                </p>

                                <p>
                                    Your role and responsibilities will be as discussed during the interview process. You will be on a probation period of six months, 
                                    after which your performance will be reviewed for confirmation.
                                </p>

                                <p>
                                    We welcome you to the <strong>{employee.company}</strong> team and look forward to a mutually beneficial association.
                                </p>
                            </div>

                            {/* Signature */}
                            <div className="mt-auto">
                                <div className="mb-2">
                                    <p className="text-sm text-slate-600 mb-10">Sincerely,</p>
                                    <div className="w-48 h-12 border-b border-slate-300 mb-2 relative">
                                        <div className="absolute bottom-1 font-serif italic text-primary/60 text-xl opacity-50">Arifur Rahman</div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{employee.manager}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">{employee.managerDesignation}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 font-sans pt-12 border-t border-slate-100 mt-12 text-center italic">
                                    This is a computer-generated document. No physical signature is required. 
                                    Confidentiality notice: This letter is intended only for the recipient named above.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="size-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                        <IconFileText className="size-12 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Ready to Generate Letter</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto text-balance">
                            Search for an employee by ID to generate their official joining letter with all contractual details.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
