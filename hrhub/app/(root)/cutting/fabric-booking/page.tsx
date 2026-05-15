"use client"

import React from "react"
import { IconTexture, IconPlus, IconSearch, IconArrowUpRight } from "@tabler/icons-react"
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
import { Progress } from "@/components/ui/progress"

export default function FabricBookingPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">Fabric Booking</h2>
                    <p className="text-muted-foreground">Order-wise fabric allocation and consumption tracking</p>
                </div>
                <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                    <IconPlus className="h-4 w-4" />
                    New Booking
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: "Total Booked", value: "45,000 Yds", color: "text-amber-600" },
                    { label: "In-House", value: "32,500 Yds", color: "text-emerald-600" },
                    { label: "Used", value: "18,200 Yds", color: "text-blue-600" },
                    { label: "Pending", value: "12,500 Yds", color: "text-rose-600" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-card/60">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                            <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <IconTexture className="h-5 w-5 text-amber-500" />
                            Order Allocation Status
                        </CardTitle>
                        <div className="relative w-64">
                            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search orders..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>OrderRef</TableHead>
                                    <TableHead>Fabric Type</TableHead>
                                    <TableHead className="text-right">Requirement</TableHead>
                                    <TableHead className="text-right">Issued</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { ref: "ORD-9921", type: "100% Cotton Twill", req: "15,000 Yds", issued: "12,000 Yds", progress: 80 },
                                    { ref: "ORD-8832", type: "Denim 12oz Indigo", req: "8,000 Yds", issued: "8,000 Yds", progress: 100 },
                                    { ref: "ORD-7712", type: "Single Jersey (White)", req: "25,000 Yds", issued: "5,000 Yds", progress: 20 },
                                ].map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-bold text-xs">{row.ref}</TableCell>
                                        <TableCell className="text-xs">{row.type}</TableCell>
                                        <TableCell className="text-right font-mono">{row.req}</TableCell>
                                        <TableCell className="text-right font-mono text-emerald-600">{row.issued}</TableCell>
                                        <TableCell className="w-48">
                                            <div className="flex items-center gap-2">
                                                <Progress value={row.progress} className="h-1.5" />
                                                <span className="text-[10px] font-bold">{row.progress}%</span>
                                            </div>
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
