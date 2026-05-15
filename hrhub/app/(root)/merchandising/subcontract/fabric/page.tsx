"use client"

import * as React from "react"
import { IconExchange, IconPlus, IconSearch, IconTruckReturn, IconTruckDelivery } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const mockSubcontract = [
    { id: 1, orderNo: "SUB-001", fabric: "100% Cotton S/J", qty: 2500, type: "Dyeing", status: "Sent" },
    { id: 2, orderNo: "SUB-002", fabric: "Cotton Rib 1x1", qty: 800, type: "Printing", status: "Received" },
    { id: 3, orderNo: "SUB-003", fabric: "CVC Fleece", qty: 3200, type: "Brushing", status: "In Process" },
]

export default function SubContractFabricPage() {
    return (
        <div className="flex flex-col gap-8 py-6 px-4 lg:px-6 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Sub-Contract Fabric</h1>
                    <p className="text-sm text-foreground/60 font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500">Operations / External Processing</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search subcontract ID..." className="pl-9 h-10 w-64 bg-card border-border shadow-sm text-foreground" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-blue-600 dark:bg-blue-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">Inbound (Back to Factory)</CardTitle>
                        <IconTruckReturn className="size-5" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic">4,500 Kg</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-indigo-600 dark:bg-indigo-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">Outbound (Sent for Processing)</CardTitle>
                        <IconTruckDelivery className="size-5" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic">6,200 Kg</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-border shadow-sm overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="text-lg font-black uppercase text-foreground">Process Tracking</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="border-border">
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Order ID</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Fabric Type</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Qty (Kg)</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground">Operation</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockSubcontract.map(s => (
                                <TableRow key={s.id} className="hover:bg-muted/10 border-border">
                                    <TableCell className="px-8 py-5 font-black text-blue-600 dark:text-blue-400">{s.orderNo}</TableCell>
                                    <TableCell className="px-8 py-5 font-bold text-muted-foreground">{s.fabric}</TableCell>
                                    <TableCell className="px-8 py-5 font-bold text-foreground">{s.qty.toLocaleString()}</TableCell>
                                    <TableCell className="px-8 py-5 text-center">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border text-muted-foreground">{s.type}</Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-center">
                                        <Badge className={`font-black text-[9px] uppercase text-white shadow-sm shadow-black/10 ${s.status === 'Received' ? 'bg-green-500' :
                                                s.status === 'Sent' ? 'bg-blue-500' : 'bg-orange-500'
                                            }`}>
                                            {s.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
