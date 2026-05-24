"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function KnitMachinesPage() {
    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <Card>
                <CardHeader>
                    <CardTitle>Knit Machines</CardTitle>
                    <CardDescription>
                        Knit production module is planned for a future release. Use Production Planning and Order Tracking for current workflows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This page previously used legacy APIs. It will be connected to the production microservice when knit modules are implemented.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
