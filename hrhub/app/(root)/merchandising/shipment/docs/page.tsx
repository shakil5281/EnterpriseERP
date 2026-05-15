"use client"

import * as React from "react"
import {
    IconFileText,
    IconSearch,
    IconDownload,
    IconCloudUpload,
    IconCheckbox,
    IconPrinter
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const docs = [
    { id: "EXP-DOC-001", type: "Commercial Invoice", invoice: "INV-2601", buyer: "H&M", date: "2026-04-12", status: "Verified" },
    { id: "EXP-DOC-002", type: "Packing List", invoice: "INV-2601", buyer: "H&M", date: "2026-04-12", status: "Verified" },
    { id: "EXP-DOC-003", type: "Bill of Lading", invoice: "INV-2601", buyer: "H&M", date: "2026-04-16", status: "Pending" },
    { id: "EXP-DOC-004", type: "Certificate of Origin", invoice: "INV-2601", buyer: "H&M", date: "2026-04-10", status: "Verified" },
]

export default function ExportDocsPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-muted/5 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconFileText className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Export Documentation</h1>
                        <p className="text-sm text-muted-foreground">Manage invoices, packing lists, and certificates.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconCloudUpload className="mr-2 size-4" /> Upload Doc
                    </Button>
                    <Button size="sm">Generate Invoice</Button>
                </div>
            </div>

            {/* Do Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                    <Card key={doc.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                        <CardContent className="p-4 flex gap-4">
                            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                                <IconFileText className="size-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-bold text-sm truncate pr-2">{doc.type}</p>
                                    <Badge variant="outline" className={`text-[10px] h-5 border-none ${doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                        }`}>
                                        {doc.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-0.5">Ref: <span className="font-medium text-foreground">{doc.invoice}</span></p>
                                <p className="text-xs text-muted-foreground">Buyer: {doc.buyer}</p>

                                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="sm" className="h-7 text-xs flex-1">View</Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7"><IconDownload className="size-3" /></Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7"><IconPrinter className="size-3" /></Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Upload Placeholder */}
                <div className="border-2 border-dashed border-muted/50 rounded-xl flex flex-col items-center justify-center p-4 min-h-[140px] text-muted-foreground hover:bg-muted/10 cursor-pointer transition-colors">
                    <IconCloudUpload className="size-8 mb-2 opacity-50" />
                    <p className="text-sm font-bold">Upload Document</p>
                    <p className="text-xs">Drag & drop or click to browse</p>
                </div>
            </div>
        </div>
    )
}
