"use client"

import React from "react"
import { IconBoxSeam, IconBarcode, IconPrinter, IconListCheck, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BundleSystemPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-500">Bundle Management</h2>
                    <p className="text-muted-foreground">Serialization and barcode generation for cut components</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-indigo-500/20 text-indigo-600">
                        <IconPrinter className="h-4 w-4" />
                        Print Batch Tags
                    </Button>
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <IconBarcode className="h-4 w-4" />
                        Generate Serial Range
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: "Active Bundles", value: "852", icon: IconBoxSeam, color: "text-indigo-500" },
                    { label: "Waiting for Tags", value: "110", icon: IconBarcode, color: "text-amber-500" },
                    { label: "Bundled Quantity", value: "24,500", icon: IconListCheck, color: "text-emerald-500" },
                    { label: "Scanned Today", value: "1,240", icon: IconSearch, color: "text-blue-500" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-card/60 backdrop-blur-sm group hover:ring-2 hover:ring-indigo-500/20 transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                                <stat.icon className={`h-4 w-4 ${stat.color} opacity-40`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-black">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm bg-card/60">
                <CardHeader>
                    <CardTitle>Bundle Directory</CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Scan or type Bundle ID..." className="pl-10 h-10 border-indigo-500/20 focus-visible:ring-indigo-500" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            { id: "BND-4401", style: "Casual L/S", size: "M", qty: 20, weight: "1.2kg", status: "Ready" },
                            { id: "BND-4402", style: "Casual L/S", size: "M", qty: 20, weight: "1.2kg", status: "Sent" },
                            { id: "BND-4403", style: "Casual L/S", size: "L", qty: 20, weight: "1.3kg", status: "Ready" },
                            { id: "BND-4404", style: "Casual L/S", size: "L", qty: 20, weight: "1.3kg", status: "Review" },
                        ].map((bundle) => (
                            <div key={bundle.id} className="p-4 rounded-2xl border bg-muted/20 relative group overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${bundle.status === 'Sent' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black font-mono text-indigo-700 dark:text-indigo-400">{bundle.id}</span>
                                    <Badge variant={bundle.status === 'Sent' ? 'outline' : 'default'} className="text-[9px] uppercase tracking-tighter h-4">
                                        {bundle.status}
                                    </Badge>
                                </div>
                                <p className="text-xs font-bold leading-none">{bundle.style}</p>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-muted-foreground/10 text-[10px] font-bold">
                                    <span className="uppercase text-muted-foreground">Size: {bundle.size}</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">Qty: {bundle.qty} Pcs</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
