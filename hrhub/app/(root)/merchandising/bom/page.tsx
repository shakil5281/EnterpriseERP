"use client"

import * as React from "react"
import {
    IconLayersLinked,
    IconSearch,
    IconLoader2,
    IconCalculator,
    IconChevronRight,
    IconScissors,
    IconPackages,
    IconLayoutGrid
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { merchandisingService, StyleOrder } from "@/lib/services/merchandising"
import { toast } from "sonner"

export default function BOMPage() {
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load orders for BOM")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredOrders = orders.filter(o =>
        o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.style?.styleNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconLayersLinked className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bill of Materials</h1>
                        <p className="text-muted-foreground text-sm">Define raw material requirements and specifications</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search styles..."
                            className="pl-9 h-9 w-64 bg-muted/20 border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button size="sm" variant="secondary" className="font-bold" onClick={fetchData}>Refresh</Button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-6 px-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Style Order Registry</CardTitle>
                        <CardDescription>BOM definition required for material booking</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <IconLoader2 className="size-8 animate-spin text-primary" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Loading Data...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Style REF</TableHead>
                                        <TableHead className="font-bold text-xs">Order REF</TableHead>
                                        <TableHead className="font-bold text-xs">Partner</TableHead>
                                        <TableHead className="font-bold text-xs text-center">BOM Status</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                                        <IconScissors className="size-4" />
                                                    </div>
                                                    <span className="font-semibold">{order.style?.styleNumber || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{order.poNumber}</TableCell>
                                            <TableCell className="text-sm font-medium">{order.buyer?.name || "N/A"}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase border-muted text-muted-foreground">Pending</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" className="text-xs font-bold gap-2 text-primary">
                                                    Build BOM
                                                    <IconChevronRight className="size-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Secondary Views */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none shadow-sm hover:bg-muted/30 transition-colors cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Calculators</h3>
                            <IconCalculator className="size-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold">Global Consumption</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Average fabric usage per garment category</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm hover:bg-muted/30 transition-colors cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Library</h3>
                            <IconPackages className="size-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold">Trim Database</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Standard buttons, threads, and accessories</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm hover:bg-muted/30 transition-colors cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Presets</h3>
                            <IconLayoutGrid className="size-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold">BOM Templates</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Pre-defined material structures for tops and bottoms</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
