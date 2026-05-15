"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconBox, IconBarcode, IconPackage } from "@tabler/icons-react"

export default function PackagingPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <IconPackage className="size-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Packaging</h1>
                        <p className="text-muted-foreground">Manage boxing, labeling, and barcode generation for finished goods.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconBarcode className="size-4 mr-2" />
                        Print Labels
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <IconBox className="size-4 mr-2" />
                        Complete Box
                    </Button>
                </div>
            </div>

            <Card className="border-none bg-accent/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">Packaging Line Active Jobs</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input placeholder="Search job ID..." className="pl-8 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-background/50 text-center p-6">
                         <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <IconBox className="size-8 text-muted-foreground" />
                         </div>
                        <p className="text-muted-foreground max-w-xs">Scan a barcode or enter a batch number to begin the packaging process.</p>
                        <div className="mt-4 flex gap-2 w-full max-w-sm">
                            <Input placeholder="Batch Number..." />
                            <Button variant="secondary">Start</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
