"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconFileSpreadsheet,
    IconUpload,
    IconDownload,
    IconAlertCircle,
    IconCircleCheck,
    IconFileText,
    IconLoader,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    importExportService,
    importJobToEmployeeResult,
    type ImportPreviewResult,
} from "@/lib/services/import-export"

export default function EmployeeImportPage() {
    const router = useRouter()
    const [isDragging, setIsDragging] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [preview, setPreview] = React.useState<ImportPreviewResult | null>(null)
    const [importResult, setImportResult] = React.useState<ReturnType<typeof importJobToEmployeeResult> | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const reset = () => {
        setFile(null)
        setPreview(null)
        setImportResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleAnalyze = async () => {
        if (!file) return
        setIsLoading(true)
        try {
            const result = await importExportService.previewImport("employee", file)
            setPreview(result)
            toast[result.invalidRows === 0 ? "success" : "warning"](
                result.invalidRows === 0
                    ? `${result.validRows} row(s) ready`
                    : `${result.invalidRows} invalid row(s)`,
            )
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Analyze failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!preview?.sessionId) return
        setIsLoading(true)
        try {
            const job = await importExportService.confirmImport("employee", preview.sessionId)
            setImportResult(importJobToEmployeeResult(job))
            if (job.failedRows === 0) toast.success(`Imported ${job.successRows} employee(s)`)
            else if (job.successRows > 0) toast.warning(`Partial: ${job.successRows} ok, ${job.failedRows} failed`)
            else toast.error("Import failed")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Import failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><IconArrowLeft className="size-5" /></Button>
                <IconFileSpreadsheet className="size-6 text-primary" />
                <h1 className="text-2xl font-bold">Import Employee Data</h1>
            </div>
            <Card>
                <CardHeader><CardTitle className="text-sm">Instructions</CardTitle>
                    <CardDescription>Download template, fill rows, analyze, then confirm. Import creates core employee, job, and salary only; add addresses and bank in edit afterward.</CardDescription></CardHeader>
                <CardContent className="flex gap-2">
                    <Button variant="outline" onClick={() => importExportService.downloadTemplate("employee")}><IconFileText className="size-4 mr-2" />Template</Button>
                </CardContent>
            </Card>
            {!importResult && (
                <Card>
                    <CardHeader><CardTitle>{preview ? "Confirm" : "Upload"}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {!preview && (
                            <>
                                <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(null) } }} />
                                <div className="border-2 border-dashed rounded-lg p-8 text-center" onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".xlsx")) { setFile(f); setPreview(null) } }}>
                                    {file ? <p>{file.name}</p> : <p>Drop .xlsx or browse</p>}
                                    <Button className="mt-2" onClick={() => fileInputRef.current?.click()}>Browse</Button>
                                </div>
                                {file && <Button onClick={handleAnalyze} disabled={isLoading}>{isLoading ? "Analyzing..." : "Analyze"}</Button>}
                            </>
                        )}
                        {preview && (
                            <>
                                <p>Valid: {preview.validRows} / {preview.totalRows} (invalid: {preview.invalidRows})</p>
                                {preview.errors.map((err, i) => <p key={i} className="text-sm text-red-600">Row {err.rowNumber}: {err.field} — {err.message}</p>)}
                                <div className="flex gap-2">
                                    <Button onClick={handleConfirm} disabled={isLoading || preview.validRows === 0}>Import {preview.validRows}</Button>
                                    <Button variant="outline" onClick={reset}>Start over</Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
            {importResult && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <p>Created: {importResult.createdCount}, Errors: {importResult.errorCount}</p>
                        {importResult.errorFilePath && <Button variant="outline" onClick={() => importExportService.downloadImportErrorFile(importResult.jobId)}><IconDownload className="size-4 mr-2" />Errors file</Button>}
                        <Button onClick={() => router.push("/management/human-resource/employee-info")}>View employees</Button>
                        <Button variant="outline" onClick={reset}>Import another</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
