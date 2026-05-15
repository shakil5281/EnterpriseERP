"use client"

import * as React from "react"
import {
    IconBuildingFactory2,
    IconSearch,
    IconFilter,
    IconTrendingUp,
    IconAlertTriangle,
    IconCheck
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const productionData = [
    {
        id: "JK-402",
        buyer: "H&M",
        orderQty: 12000,
        cutting: 12050,
        sewing: 8500,
        finishing: 7200,
        packing: 6800,
        status: "Production Running",
        efficiency: 68
    },
    {
        id: "TS-109",
        buyer: "Zara",
        orderQty: 25000,
        cutting: 25100,
        sewing: 24800,
        finishing: 24500,
        packing: 24500,
        status: "Pack Complete",
        efficiency: 92
    },
    {
        id: "PN-882",
        buyer: "Target",
        orderQty: 8500,
        cutting: 4200,
        sewing: 1500,
        finishing: 0,
        packing: 0,
        status: "Cutting Phase",
        efficiency: 45
    }
]

export default function ProductionPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-muted/5 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconBuildingFactory2 className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Production Follow-up</h1>
                        <p className="text-sm text-muted-foreground">Track daily output from Cutting to Packing.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search Style..." className="pl-9 h-9 w-64 bg-background border-muted" />
                    </div>
                    <Button variant="outline" size="sm" className="h-9"><IconFilter className="size-4" /></Button>
                </div>
            </div>

            {/* Production Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Cutting", value: "41,350", sub: "pcs", color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "Total Sewing", value: "34,800", sub: "pcs", color: "text-purple-600", bg: "bg-purple-500/10" },
                    { label: "Total Finishing", value: "31,700", sub: "pcs", color: "text-amber-600", bg: "bg-amber-500/10" },
                    { label: "Total Packing", value: "31,300", sub: "pcs", color: "text-emerald-600", bg: "bg-emerald-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{stat.label}</p>
                            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Data Table */}
            <Card className="border-none shadow-sm overflow-hidden flex-1">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Style Ref</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Order Qty</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-blue-600">Cutting</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-purple-600">Sewing</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-amber-600">Finishing</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-emerald-600">Packing</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Completion</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productionData.map((order) => {
                            const completion = Math.round((order.packing / order.orderQty) * 100);
                            return (
                                <TableRow key={order.id} className="group hover:bg-muted/10 border-muted/20">
                                    <TableCell className="pl-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-primary">{order.id}</span>
                                            <span className="text-xs text-muted-foreground font-medium">{order.buyer}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm">{order.orderQty.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium text-sm text-muted-foreground">{order.cutting.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium text-sm text-muted-foreground">{order.sewing.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium text-sm text-muted-foreground">{order.finishing.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-sm">{order.packing.toLocaleString()}</TableCell>
                                    <TableCell className="w-[180px]">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="w-full flex justify-between text-[10px] font-bold">
                                                <span>{completion}%</span>
                                            </div>
                                            <Progress value={completion} className="h-1.5 w-full"
                                                indicatorClassName={completion >= 100 ? "bg-emerald-500" : "bg-primary"}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`border-none ${order.status === 'Pack Complete' ? 'bg-emerald-500/10 text-emerald-600' :
                                                order.status === 'Production Running' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-amber-500/10 text-amber-600'
                                            }`}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
