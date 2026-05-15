"use client"

import * as React from "react"
import {
    IconFileUpload,
    IconFileSpreadsheet,
    IconCheck,
    IconX,
    IconLoader2,
    IconArrowLeft,
    IconAlertCircle,
    IconDownload,
    IconTableImport,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { merchandisingService } from "@/lib/services/merchandising"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ImportSummary {
    total: number;
    valid: number;
    invalid: number;
}

export default function OrderImportPage() {
    const router = useRouter()
    const [file, setFile] = React.useState<File | null>(null)
    const [previewData, setPreviewData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)
    const [importing, setImporting] = React.useState(false)
    const [summary, setSummary] = React.useState<ImportSummary | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setPreviewData(null)
            setSummary(null)
        }
    }

    const handleUploadPreview = async () => {
        if (!file) {
            toast.error("Please select an Excel file")
            return
        }

        try {
            setLoading(true)
            const data = await merchandisingService.previewProgramOrder(file)
            setPreviewData(data)

            const total = data.orders.length
            const valid = data.orders.filter((r: any) => r.isValid).length
            setSummary({
                total: total,
                valid: valid,
                invalid: total - valid
            })
            toast.success("File analyzed successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to analyze file")
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmImport = async () => {
        if (!previewData || previewData.orders.length === 0) return;

        try {
            setImporting(true)
            await merchandisingService.importProgramOrders(previewData, 1, 1)
            toast.success("Orders imported successfully")
            router.push("/merchandising/orders")
        } catch (error) {
            console.error(error)
            toast.error("Import failed")
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="flex flex-col py-0 bg-background min-h-screen">
            {/* Top Action Bar - Sticky */}
            <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border px-4 lg:px-8 py-3 mb-6 transition-all shadow-sm">
                <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => router.push("/merchandising/orders")}
                        >
                            <IconArrowLeft className="size-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                                Bulk Order Import
                            </h1>
                            <p className="text-[11px] font-medium text-muted-foreground mt-1">Batch process production programs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => merchandisingService.downloadOrderTemplate()} className="h-10 px-4 font-bold bg-card border-border hover:bg-muted text-foreground rounded-xl">
                            <IconDownload className="mr-2 size-4" /> Download Template
                        </Button>
                        {previewData && (
                            <Button
                                disabled={importing || (summary?.valid || 0) === 0}
                                onClick={handleConfirmImport}
                                className="h-10 px-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                {importing ? <IconLoader2 className="animate-spin mr-2 size-4" /> : <IconTableImport className="mr-2 size-4" />}
                                Import {summary?.valid} Records
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 px-4 lg:px-8 max-w-[1600px] mx-auto w-full pb-10">

                {!previewData ? (
                    <Card className="border-2 border-dashed border-border bg-card shadow-none mt-4">
                        <CardContent className="flex flex-col items-center justify-center py-20">
                            <div className="p-4 bg-muted rounded-full text-muted-foreground mb-6 font-bold uppercase tracking-widest text-[10px]">
                                <IconFileUpload size={40} />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Choose Excel File</h2>
                            <p className="text-muted-foreground text-xs mt-1 mb-8">Supported: .xlsx, .xls</p>

                            <input type="file" accept=".xlsx, .xls" className="hidden" id="excel-upload" onChange={handleFileChange} />
                            <div className="flex flex-col items-center gap-4">
                                <label htmlFor="excel-upload">
                                    <Button asChild variant="outline" className="h-10 px-8 font-semibold cursor-pointer">
                                        <span>{file ? file.name : "Browse Files"}</span>
                                    </Button>
                                </label>
                                {file && (
                                    <Button
                                        onClick={handleUploadPreview}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-10"
                                        disabled={loading}
                                    >
                                        {loading ? <IconLoader2 className="animate-spin mr-2" /> : <IconFileSpreadsheet className="mr-2" />}
                                        Analyze File
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Rows</p>
                                <p className="text-xl font-bold text-foreground mt-0.5">{summary?.total}</p>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Valid Rows</p>
                                <p className="text-xl font-bold text-green-600 mt-0.5">{summary?.valid}</p>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-border shadow-sm text-red-600">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Invalid Rows</p>
                                <p className="text-xl font-bold mt-0.5">{summary?.invalid}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <p className="text-[10px] font-bold text-primary uppercase">Styles to Sync</p>
                                <p className="text-xl font-bold text-primary mt-0.5">{previewData.styles?.length || 0}</p>
                            </div>
                            <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                                <p className="text-[10px] font-bold text-orange-600 uppercase">Colors to Sync</p>
                                <p className="text-xl font-bold text-orange-600 mt-0.5">{previewData.colors?.length || 0}</p>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground">Order Validation Preview</h3>
                                <Button variant="ghost" size="sm" onClick={() => { setPreviewData(null); setFile(null); setSummary(null) }} className="text-xs text-muted-foreground hover:text-red-500">Reset</Button>
                            </div>
                            <div className="overflow-x-auto max-h-[500px]">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/30 border-b border-border sticky top-0">
                                        <tr>
                                            <th className="p-3 w-12 text-center"></th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Program#</th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Season</th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Buyer</th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Article#</th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Color</th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px] text-center">Qty</th>
                                            <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Status / Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {previewData.orders.map((row: any, idx: number) => {
                                            const qty = row.sizeM + row.sizeL + row.sizeXL + row.sizeXXL + row.sizeXXXL + row.size3XL + row.size4XL + row.size5XL + row.size6XL;
                                            return (
                                                <tr key={idx} className={`hover:bg-muted/30 ${!row.isValid ? 'bg-red-500/10' : ''}`}>
                                                    <td className="p-3 text-center">
                                                        {row.isValid ? <IconCheck className="text-green-600 size-4 mx-auto" /> : <IconX className="text-red-600 size-4 mx-auto" />}
                                                    </td>
                                                    <td className="p-3 font-bold text-foreground">{row.programNumber}</td>
                                                    <td className="p-3 text-muted-foreground uppercase text-[10px] font-bold">{row.programName}</td>
                                                    <td className="p-3 text-muted-foreground uppercase text-[10px] font-bold">{row.buyerName}</td>
                                                    <td className="p-3 font-mono text-[10px]">{row.newArticleNo}</td>
                                                    <td className="p-3 font-medium text-foreground">{row.color}</td>
                                                    <td className="p-3 text-center font-bold">{qty.toLocaleString()}</td>
                                                    <td className="p-3">
                                                        {!row.isValid ? (
                                                            <div className="flex items-center gap-1.5 text-red-600 font-medium">
                                                                <IconAlertCircle size={12} /> {row.errorMessage}
                                                            </div>
                                                        ) : (
                                                            <span className="text-green-600 font-bold uppercase text-[9px]">Valid</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
