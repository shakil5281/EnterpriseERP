"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconPlus, IconSearch, IconTruckDelivery, IconPackageExport, IconMapPin } from "@tabler/icons-react"

export default function ShipmentListPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <IconPackageExport className="size-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Shipment List</h1>
                        <p className="text-muted-foreground">Monitor and coordinate all outgoing shipments and logistics operations.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconMapPin className="size-4 mr-2" />
                        Track All
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <IconPlus className="size-4 mr-2" />
                        Create Shipment
                    </Button>
                </div>
            </div>

            <Card className="border-none bg-accent/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">Active Shipments</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input placeholder="Search shipment ID..." className="pl-8 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-background/50 text-center p-6">
                        <div className="size-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                            <IconTruckDelivery className="size-8 text-blue-600" />
                        </div>
                        <p className="text-muted-foreground font-medium">Your shipment queue is currently empty.</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">New shipments will appear here once they are approved for dispatch.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
