"use client"

import React from "react"
import { IconFileAnalytics, IconPrinter, IconDownload, IconChartLine, IconCalendarStats } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CuttingReportPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cutting Analysis Reports</h2>
                    <p className="text-muted-foreground">Comprehensive performance and efficiency metrics for the cutting department</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2"><IconPrinter className="h-4 w-4" /> Print</Button>
                    <Button className="gap-2"><IconDownload className="h-4 w-4" /> XLS Export</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-sm bg-card/60 overflow-hidden">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <IconCalendarStats className="h-4 w-4 text-primary" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Period</p>
                            <Select defaultValue="this-month">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this-week">This Week</SelectItem>
                                    <SelectItem value="this-month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Floor</p>
                            <Select defaultValue="all">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Floors</SelectItem>
                                    <SelectItem value="floor-1">Floor 01</SelectItem>
                                    <SelectItem value="floor-2">Floor 02</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-none bg-indigo-500/5 shadow-sm border-l-4 border-l-indigo-500">
                    <div className="p-6 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-xs">Efficiency Benchmark</h3>
                                <p className="text-muted-foreground text-xs mt-1">Target vs Actual Production</p>
                            </div>
                            <IconChartLine className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div className="flex items-end gap-10 mt-4">
                            <div>
                                <p className="text-3xl font-black text-indigo-900 dark:text-indigo-200 tracking-tighter">92.4%</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Cutting Efficiency</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-indigo-900 dark:text-indigo-200 tracking-tighter">1.8%</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Variance Rate</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-card/60 mt-6">
                <CardHeader>
                    <CardTitle className="text-lg">Production Analytics Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Style</TableHead>
                                <TableHead className="text-right">Lay Count</TableHead>
                                <TableHead className="text-right">Pcs Produced</TableHead>
                                <TableHead className="text-right">Efficiency</TableHead>
                                <TableHead className="text-right">Wastage %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { date: "2024-03-01", style: "Levis 501", lay: 8, pcs: 1600, eff: "94.2%", waste: "1.2%" },
                                { date: "2024-03-02", style: "Levis 501", lay: 12, pcs: 2400, eff: "91.8%", waste: "1.5%" },
                                { date: "2024-03-02", style: "Zara Slim", lay: 5, pcs: 500, eff: "88.5%", waste: "2.1%" },
                            ].map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell className="text-xs">{row.date}</TableCell>
                                    <TableCell className="text-xs font-bold uppercase">{row.style}</TableCell>
                                    <TableCell className="text-right font-mono">{row.lay}</TableCell>
                                    <TableCell className="text-right font-black font-mono">{row.pcs}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-emerald-600 font-black">{row.eff}</span>
                                    </TableCell>
                                    <TableCell className="text-right text-rose-500 font-bold">{row.waste}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
