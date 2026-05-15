"use client"

import * as React from "react"

import {
    IconFileText,
    IconLoader2,
    IconFileUpload,
    IconEye,
    IconTrash,
    IconHistory
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { merchandisingService, Style, TechPack } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

export default function TechPacksPage() {
    const [techPacks, setTechPacks] = React.useState<TechPack[]>([])
    const [styles, setStyles] = React.useState<Style[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [uploadData, setUploadData] = React.useState<Partial<TechPack>>({
        styleId: 0,
        version: "1.0",
        fileUrl: ""
    })

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const packs = await merchandisingService.getAllTechPacks(1)
            setTechPacks(packs)

            // Also load styles for the upload dialog
            const buyers = await merchandisingService.getBuyers(1)
            if (buyers.length > 0) {
                const stylesList = await merchandisingService.getStyles(buyers[0].id)
                setStyles(stylesList)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load tech packs")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpload = async () => {
        if (!uploadData.styleId || uploadData.styleId === 0) {
            toast.error("Please select a style")
            return
        }
        if (!uploadData.fileUrl || uploadData.fileUrl.trim() === "") {
            toast.error("Please provide a specification URL or file path")
            return
        }
        try {
            setLoading(true)
            await merchandisingService.createTechPack({
                ...uploadData
            })
            toast.success("Tech Pack registered successfully")
            setIsUploadOpen(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Failed to register tech pack")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await merchandisingService.deleteTechPack(id)
            toast.success("Tech Pack deleted")
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error("Delete failed")
        }
    }

    const columns: ColumnDef<TechPack>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs font-mono opacity-60">{(row.index + 1).toString().padStart(2, '0')}</span>,
            size: 40
        },
        {
            accessorKey: "style.styleNumber",
            header: "Style REF",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.original.style?.styleNumber || "N/A"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.style?.productType}</span>
                </div>
            )
        },
        {
            accessorKey: "version",
            header: "Version",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-bold text-[10px]">
                    V:{row.getValue("version")}
                </Badge>
            )
        },
        {
            accessorKey: "uploadDate",
            header: "Released",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {format(new Date(row.getValue("uploadDate")), "MMM dd, yyyy")}
                </span>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary shadow-sm hover:bg-primary/10">
                        <IconEye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(row.original.id)}>
                        <IconTrash className="size-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <IconFileText className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tech Packs</h1>
                        <p className="text-muted-foreground text-sm">Technical specifications and design archives</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="font-bold" onClick={fetchData}>
                        <IconLoader2 className={cn("size-3.5 mr-2", loading && "animate-spin")} />
                        Sync
                    </Button>
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 shadow-md">
                                <IconFileUpload className="size-4" />
                                Register Pack
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Register Tech Pack</DialogTitle>
                                <DialogDescription>Associate a technical specification file with a style</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Associated Style</Label>
                                    <NativeSelect
                                        value={uploadData.styleId}
                                        onChange={(e) => setUploadData({ ...uploadData, styleId: parseInt(e.target.value) })}
                                    >
                                        <option value="0">Select Style Reference</option>
                                        {styles.map(s => (
                                            <option key={s.id} value={s.id}>{s.styleNumber} - {s.productType}</option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Version Number</Label>
                                        <Input
                                            value={uploadData.version}
                                            placeholder="e.g. 1.2"
                                            onChange={(e) => setUploadData({ ...uploadData, version: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Specification URL</Label>
                                        <Input
                                            value={uploadData.fileUrl}
                                            placeholder="https://..."
                                            onChange={(e) => setUploadData({ ...uploadData, fileUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleUpload}>Save Technical Pack</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="px-6">
                <DataTable
                    columns={columns}
                    data={techPacks}
                    isLoading={loading}
                    searchKey="style_styleNumber"
                    showTabs={false}
                    enableDrag={true}
                    enableSelection={true}
                />
            </div>
        </div>
    )
}
