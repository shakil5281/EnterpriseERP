"use client"

import * as React from "react"
import {
    IconArrowRight,
    IconSearch,
    IconPlus,
    IconReceipt,
    IconTruckDelivery
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const challans = [
    { id: "CH-6001", date: "2026-01-30", style: "JK-402", line: "Line 05", bundles: 45, qty: 900, status: "Received" },
    { id: "CH-6002", date: "2026-01-30", style: "JK-402", line: "Line 06", bundles: 50, qty: 1000, status: "In Transit" },
    { id: "CH-6005", date: "2026-01-29", style: "TS-109", line: "Line 02", bundles: 120, qty: 3600, status: "Received" },
]

export default function IssuePage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-muted/5 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconTruckDelivery className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Issue to Sewing</h1>
                        <p className="text-sm text-muted-foreground">Transfer cut panels to sewing lines via Challan.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm"><IconPlus className="mr-2 size-4" /> New Challan</Button>
                </div>
            </div>

            {/* List */}
            <Card className="border-none shadow-sm overflow-hidden flex-1">
                <div className="p-4 border-b border-muted/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search Challan No..." className="pl-9 bg-muted/20 border-none" />
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Challan No</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Style</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Destination Line</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Bundles</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Total Qty</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {challans.map((ch) => (
                            <TableRow key={ch.id} className="group hover:bg-muted/10 border-muted/20">
                                <TableCell className="pl-6 font-bold text-xs text-primary">{ch.id}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{ch.date}</TableCell>
                                <TableCell className="font-bold text-sm">{ch.style}</TableCell>
                                <TableCell className="text-sm font-medium text-foreground">{ch.line}</TableCell>
                                <TableCell className="text-right text-sm">{ch.bundles}</TableCell>
                                <TableCell className="text-right text-sm font-bold">{ch.qty}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`border-none ${ch.status === 'Received' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                                        }`}>
                                        {ch.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <IconReceipt className="size-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
