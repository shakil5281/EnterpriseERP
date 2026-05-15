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
    IconCircleX,
    IconFileText
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { employeeService } from "@/lib/services/employee"

interface ImportResult {
    totalRows: number
    successCount: number
    errorCount: number
    warningCount: number
    createdCount: number
    updatedCount: number
    errors: Array<{ rowNumber: number; field: string; message: string }>
    warnings: Array<{ rowNumber: number; field: string; message: string }>
}

export default function EmployeeImportPage() {
    const router = useRouter()
    const [isDragging, setIsDragging] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadProgress, setUploadProgress] = React.useState(0)
    const [importResult, setImportResult] = React.useState<ImportResult | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
            setFile(droppedFile)
        } else {
            toast.error("Please upload a valid Excel file (.xlsx)")
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setUploadProgress(0)
        setImportResult(null)

        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval)
                    return 90
                }
                return prev + 10
            })
        }, 200)

        try {
            const result = await employeeService.importExcel(file)
            clearInterval(progressInterval)
            setUploadProgress(100)
            setImportResult(result)

            if (result.errorCount === 0 && result.warningCount === 0) {
                toast.success(`Successfully imported ${result.successCount} employee(s)`)
            } else if (result.errorCount === 0 && result.warningCount > 0) {
                toast.info(`Imported ${result.successCount} employee(s) with ${result.warningCount} warning(s)`)
            } else {
                toast.warning(`Import completed with ${result.errorCount} error(s) and ${result.warningCount} warning(s)`)
            }
        } catch (error: any) {
            clearInterval(progressInterval)
            toast.error(error?.response?.data?.message || "Failed to import file")
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await employeeService.exportTemplate()
            toast.success("Template downloaded successfully")
        } catch (error) {
            toast.error("Failed to download template")
            console.error(error)
        }
    }

    const handleDownloadDemo = async () => {
        try {
            await employeeService.exportDemo()
            toast.success("Demo data downloaded successfully")
        } catch (error) {
            toast.error("Failed to download demo data")
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full max-w-5xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <IconArrowLeft className="size-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <IconFileSpreadsheet className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Import Employee Data</h1>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Instructions Card */}
                <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="bg-muted/30 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <IconAlertCircle className="size-5 text-primary" />
                            <CardTitle className="text-sm">Import Instructions</CardTitle>
                        </div>
                        <CardDescription>Follow these steps to import your employee data</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ol className="space-y-3 text-sm">
                            <li className="flex gap-3">
                                <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                    1
                                </span>
                                <span className="text-muted-foreground">
                                    Download the Excel template or demo data below
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                    2
                                </span>
                                <span className="text-muted-foreground">
                                    Fill in employee information. New fields added: <strong>Company Name</strong>, <strong>Blood Group</strong>, <strong>Employee ID</strong>, <strong>Card ID (Proximity)</strong>, <strong>Gender</strong>, and <strong>Religion</strong>.
                                    <br />
                                    <span className="text-xs opacity-80 mt-1 block font-medium text-amber-600 dark:text-amber-400">
                                        Important: Company, Department, Designation, and Address locations (District, Thana etc.) must match system names exactly.
                                        Gross Salary will auto-calculate breakdown if other salary fields are left empty.
                                    </span>
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                    3
                                </span>
                                <span className="text-muted-foreground">
                                    Upload the completed file using the drag-and-drop area below
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                    4
                                </span>
                                <span className="text-muted-foreground">
                                    Review the import results and address any errors if needed
                                </span>
                            </li>
                        </ol>

                        <div className="flex gap-3 mt-6 pt-6 border-t">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleDownloadTemplate}
                            >
                                <IconFileText className="size-4" />
                                Template
                            </Button>
                            <Button
                                variant="secondary"
                                className="gap-2"
                                onClick={handleDownloadDemo}
                            >
                                <IconFileSpreadsheet className="size-4" />
                                Demo Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Upload Area */}
                <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="bg-muted/30 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <IconUpload className="size-5 text-primary" />
                            <CardTitle className="text-sm">Upload File</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50"
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {!file ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                                            <IconUpload className="size-8 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium mb-1">Drag and drop your Excel file here</p>
                                        <p className="text-sm text-muted-foreground">or</p>
                                    </div>
                                    <Button onClick={() => fileInputRef.current?.click()}>
                                        Browse Files
                                    </Button>
                                    <p className="text-xs text-muted-foreground">Only .xlsx files are supported</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                            <IconFileSpreadsheet className="size-8 text-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <Button onClick={handleUpload} disabled={isUploading}>
                                            {isUploading ? "Uploading..." : "Upload & Import"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setFile(null)}
                                            disabled={isUploading}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isUploading && (
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Uploading and processing...</span>
                                    <span className="font-medium">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Results */}
                {importResult && (
                    <Card className="border-primary/10 shadow-sm">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <div className="flex items-center gap-2">
                                {importResult.errorCount === 0 ? (
                                    <IconCircleCheck className="size-5 text-green-600" />
                                ) : (
                                    <IconAlertCircle className="size-5 text-amber-600" />
                                )}
                                <CardTitle className="text-sm">Import Results</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-muted/30 rounded-lg">
                                    <p className="text-2xl font-bold">{importResult.totalRows}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Rows</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                                    <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wider">
                                        Success
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{importResult.createdCount}</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                        Created
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{importResult.errorCount}</p>
                                    <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wider">Errors</p>
                                </div>
                                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                    <p className="text-2xl font-bold text-amber-600">{importResult.warningCount}</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">Warnings</p>
                                </div>
                            </div>

                            {importResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 text-red-600">
                                        <IconCircleX className="size-4" />
                                        Errors ({importResult.errors.length})
                                    </h3>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {importResult.errors.map((error, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm border border-red-100 dark:border-red-900/30"
                                            >
                                                <Badge variant="outline" className="shrink-0 font-mono">
                                                    Row {error.rowNumber}
                                                </Badge>
                                                <div className="flex-1">
                                                    <span className="font-semibold">{error.field}:</span>{" "}
                                                    <span className="text-muted-foreground">{error.message}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {importResult.warnings.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-600">
                                        <IconAlertCircle className="size-4" />
                                        Warnings ({importResult.warnings.length})
                                    </h3>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {importResult.warnings.map((warning, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-sm border border-amber-100 dark:border-amber-900/30"
                                            >
                                                <Badge variant="outline" className="shrink-0 font-mono border-amber-200 text-amber-700 dark:text-amber-400">
                                                    Row {warning.rowNumber}
                                                </Badge>
                                                <div className="flex-1 text-amber-800 dark:text-amber-200">
                                                    <span className="font-semibold">{warning.field}:</span>{" "}
                                                    <span>{warning.message}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {importResult.errorCount === 0 && (
                                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                    <IconCircleCheck className="size-5 text-green-600" />
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        All employees imported successfully! You can now view them in the employee list.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t">
                                <Button onClick={() => router.push("/management/human-resource/employee-info")}>
                                    View Employees
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFile(null)
                                        setImportResult(null)
                                    }}
                                >
                                    Import Another File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
