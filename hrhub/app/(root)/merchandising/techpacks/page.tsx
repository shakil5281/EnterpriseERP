"use client"

import * as React from "react"
import {
    IconFileText,
    IconLoader2,
    IconExternalLink,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Style, StyleDocument } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"

export default function TechPacksPage() {
    const { activeCompanyId } = useCompanyContext()
    const [styles, setStyles] = React.useState<Style[]>([])
    const [selectedStyleId, setSelectedStyleId] = React.useState("")
    const [documents, setDocuments] = React.useState<StyleDocument[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchStyles = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            const styleRows = await merchandisingService.getStyles(activeCompanyId)
            setStyles(styleRows)
            if (!selectedStyleId && styleRows.length > 0) setSelectedStyleId(styleRows[0].id)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load styles")
        }
    }, [activeCompanyId, selectedStyleId])

    const fetchDocuments = React.useCallback(async () => {
        if (!activeCompanyId || !selectedStyleId) return
        try {
            setLoading(true)
            const docs = await merchandisingService.getStyleDocuments(selectedStyleId, activeCompanyId)
            setDocuments(docs.filter((d) => d.documentType.toLowerCase().includes("tech") || d.documentType === "TechPack"))
        } catch (error) {
            console.error(error)
            toast.error("Failed to load style documents")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId, selectedStyleId])

    React.useEffect(() => {
        fetchStyles()
    }, [fetchStyles])

    React.useEffect(() => {
        if (selectedStyleId) fetchDocuments()
    }, [selectedStyleId, fetchDocuments])

    const selectedStyle = styles.find((s) => s.id === selectedStyleId)

    const columns: ColumnDef<StyleDocument>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs font-mono opacity-60">{(row.index + 1).toString().padStart(2, "0")}</span>,
            size: 40,
        },
        {
            accessorKey: "fileName",
            header: "Document",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.original.fileName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{selectedStyle?.styleNo}</span>
                </div>
            ),
        },
        {
            accessorKey: "documentType",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-bold text-[10px]">
                    {row.original.documentType}
                </Badge>
            ),
        },
        {
            accessorKey: "version",
            header: "Version",
            cell: ({ row }) => <span className="text-xs">{row.original.version ?? "—"}</span>,
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                        <a href={row.original.fileUrl} target="_blank" rel="noreferrer">
                            <IconExternalLink className="size-4" />
                        </a>
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconFileText className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tech Packs</h1>
                        <p className="text-muted-foreground text-sm">Style documents from the merchandising API</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <NativeSelect className="h-9 w-56" value={selectedStyleId} onChange={(e) => setSelectedStyleId(e.target.value)}>
                        <option value="">Select style</option>
                        {styles.map((s) => (
                            <option key={s.id} value={s.id}>{s.styleNo}</option>
                        ))}
                    </NativeSelect>
                    <Button variant="outline" size="sm" className="font-bold" onClick={fetchDocuments}>
                        <IconLoader2 className={cn("size-3.5 mr-2", loading && "animate-spin")} />
                        Sync
                    </Button>
                </div>
            </div>

            <div className="px-6">
                <DataTable
                    columns={columns}
                    data={documents}
                    isLoading={loading}
                    searchKey="fileName"
                    showTabs={false}
                    enableSelection={false}
                />
            </div>
        </div>
    )
}
