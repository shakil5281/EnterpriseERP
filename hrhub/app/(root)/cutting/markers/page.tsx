"use client"

import * as React from "react"
import {
    IconRulerMeasure,
    IconSearch,
    IconPlus,
    IconFilter
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

const markers = [
    { id: "MK-3001", style: "JK-402", ratio: "S:1 M:2 L:2", length: "7.5 yds", width: "58 inch", eff: "85%", parts: 5, layers: 80, status: "Active" },
    { id: "MK-3002", style: "JK-402", ratio: "XL:2 XXL:2", length: "6.8 yds", width: "58 inch", eff: "82%", parts: 5, layers: 60, status: "Active" },
    { id: "MK-3005", style: "TS-109", ratio: "S:2 M:2 L:2", length: "5.2 yds", width: "60 inch", eff: "90%", parts: 4, layers: 100, status: "Pending" },
]

export default function MarkersPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-muted/5 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconRulerMeasure className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Marker Management</h1>
                        <p className="text-sm text-muted-foreground">Define cutting markers, ratios, and efficiency.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm"><IconPlus className="mr-2 size-4" /> New Marker</Button>
                </div>
            </div>

            {/* List */}
            <Card className="border-none shadow-sm overflow-hidden flex-1">
                <div className="p-4 border-b border-muted/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search Marker ID / Style..." className="pl-9 bg-muted/20 border-none" />
                    </div>
                    <Button variant="outline" size="sm"><IconFilter className="mr-2 size-4" /> Filter</Button>
                </div>

                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Marker No</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Style</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Size Ratio</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Length</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Width</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Parts</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Efficiency</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {markers.map((mk) => (
                            <TableRow key={mk.id} className="group hover:bg-muted/10 border-muted/20">
                                <TableCell className="pl-6 font-bold text-xs text-primary">{mk.id}</TableCell>
                                <TableCell className="font-bold text-sm">{mk.style}</TableCell>
                                <TableCell className="font-mono text-xs max-w-[150px] truncate" title={mk.ratio}>{mk.ratio}</TableCell>
                                <TableCell className="text-sm">{mk.length}</TableCell>
                                <TableCell className="text-sm">{mk.width}</TableCell>
                                <TableCell className="text-right text-sm">{mk.parts}</TableCell>
                                <TableCell className="text-center font-bold text-emerald-600">{mk.eff}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`border-none ${mk.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                        }`}>
                                        {mk.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
