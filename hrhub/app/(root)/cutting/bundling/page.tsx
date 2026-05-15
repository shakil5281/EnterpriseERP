"use client"

import * as React from "react"
import {
    IconBox,
    IconSearch,
    IconPlus,
    IconFilter,
    IconBarcode,
    IconPrinter
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

const bundles = [
    { id: "BND-5001", cutNo: "CUT-102", style: "JK-402", size: "M", color: "Black", qty: 20, serial: "001-020", status: "Ready" },
    { id: "BND-5002", cutNo: "CUT-102", style: "JK-402", size: "M", color: "Black", qty: 20, serial: "021-040", status: "Issued" },
    { id: "BND-5003", cutNo: "CUT-102", style: "JK-402", size: "L", color: "Black", qty: 20, serial: "041-060", status: "Ready" },
    { id: "BND-5010", cutNo: "CUT-105", style: "TS-109", size: "S", color: "Navy", qty: 30, serial: "001-030", status: "Ready" },
]

export default function BundlingPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-muted/5 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconBox className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bundle Management</h1>
                        <p className="text-sm text-muted-foreground">Manage cut panels, bundle tickets, and tracking.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"><IconPrinter className="mr-2 size-4" /> Print Tickets</Button>
                    <Button size="sm"><IconPlus className="mr-2 size-4" /> Generate Bundles</Button>
                </div>
            </div>

            {/* List */}
            <Card className="border-none shadow-sm overflow-hidden flex-1">
                <div className="p-4 border-b border-muted/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search Bundle ID or Cut No..." className="pl-9 bg-muted/20 border-none" />
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Bundle ID</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Cut No</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Style</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Size / Color</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Serial No</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bundles.map((bd) => (
                            <TableRow key={bd.id} className="group hover:bg-muted/10 border-muted/20">
                                <TableCell className="pl-6 font-bold text-xs text-primary">{bd.id}</TableCell>
                                <TableCell className="text-xs font-mono">{bd.cutNo}</TableCell>
                                <TableCell className="font-bold text-sm">{bd.style}</TableCell>
                                <TableCell className="text-sm">
                                    <span className="font-bold">{bd.size}</span> <span className="text-muted-foreground mx-1">•</span> {bd.color}
                                </TableCell>
                                <TableCell className="text-right text-sm font-bold">{bd.qty}</TableCell>
                                <TableCell className="text-right text-xs font-mono text-muted-foreground">{bd.serial}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`border-none ${bd.status === 'Issued' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                                        }`}>
                                        {bd.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <IconBarcode className="size-4" />
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
