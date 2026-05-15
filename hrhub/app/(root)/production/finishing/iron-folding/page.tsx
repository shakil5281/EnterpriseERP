"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconDownload, IconShirt, IconStack } from "@tabler/icons-react"

export default function IronFoldingPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <IconShirt className="size-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Iron & Folding</h1>
                        <p className="text-muted-foreground">Track ironing progress and folding batches for final packaging.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconDownload className="size-4 mr-2" />
                        Daily Sheet
                    </Button>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        <IconStack className="size-4 mr-2" />
                        Register Batch
                    </Button>
                </div>
            </div>

            <Card className="border-none bg-accent/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">Folding Station Status</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input placeholder="Search station ID..." className="pl-8 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4 rounded-xl border-2 border-dashed bg-background/50 text-center space-y-2">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Station {i}</div>
                                <div className="text-sm font-medium">Idle</div>
                                <Button variant="ghost" size="sm" className="text-primary h-7">Assign Batch</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
