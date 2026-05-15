"use client"

import React from "react"
import { IconClipboardList, IconPlus, IconSearch, IconFilter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CuttingPlanningPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cutting Planning</h2>
                    <p className="text-muted-foreground">Strategic scheduling of daily cutting batches and priorities</p>
                </div>
                <Button className="gap-2">
                    <IconPlus className="h-4 w-4" />
                    Create New Plan
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <IconClipboardList className="h-5 w-5 text-primary" />
                            Active Plans
                        </CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search plans..." className="pl-8" />
                            </div>
                            <Button variant="outline" size="icon">
                                <IconFilter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Plan ID</TableHead>
                                    <TableHead>Style / Order</TableHead>
                                    <TableHead>Target Date</TableHead>
                                    <TableHead className="text-right">Planned Qty</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { id: "PLN-001", style: "Levis Skinny 501", order: "PO-2024-001", date: "2024-03-05", qty: 2500, priority: "High", status: "In Progress" },
                                    { id: "PLN-002", style: "Nike Sport Tee", order: "PO-2024-005", date: "2024-03-06", qty: 5000, priority: "Normal", status: "Pending" },
                                ].map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">{plan.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{plan.style}</span>
                                                <span className="text-xs text-muted-foreground">{plan.order}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{plan.date}</TableCell>
                                        <TableCell className="text-right font-mono">{plan.qty.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={plan.priority === "High" ? "destructive" : "secondary"}>
                                                {plan.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={plan.status === "In Progress" ? "default" : "outline"}>
                                                {plan.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
