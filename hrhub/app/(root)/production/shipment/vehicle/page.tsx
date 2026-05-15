"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconTruck, IconUser, IconId, IconLicense, IconPlus } from "@tabler/icons-react"

export default function VehicleEntryPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-500/10 rounded-lg">
                        <IconTruck className="size-6 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Vehicle Entry</h1>
                        <p className="text-muted-foreground">Register and track transport vehicles and driver information.</p>
                    </div>
                </div>
                <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white">
                    <IconPlus className="size-4 mr-2" />
                    Add Vehicle
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-none bg-accent/5">
                    <CardHeader>
                        <CardTitle className="text-base">Quick Registration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <IconLicense className="size-3" /> Vehicle Number
                            </div>
                            <Input placeholder="D-Metro-11-2233" />
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <IconUser className="size-3" /> Driver Name
                            </div>
                            <Input placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <IconId className="size-3" /> License Number
                            </div>
                            <Input placeholder="DL-123456789" />
                        </div>
                        <Button className="w-full mt-4">Save Entry</Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none bg-accent/5">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Vehicles Inside Factory</CardTitle>
                            <div className="relative w-48">
                                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input placeholder="Search..." className="pl-8 h-8 text-xs" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
                            <p className="text-muted-foreground text-sm">No vehicles registered at this time.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
