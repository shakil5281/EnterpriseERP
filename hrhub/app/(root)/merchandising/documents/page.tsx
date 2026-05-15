"use client"

import * as React from "react"
import {
    IconFolder,
    IconFileText,
    IconFileZip,
    IconFileAnalytics,
    IconDownload,
    IconShare,
    IconCloudUpload,
    IconLock,
    IconRefresh
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export default function MerchandisingDocumentsPage() {
    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Document Archive</h1>
                    <p className="text-sm text-muted-foreground font-medium">Contracts, approvals, and compliance repository</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-border rounded-lg text-muted-foreground"
                    >
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button className="h-10 px-6 font-semibold shadow-sm shadow-indigo-500/20 text-white">
                        <IconCloudUpload className="size-4 mr-2" />
                        Upload File
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Contracts" value="42 Files" icon={IconLock} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" />
                <KPICard title="Approvals" value="128 Files" icon={IconFileText} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KPICard title="Lab Reports" value="85 Files" icon={IconFileAnalytics} color="text-sky-600" bgColor="bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400" />
                <KPICard title="Total Archive" value="1,248" icon={IconFileZip} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" />
            </div>

            {/* Content Table */}
            <Card className="border border-border bg-card shadow-none overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest px-2">Recent Repository Activity</h2>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border bg-muted/20 hover:bg-muted/20">
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-11 px-6">Document Name</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-11">Category</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-11 text-center">Reference Date</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-11 text-center">Payload</TableHead>
                                <TableHead className="w-20"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { name: "Booking_Sheet_Style_882.xlsx", type: "Approval", size: "1.2MB", date: "Today" },
                                { name: "Buyer_Contract_HM_2025.pdf", type: "Contract", size: "4.8MB", date: "Yesterday" },
                                { name: "Lab_Test_Report_Denim_402.pdf", type: "Compliance", size: "2.1MB", date: "2d ago" },
                                { name: "T&A_Calendar_Consolidated.pdf", type: "Planning", size: "850KB", date: "3d ago" },
                                { name: "Style_Drawing_JK-402.zip", type: "Tech Pack", size: "125MB", date: "1w ago" }
                            ].map((file, i) => (
                                <TableRow key={i} className="border-border hover:bg-muted/30 transition-colors group">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                                                <IconFileText className="size-5" />
                                            </div>
                                            <span className="font-bold text-sm text-foreground tracking-tight">{file.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-border text-muted-foreground uppercase tracking-tight">
                                            {file.type}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-xs font-bold text-muted-foreground/60 uppercase">{file.date}</TableCell>
                                    <TableCell className="text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{file.size}</TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500 hover:bg-indigo-500/10">
                                                <IconDownload className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <IconShare className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-border bg-card shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className="text-lg font-bold text-foreground">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
