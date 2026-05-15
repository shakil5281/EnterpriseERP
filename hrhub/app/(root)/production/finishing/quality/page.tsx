"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconCheck, IconSearch, IconDownload, IconShieldCheck, IconAlertCircle } from "@tabler/icons-react"

export default function QualityCheckPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <IconShieldCheck className="size-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quality Check</h1>
                        <p className="text-muted-foreground">Perform quality audits and track defect rates across production lines.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <IconAlertCircle className="size-4 mr-2" />
                        Report Defect
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <IconCheck className="size-4 mr-2" />
                        Pass Batch
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none bg-green-500/5">
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-green-600">Pass Rate</div>
                        <div className="text-2xl font-bold mt-1">98.4%</div>
                        <div className="text-xs text-muted-foreground mt-1">+2.1% from last week</div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-destructive/5">
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-destructive">Defect Rate</div>
                        <div className="text-2xl font-bold mt-1">1.6%</div>
                        <div className="text-xs text-muted-foreground mt-1">-0.5% from last week</div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-blue-500/5">
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-blue-600">Pending Audit</div>
                        <div className="text-2xl font-bold mt-1">12 Batches</div>
                        <div className="text-xs text-muted-foreground mt-1">Due by end of day</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none bg-accent/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">QC Audit Log</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input placeholder="Search batch ID..." className="pl-8 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
                        <p className="text-muted-foreground">Select a production batch to start quality inspection.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
