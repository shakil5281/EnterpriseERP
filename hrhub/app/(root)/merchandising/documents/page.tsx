"use client"

import * as React from "react"
import {
    IconFileText,
    IconRefresh,
    IconLoader2,
    IconPlus,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, OrderDocument, Style, StyleDocument } from "@/lib/types/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"

type DocRow = (StyleDocument & { scope: "style"; ref: string }) | (OrderDocument & { scope: "order"; ref: string })

export default function MerchandisingDocumentsPage() {
    const { activeCompanyId } = useCompanyContext()
    const [tab, setTab] = React.useState<"style" | "order">("style")
    const [styles, setStyles] = React.useState<Style[]>([])
    const [orders, setOrders] = React.useState<Order[]>([])
    const [selectedStyleId, setSelectedStyleId] = React.useState("")
    const [selectedOrderId, setSelectedOrderId] = React.useState("")
    const [documents, setDocuments] = React.useState<DocRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [form, setForm] = React.useState({
        documentType: "TechPack",
        fileName: "",
        fileUrl: "",
        version: "1.0",
    })

    const fetchMasters = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            const [styleRows, orderRows] = await Promise.all([
                merchandisingService.getStyles(activeCompanyId),
                merchandisingService.getOrders(activeCompanyId),
            ])
            setStyles(styleRows)
            setOrders(orderRows)
        } catch (error) {
            console.error(error)
        }
    }, [activeCompanyId])

    const fetchDocuments = React.useCallback(async () => {
        if (!activeCompanyId) return
        try {
            setLoading(true)
            const rows: DocRow[] = []

            if (tab === "style") {
                const styleId = selectedStyleId || styles[0]?.id
                if (styleId) {
                    const docs = await merchandisingService.getStyleDocuments(styleId, activeCompanyId)
                    const style = styles.find((s) => s.id === styleId)
                    docs.forEach((d) => rows.push({ ...d, scope: "style", ref: style?.styleNo ?? styleId }))
                }
            } else {
                const orderId = selectedOrderId || orders[0]?.id
                if (orderId) {
                    const docs = await merchandisingService.getOrderDocuments(orderId, activeCompanyId)
                    const order = orders.find((o) => o.id === orderId)
                    docs.forEach((d) => rows.push({ ...d, scope: "order", ref: order?.orderNo ?? orderId }))
                }
            }

            setDocuments(rows)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load documents")
        } finally {
            setLoading(false)
        }
    }, [activeCompanyId, tab, selectedStyleId, selectedOrderId, styles, orders])

    React.useEffect(() => {
        fetchMasters()
    }, [fetchMasters])

    React.useEffect(() => {
        if (styles.length && !selectedStyleId) setSelectedStyleId(styles[0].id)
        if (orders.length && !selectedOrderId) setSelectedOrderId(orders[0].id)
    }, [styles, orders, selectedStyleId, selectedOrderId])

    React.useEffect(() => {
        if (styles.length || orders.length) fetchDocuments()
    }, [fetchDocuments, styles.length, orders.length])

    const handleCreate = async () => {
        if (!activeCompanyId || !form.fileName.trim() || !form.fileUrl.trim()) {
            toast.error("File name and URL are required")
            return
        }
        try {
            const payload = {
                companyId: activeCompanyId,
                documentType: form.documentType,
                fileName: form.fileName.trim(),
                fileUrl: form.fileUrl.trim(),
                version: form.version || undefined,
            }
            if (tab === "style" && selectedStyleId) {
                await merchandisingService.createStyleDocument(selectedStyleId, payload)
            } else if (tab === "order" && selectedOrderId) {
                await merchandisingService.createOrderDocument(selectedOrderId, payload)
            } else {
                toast.error("Select a style or order first")
                return
            }
            toast.success("Document registered")
            setIsCreateOpen(false)
            fetchDocuments()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save document")
        }
    }

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Document Archive</h1>
                    <p className="text-sm text-muted-foreground font-medium">Style and order document repository</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 border border-border rounded-lg" onClick={fetchDocuments}>
                        <IconRefresh className="size-4" />
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 font-semibold">
                                <IconPlus className="size-4 mr-2" />
                                Register Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register Document</DialogTitle>
                                <DialogDescription>Attach a file reference to the selected {tab}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-2">
                                <div className="space-y-2">
                                    <Label className="text-xs">Document Type</Label>
                                    <Input value={form.documentType} onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">File Name</Label>
                                    <Input value={form.fileName} onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">File URL</Label>
                                    <Input value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Version</Label>
                                    <Input value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "style" | "order")}>
                <TabsList>
                    <TabsTrigger value="style">Style Documents</TabsTrigger>
                    <TabsTrigger value="order">Order Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="style" className="mt-4">
                    <NativeSelect className="mb-4 h-10 w-64" value={selectedStyleId} onChange={(e) => setSelectedStyleId(e.target.value)}>
                        {styles.map((s) => (
                            <option key={s.id} value={s.id}>{s.styleNo}</option>
                        ))}
                    </NativeSelect>
                </TabsContent>
                <TabsContent value="order" className="mt-4">
                    <NativeSelect className="mb-4 h-10 w-64" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                        {orders.map((o) => (
                            <option key={o.id} value={o.id}>{o.orderNo}</option>
                        ))}
                    </NativeSelect>
                </TabsContent>
            </Tabs>

            <Card className="border border-border shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <IconLoader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="font-bold text-[10px] uppercase">Reference</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase">File Name</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase">Version</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            No documents found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <IconFileText className="size-4 text-muted-foreground" />
                                                    <span className="font-bold text-sm">{doc.ref}</span>
                                                    <Badge variant="outline" className="text-[10px]">{doc.scope}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm">
                                                    {doc.fileName}
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase">{doc.documentType}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{doc.version ?? "—"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>
        </div>
    )
}
