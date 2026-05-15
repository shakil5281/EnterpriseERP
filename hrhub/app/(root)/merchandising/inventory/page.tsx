"use client"

import * as React from "react"
import {
    IconSearch,
    IconFilter,
    IconAlertTriangle,
    IconCheck,
    IconLayoutGrid,
    IconRefresh,
    IconPackage,
    IconArrowDownLeft,
    IconBuildingBridge
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const inventoryItems = [
    {
        id: "INV-001",
        name: "Cotton Jersey 160 GSM",
        color: "Jet Black",
        req: 5000,
        received: 4800,
        unit: "kg",
        status: "Shortage",
        batches: [
            { id: "B-101", qty: 2000, loc: "Rack A-12" },
            { id: "B-102", qty: 2800, loc: "Rack A-14" },
        ]
    },
    {
        id: "INV-002",
        name: "YKK Metal Zipper",
        color: "Antique Brass",
        req: 12000,
        received: 12000,
        unit: "pcs",
        status: "Completed",
        batches: [
            { id: "B-201", qty: 12000, loc: "Bin C-05" },
        ]
    },
    {
        id: "INV-003",
        name: "Polyester Thread 40/2",
        color: "Navy Blue",
        req: 500,
        received: 0,
        unit: "cones",
        status: "Pending",
        batches: []
    }
]

export default function InventoryPage() {
    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 bg-white min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
                    <p className="text-sm text-slate-500 font-medium">Material stock, consumption tracking and requirement management</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-slate-200 rounded-lg text-slate-600"
                    >
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button className="h-10 px-6 font-semibold shadow-sm shadow-indigo-200">
                        <IconPackage className="size-4 mr-2" />
                        Adjust Stock
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Items" value="124" icon={IconPackage} color="text-indigo-600" bgColor="bg-indigo-50" />
                <KPICard title="In-House Rate" value="82.4%" icon={IconBuildingBridge} color="text-emerald-600" bgColor="bg-emerald-50" />
                <KPICard title="Pending Order" value="12" icon={IconArrowDownLeft} color="text-blue-600" bgColor="bg-blue-50" />
                <KPICard title="Low Stock" value="03" icon={IconAlertTriangle} color="text-rose-600" bgColor="bg-rose-50" />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                        placeholder="Search materials by name or code..."
                        className="pl-9 h-11 border-slate-200 focus:border-indigo-500 rounded-xl"
                    />
                </div>
                <Button variant="outline" className="h-11 px-6 font-semibold border-slate-200 text-slate-600">
                    <IconFilter className="size-4 mr-2" />
                    Filter Catalog
                </Button>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventoryItems.map((item) => {
                    const percentage = Math.min(100, Math.round((item.received / item.req) * 100))

                    return (
                        <Card key={item.id} className="border-slate-200 shadow-none hover:border-indigo-200 transition-all overflow-hidden group">
                            <div className={cn(
                                "h-1.5",
                                item.status === 'Completed' ? 'bg-emerald-500' :
                                    item.status === 'Shortage' ? 'bg-rose-500' :
                                        'bg-amber-500'
                            )} />
                            <CardHeader className="p-5 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.id}</span>
                                        <CardTitle className="text-base font-bold text-slate-900 leading-tight">{item.name}</CardTitle>
                                        <CardDescription className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <div className="size-2 rounded-full bg-slate-200" style={{ backgroundColor: item.color.toLowerCase().replace(' ', '') }} />
                                            {item.color}
                                        </CardDescription>
                                    </div>
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100",
                                        item.status === 'Completed' ? 'text-emerald-600' :
                                            item.status === 'Shortage' ? 'text-rose-600' :
                                                'text-amber-600'
                                    )}>
                                        {item.status === 'Completed' ? <IconCheck className="size-4" /> :
                                            item.status === 'Shortage' ? <IconAlertTriangle className="size-4" /> :
                                                <IconLayoutGrid className="size-4" />}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-5">
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight text-slate-400">
                                        <span>Inventory Progress</span>
                                        <span className={cn(
                                            item.received < item.req ? "text-amber-600" : "text-emerald-600"
                                        )}>
                                            {percentage}% Received
                                        </span>
                                    </div>
                                    <Progress value={percentage} className="h-1.5 bg-slate-100" />
                                    <div className="flex justify-between text-xs font-bold pt-1">
                                        <span className="text-indigo-600">{item.received.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase ml-0.5">{item.unit}</span></span>
                                        <span className="text-slate-400">{item.req.toLocaleString()} <span className="text-[10px] font-bold uppercase ml-0.5">{item.unit}</span></span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Storage Batches</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                        {item.batches.length > 0 ? (
                                            item.batches.map((batch) => (
                                                <div key={batch.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                                    <span className="font-bold text-slate-700">{batch.id}</span>
                                                    <span className="font-medium text-slate-400 text-[10px] uppercase font-bold tracking-tighter">{batch.loc}</span>
                                                    <span className="font-bold text-slate-900 tabular-nums">{batch.qty.toLocaleString()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-[10px] text-slate-400 uppercase font-bold tracking-widest italic bg-slate-50/50 rounded-lg">
                                                Zero stock in warehouse
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border border-slate-200 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
                    <h3 className="text-lg font-bold text-slate-900">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
