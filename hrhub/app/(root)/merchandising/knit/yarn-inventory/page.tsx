"use client"

import * as React from "react"
import { IconPackage, IconSearch, IconAlertTriangle } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const mockYarn = [
    { id: 1, count: "30/1", comp: "100% Cotton", brand: "Akij", stock: 1250, unit: "Kg" },
    { id: 2, count: "26/1", comp: "95/5 CVC", brand: "Keya", stock: 450, unit: "Kg" },
    { id: 3, count: "34/1", comp: "100% Cotton", brand: "NRZ", stock: 85, unit: "Kg" },
]

export default function YarnInventoryPage() {
    return (
        <div className="flex flex-col gap-8 py-6 px-4 lg:px-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Yarn Inventory</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-orange-600">Material Management / Raw Stores</p>
                </div>
                <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input placeholder="Search yarn count..." className="pl-9 h-10 w-64 bg-white border-none shadow-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">Total Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black italic">1,785 Kg</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">Low Stock Alert</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <div className="text-3xl font-black italic">2 Items</div>
                        <IconAlertTriangle className="size-5" />
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Count</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Composition</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Brand</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Stock</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockYarn.map(y => (
                                <TableRow key={y.id} className="hover:bg-slate-50/50">
                                    <TableCell className="px-8 py-5 font-black text-slate-700">{y.count}</TableCell>
                                    <TableCell className="px-8 py-5 font-bold text-slate-500">{y.comp}</TableCell>
                                    <TableCell className="px-8 py-5 text-slate-600">{y.brand}</TableCell>
                                    <TableCell className="px-8 py-5 font-black text-slate-900">{y.stock} {y.unit}</TableCell>
                                    <TableCell className="px-8 py-5">
                                        <Badge className={y.stock < 100 ? "bg-red-500" : "bg-green-500"}>
                                            {y.stock < 100 ? "Low" : "Optimal"}
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
