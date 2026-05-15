"use client"

import * as React from "react"
import {
    IconScale,
    IconSearch,
    IconLoader2,
    IconCalculator,
    IconTrendingUp,
    IconAlertCircle,
    IconDropletFilled,
    IconRulerMeasure,
    IconChevronRight,
    IconRefresh
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { cn } from "@/lib/utils"

export default function ConsumptionPage() {
    const [orders, setOrders] = React.useState<StyleOrder[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await merchandisingService.getOrders(1)
            setOrders(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load consumption data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconScale className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Consumption Logic</h1>
                        <p className="text-muted-foreground text-sm">Calculate fabric and thread requirements</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="font-bold">Wastage Profiles</Button>
                    <Button size="sm" className="gap-2 font-bold" onClick={fetchData}>
                        <IconRefresh className="size-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Content Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-6">
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Consumption Registry</CardTitle>
                                    <CardDescription>Requirements per dozen garments</CardDescription>
                                </div>
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input placeholder="Filter..." className="h-9 w-48 pl-9 bg-muted/20 border-none shrink-0" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 border-t">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <IconLoader2 className="size-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="font-bold text-xs uppercase text-muted-foreground">Style REF</TableHead>
                                            <TableHead className="font-bold text-xs uppercase text-muted-foreground">Product Type</TableHead>
                                            <TableHead className="font-bold text-xs uppercase text-center text-muted-foreground">Body Fabric</TableHead>
                                            <TableHead className="font-bold text-xs uppercase text-center text-muted-foreground">Wastage</TableHead>
                                            <TableHead className="font-bold text-xs uppercase text-right text-muted-foreground">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">{order.style?.styleNumber || "Style REF"}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{order.buyer?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">Knit Top</Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-bold text-sm">2.{(40 + i)} KG</span>
                                                    <span className="text-[10px] text-muted-foreground block">per dozen</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className="bg-primary/10 text-primary font-bold border-none text-[10px]">4.5%</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-primary font-bold">Details</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-none shadow-sm group hover:bg-muted/30 transition-colors cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <IconRulerMeasure className="size-6" />
                                    </div>
                                    <Badge variant="secondary" className="font-bold text-[10px] uppercase">Importer</Badge>
                                </div>
                                <h3 className="text-lg font-bold">Measurement Sheet</h3>
                                <p className="text-muted-foreground text-sm mt-1">Import techpacks to calculate fabric width requirements</p>
                                <Button size="sm" variant="outline" className="mt-6 w-full font-bold h-9">Open Sheet</Button>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm group hover:bg-muted/30 transition-colors cursor-pointer">
                            <CardContent className="p-6 text-white bg-primary rounded-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                        <IconDropletFilled className="size-6" />
                                    </div>
                                    <Badge variant="secondary" className="bg-white/20 text-white border-none font-bold text-[10px] uppercase">Lab Data</Badge>
                                </div>
                                <h3 className="text-lg font-bold">Shrinkage Data</h3>
                                <p className="text-primary-foreground/80 text-sm mt-1">Live feed from lab reports for cushion adjustments</p>
                                <div className="mt-6 pt-4 flex items-center justify-between border-t border-white/20">
                                    <span className="text-[10px] font-bold uppercase opacity-70">Average Shrinkage</span>
                                    <span className="text-sm font-bold">3.4% (W) / 2.1% (L)</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Efficiency Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Marker Efficiency</p>
                                        <h4 className="text-xl font-bold text-primary">88.4%</h4>
                                    </div>
                                    <IconTrendingUp className="size-5 text-emerald-500" />
                                </div>
                                <Progress value={88.4} className="h-2" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Wastage Cushion</p>
                                        <h4 className="text-xl font-bold text-amber-500">5.2%</h4>
                                    </div>
                                    <IconAlertCircle className="size-5 text-amber-500" />
                                </div>
                                <Progress value={52} className="h-2" />
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-primary h-8">View Detailed Report</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
