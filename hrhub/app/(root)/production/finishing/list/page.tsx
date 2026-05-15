"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconPlus, IconSearch, IconDownload, IconFilter, IconBoxSeam } from "@tabler/icons-react"

export default function FinishingListPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <IconBoxSeam className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Finishing List</h1>
                        <p className="text-muted-foreground">Manage and track all completed production items ready for finishing.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconDownload className="size-4 mr-2" />
                        Export
                    </Button>
                    <Button size="sm">
                        <IconPlus className="size-4 mr-2" />
                        New Entry
                    </Button>
                </div>
            </div>

            <Card className="border-none bg-accent/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">Recent Finishing Records</CardTitle>
                        <div className="flex items-center gap-2">
                             <div className="relative w-full sm:w-64">
                                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input placeholder="Search orders..." className="pl-8 h-9" />
                            </div>
                            <Button variant="outline" size="icon" className="size-9">
                                <IconFilter className="size-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
                        <div className="text-center space-y-2">
                            <p className="text-muted-foreground font-medium">No finishing records found.</p>
                            <p className="text-xs text-muted-foreground/70">Start by adding a new record from the production floor.</p>
                            <Button variant="link" className="text-primary mt-2">Add First Record</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
