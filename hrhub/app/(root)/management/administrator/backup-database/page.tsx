"use client"

import * as React from "react"
import { IconDatabase, IconDownload, IconHistory, IconRefresh, IconCloudUpload, IconCheck, IconX, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

// --- Types ---

type BackupStatus = "Success" | "Failed" | "In Progress"

type BackupRecord = {
    id: string
    name: string
    date: string
    size: string
    type: "Auto" | "Manual"
    status: BackupStatus
    duration: string
}

const mockBackupData: BackupRecord[] = [
    { id: "bk_1", name: "hrhub_backup_20240520_0200.sql", date: "2024-05-20 02:00 AM", size: "45.2 MB", type: "Auto", status: "Success", duration: "1m 20s" },
    { id: "bk_2", name: "hrhub_backup_20240519_0200.sql", date: "2024-05-19 02:00 AM", size: "45.1 MB", type: "Auto", status: "Success", duration: "1m 15s" },
    { id: "bk_3", name: "hrhub_manual_20240518_1430.sql", date: "2024-05-18 02:30 PM", size: "45.0 MB", type: "Manual", status: "Success", duration: "1m 10s" },
    { id: "bk_4", name: "hrhub_backup_20240517_0200.sql", date: "2024-05-17 02:00 AM", size: "0 KB", type: "Auto", status: "Failed", duration: "5s" },
]

export default function BackupDatabasePage() {
    const [data, setData] = React.useState<BackupRecord[]>(mockBackupData)
    const [isBackingUp, setIsBackingUp] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [showBackupDialog, setShowBackupDialog] = React.useState(false)

    // --- Columns ---
    const columns: ColumnDef<BackupRecord>[] = [
        {
            accessorKey: "name",
            header: "Backup Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{row.getValue("name")}</span>
                    <span className="text-xs text-muted-foreground">{row.original.id}</span>
                </div>
            )
        },
        {
            accessorKey: "date",
            header: "Date Created",
            cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("date")}</span>
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>
        },
        {
            accessorKey: "size",
            header: "Size",
            cell: ({ row }) => <span className="font-medium">{row.getValue("size")}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as BackupStatus
                return (
                    <div className="flex items-center gap-2">
                        {status === "Success" && <IconCheck className="size-4 text-green-500" />}
                        {status === "Failed" && <IconX className="size-4 text-red-500" />}
                        {status === "In Progress" && <IconLoader className="size-4 animate-spin text-blue-500" />}
                        <span className={status === "Success" ? "text-green-600" : status === "Failed" ? "text-red-600" : "text-blue-600"}>
                            {status}
                        </span>
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            disabled={row.original.status !== "Success"}
                            onClick={() => toast.success(`Downloading ${row.original.name}...`)}
                        >
                            <IconDownload className="size-4 mr-2" />
                            Download
                        </Button>
                    </div>
                )
            }
        }
    ]

    // --- Actions ---
    const handleBackup = () => {
        setShowBackupDialog(true)
    }

    const startBackupProcess = () => {
        setIsBackingUp(true)
        setProgress(0)

        // Mock progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    finalizeBackup()
                    return 100
                }
                return prev + 10
            })
        }, 300)
    }

    const finalizeBackup = () => {
        setIsBackingUp(false)
        setShowBackupDialog(false)
        const newBackup: BackupRecord = {
            id: `bk_${Date.now()}`,
            name: `hrhub_manual_${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}.sql`,
            date: new Date().toLocaleString(),
            size: "45.3 MB",
            type: "Manual",
            status: "Success",
            duration: "30s"
        }
        setData(prev => [newBackup, ...prev])
        toast.success("Database backup completed successfully")
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <IconDatabase className="size-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Database Backup</h1>
                    </div>
                    <p className="text-muted-foreground">Create and manage database backups to ensure data safety.</p>
                </div>
                <Button className="gap-2" onClick={handleBackup}>
                    <IconCloudUpload className="size-4" />
                    Create Backup
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                        <IconHistory className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.find(d => d.status === "Success")?.date.split(' ')[0] || "N/A"}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.find(d => d.status === "Success")?.date.split(' ').slice(1).join(' ') || "No backup"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                        <IconDatabase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.filter(d => d.status === "Success").length} Success, {data.filter(d => d.status === "Failed").length} Failed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                        <IconDatabase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">135 MB</div>
                        <p className="text-xs text-muted-foreground">
                            Approximate storage used
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>Backup History</CardTitle>
                    <CardDescription>
                        A list of all manual and automated system backups.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={data}
                        columns={columns}
                        showColumnCustomizer={false}
                        searchKey="name"
                    />
                </CardContent>
            </Card>

            <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Database Backup</DialogTitle>
                        <DialogDescription>
                            This will create a full backup of the current database state. The system might be slightly slower during this process.
                        </DialogDescription>
                    </DialogHeader>

                    {isBackingUp ? (
                        <div className="py-6 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Backing up data...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="w-full" />
                            <p className="text-xs text-muted-foreground text-center animate-pulse">
                                Please do not close this window.
                            </p>
                        </div>
                    ) : (
                        <div className="py-4">
                            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <IconRefresh className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Attention needed</h3>
                                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                            <p>Ensure no critical operations are running before starting the backup.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!isBackingUp && (
                            <>
                                <Button variant="outline" onClick={() => setShowBackupDialog(false)}>Cancel</Button>
                                <Button onClick={startBackupProcess}>Start Backup</Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
