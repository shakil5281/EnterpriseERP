import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconReportAnalytics } from "@tabler/icons-react"

export default function MonthlyReportsPage() {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                <IconReportAnalytics className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Monthly Insights</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Month to View</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => (
                        <div key={month} className="flex flex-col items-center p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                            <span className="text-sm font-medium">{month}</span>
                            <span className="text-xs text-muted-foreground">2026</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="p-4 border rounded-lg bg-primary/5">
                    <h3 className="font-semibold mb-2">Monthly Highlights</h3>
                    <p className="text-muted-foreground">Highest attendance efficiency: 98% (January)</p>
                </div>
                <div className="p-4 border rounded-lg bg-orange-500/5">
                    <h3 className="font-semibold mb-2">Warnings</h3>
                    <p className="text-muted-foreground italic">3 departments exceeded overtime budget this month.</p>
                </div>
            </div>
        </div>
    )
}
