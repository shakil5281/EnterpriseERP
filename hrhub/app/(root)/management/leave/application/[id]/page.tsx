"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    IconCalendar,
    IconUser,
    IconNote,
    IconClock,
    IconArrowLeft,
    IconLoader,
    IconDownload,
    IconMessageDots,
    IconPrinter
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { leaveService, type LeaveApplication } from "@/lib/services/leave"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function LeaveApplicationDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [application, setApplication] = React.useState<LeaveApplication | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchApplication = async () => {
            try {
                const data = await leaveService.getApplication(parseInt(id))
                setApplication(data)
            } catch (error) {
                toast.error("Failed to load leave application details")
                router.push("/management/leave")
            } finally {
                setIsLoading(false)
            }
        }
        fetchApplication()
    }, [id, router])

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <IconLoader className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!application) return null

    return (
        <div className="flex flex-col gap-6 py-6 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-6">
                <div className="flex gap-2">
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
                        <IconArrowLeft className="size-4" />
                        Back to List
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => router.push(`/management/leave/application/${id}/export`)}>
                        <IconPrinter className="size-4" />
                        Print Form
                    </Button>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
                {/* Left Column: Application Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-6 border-b">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="font-normal mb-2">
                                            {application.status}
                                        </Badge>
                                        <h1 className="text-2xl font-bold tracking-tight">
                                            {application.leaveTypeName} Request
                                        </h1>
                                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                                            <IconCalendar className="size-3.5" />
                                            Applied on {format(new Date(application.appliedDate), "dd MMM yyyy")}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <IconCalendar className="size-6" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            {/* Duration info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Start Date</p>
                                    <p className="text-base font-medium">{format(new Date(application.startDate), "eeee, dd MMM yyyy")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">End Date</p>
                                    <p className="text-base font-medium">{format(new Date(application.endDate), "eeee, dd MMM yyyy")}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                    {application.totalDays}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Total Duration</p>
                                    <p className="text-sm font-medium">Days of leave requested</p>
                                </div>
                            </div>

                            {/* Reason section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <IconNote className="size-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Reason for Leave</h3>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                                    {application.reason}
                                </p>
                            </div>

                            {/* Remarks/Action Info */}
                            {application.remarks && (
                                <div className="space-y-3 pt-6 border-t">
                                    <div className="flex items-center gap-2">
                                        <IconMessageDots className="size-4 text-muted-foreground" />
                                        <h3 className="font-semibold text-sm">Remarks</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/20">
                                        {application.remarks}
                                    </p>
                                </div>
                            )}

                            {application.attachmentUrl && (
                                <div className="pt-6 border-t">
                                    <Button variant="outline" className="gap-2 h-9" onClick={() => window.open(application.attachmentUrl)}>
                                        <IconDownload className="size-4" />
                                        Download Attachment
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Employee Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconUser className="size-4" />
                                Applicant Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <IconUser className="size-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-base">{application.employeeName}</h4>
                                    <p className="text-xs text-muted-foreground">{application.designation}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Employee ID</span>
                                    <span className="font-medium">{application.employeeId}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Department</span>
                                    <span className="font-medium">{application.department}</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/management/human-resource/employee-info/${application.employeeId}`)}
                            >
                                View Full Profile
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconClock className="size-4" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="relative pl-6 border-l pb-6">
                                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-background" />
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Applied</p>
                                <p className="text-sm font-medium">{format(new Date(application.appliedDate), "dd MMM yyyy")}</p>
                            </div>
                            <div className="relative pl-6 border-l border-transparent">
                                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary border border-background" />
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Current Status</p>
                                <Badge variant="secondary" className="font-normal">{application.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
