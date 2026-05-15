"use client"

import React from "react"
import { IconArrowRight, IconSend, IconTruck, IconBuildingFactory2, IconChecklist } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SendToSewingPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-cyan-600 dark:text-cyan-500">Send to Sewing</h2>
                    <p className="text-muted-foreground">Logistics and transition management from Cutting Floor to Sewing Lines</p>
                </div>
                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20">
                    <IconSend className="h-4 w-4" />
                    New Dispatch
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Transit Manifest</CardTitle>
                                <CardDescription>Consignments currently on the move</CardDescription>
                            </div>
                            <IconTruck className="h-5 w-5 text-cyan-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-cyan-500/5">
                                    <TableRow>
                                        <TableHead>Gate Pass #</TableHead>
                                        <TableHead>Target Line</TableHead>
                                        <TableHead>Style Ref</TableHead>
                                        <TableHead className="text-right">Bundle Count</TableHead>
                                        <TableHead className="text-right">Total Pcs</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { pass: "GP-8831", line: "Line 04 (A)", style: "Zara Slim", bundles: 24, pcs: 480, status: "In Transit" },
                                        { pass: "GP-8832", line: "Line 12 (B)", style: "Levis 501", bundles: 50, pcs: 1000, status: "Delivered" },
                                        { pass: "GP-8833", line: "Line 08 (A)", style: "Nike Tee", bundles: 15, pcs: 300, status: "Loading" },
                                    ].map((item) => (
                                        <TableRow key={item.pass} className="hover:bg-cyan-50/10">
                                            <TableCell className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">{item.pass}</TableCell>
                                            <TableCell className="text-xs font-bold">{item.line}</TableCell>
                                            <TableCell className="text-xs">{item.style}</TableCell>
                                            <TableCell className="text-right font-mono">{item.bundles}</TableCell>
                                            <TableCell className="text-right font-black font-mono">{item.pcs}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'Delivered' ? 'default' : 'secondary'} className={item.status === 'In Transit' ? 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20' : ''}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-t-4 border-t-cyan-500">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Line Priorities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 4, 8, 12].map(line => (
                                <div key={line} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <IconBuildingFactory2 className="h-4 w-4 text-cyan-500" />
                                        <span className="text-xs font-black">LINE {line}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-rose-500 border-rose-500/20">Critical</Badge>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                Line Status Dashboard
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-2xl bg-cyan-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <IconChecklist className="h-16 w-16" />
                        </div>
                        <p className="text-[10px] font-bold uppercase opacity-80">Total Sent Today</p>
                        <p className="text-4xl font-black mt-1">4,250</p>
                        <p className="text-[10px] mt-4 font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded inline-block">Units Dispatched</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
