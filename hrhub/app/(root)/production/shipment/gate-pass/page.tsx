"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconPrinter, IconFileText, IconCheck } from "@tabler/icons-react"

export default function GatePassPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <IconFileText className="size-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gate Pass</h1>
                        <p className="text-muted-foreground">Issue and manage security clearance passes for outgoing goods.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconPrinter className="size-4 mr-2" />
                        Reprint Last
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        <IconCheck className="size-4 mr-2" />
                        Approve Pass
                    </Button>
                </div>
            </div>

            <Card className="border-none bg-accent/5 max-w-4xl mx-auto">
                <CardHeader className="text-center border-b pb-6">
                    <CardTitle className="text-xl uppercase tracking-widest text-muted-foreground">Gate Pass Generator</CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Shipment Reference</label>
                                <div className="flex gap-2">
                                    <Input placeholder="SH-2026-001" />
                                    <Button variant="secondary" size="icon"><IconSearch className="size-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Destination</label>
                                <Input placeholder="Chittagong Port" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Items Description</label>
                                <Input placeholder="1,200 Cartons of Garments" />
                            </div>
                        </div>
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Vehicle Information</label>
                                <Input placeholder="DH-METRO-KA-1234" disabled />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Driver Contact</label>
                                <Input placeholder="+880123456789" />
                            </div>
                            <div className="pt-6">
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 h-12">
                                    <IconPrinter className="size-5 mr-2" />
                                    Generate & Print Gate Pass
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
