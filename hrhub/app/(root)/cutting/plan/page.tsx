"use client"

import * as React from "react"
import {
    IconClipboardList,
    IconPlus,
    IconSearch,
    IconFilter,
    IconPrinter,
    IconDotsVertical
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const cutPlans = [
    { id: "CP-2026-001", style: "JK-402", buyer: "H&M", color: "Jet Black", orderQty: 12000, planQty: 12500, ratio: "S:1 M:2 L:2 XL:1", date: "2026-01-25", status: "Approved" },
    { id: "CP-2026-002", style: "TS-109", buyer: "Zara", color: "Navy", orderQty: 24500, planQty: 25000, ratio: "S:2 M:3 L:3 XL:2", date: "2026-01-28", status: "Draft" },
    { id: "CP-2026-003", style: "PN-882", buyer: "Target", color: "Olive", orderQty: 8500, planQty: 8800, ratio: "28:1 30:2 32:2 34:1", date: "2026-01-30", status: "In Progress" },
]

export default function CuttingPlanPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 bg-muted/5 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconClipboardList className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cutting Plans</h1>
                        <p className="text-sm text-muted-foreground">Plan and approve cutting quantities and size ratios.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}><IconPrinter className="mr-2 size-4" /> Print Plan</Button>
                    <Button size="sm"><IconPlus className="mr-2 size-4" /> New Plan</Button>
                </div>
            </div>

            {/* List */}
            <Card className="border-none shadow-sm overflow-hidden flex-1">
                <div className="p-4 border-b border-muted/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search Plan ID or Style..." className="pl-9 bg-muted/20 border-none" />
                    </div>
                    <Button variant="outline" size="sm"><IconFilter className="mr-2 size-4" /> Filter</Button>
                </div>

                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Plan ID</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Style Detail</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Color</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Order Qty</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Plan Qty</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Marker Ratio</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cutPlans.map((plan) => (
                            <TableRow key={plan.id} className="group hover:bg-muted/10 border-muted/20">
                                <TableCell className="pl-6 font-bold text-xs text-primary">{plan.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{plan.style}</span>
                                        <span className="text-xs text-muted-foreground">{plan.buyer}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{plan.color}</TableCell>
                                <TableCell className="text-right text-sm font-medium">{plan.orderQty.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-sm font-bold">{plan.planQty.toLocaleString()}</TableCell>
                                <TableCell className="text-xs font-mono bg-muted/20 px-2 py-1 rounded inline-block mx-2">{plan.ratio}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{plan.date}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={plan.status === 'Approved' ? 'default' : plan.status === 'In Progress' ? 'secondary' : 'outline'} className="text-[10px]">
                                        {plan.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><IconDotsVertical className="size-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Create Marker</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
