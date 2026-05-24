"use client"

import * as React from "react"
import {
    IconReport,
    IconFileDownload,
    IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { merchandisingService } from "@/lib/services/merchandising"
import { useCompanyContext } from "@/components/providers/company-context"
import { toast } from "sonner"

const REPORTS = [
    {
        id: "order-summary",
        title: "Order Summary",
        description: "Consolidated view of orders with quantities and values.",
        action: (companyId: string) => merchandisingService.exportOrderSummaryReport(companyId),
    },
    {
        id: "order-pipeline",
        title: "Order Pipeline",
        description: "Orders grouped by status with quantity and value totals.",
        action: (companyId: string) => merchandisingService.exportOrderPipelineReport(companyId),
    },
    {
        id: "tna-delay",
        title: "T&A Delay Report",
        description: "Milestone delays and reasons across active orders.",
        action: (companyId: string) => merchandisingService.exportTnaDelayReport(companyId),
    },
    {
        id: "booking-status",
        title: "Booking Status",
        description: "Material booking fulfillment and allocation status.",
        action: (companyId: string) => merchandisingService.exportBookingStatusReport(companyId),
    },
] as const

export default function MerchandisingReportsPage() {
    const { activeCompanyId } = useCompanyContext()
    const [downloading, setDownloading] = React.useState<string | null>(null)

    const handleDownload = async (reportId: string, action: (companyId: string) => Promise<void>) => {
        if (!activeCompanyId) {
            toast.error("Select a company first")
            return
        }
        try {
            setDownloading(reportId)
            await action(activeCompanyId)
            toast.success("Report downloaded")
        } catch (error) {
            console.error(error)
            toast.error("Download failed")
        } finally {
            setDownloading(null)
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconReport className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Merchandising Reports</h1>
                        <p className="text-muted-foreground text-sm">Download standard CSV reports</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
                {REPORTS.map((rep) => (
                    <Card key={rep.id} className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">{rep.title}</CardTitle>
                            <CardDescription>{rep.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                size="sm"
                                className="gap-2 font-bold"
                                disabled={downloading === rep.id}
                                onClick={() => handleDownload(rep.id, rep.action)}
                            >
                                {downloading === rep.id ? (
                                    <IconLoader2 className="size-4 animate-spin" />
                                ) : (
                                    <IconFileDownload className="size-4" />
                                )}
                                Download CSV
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
