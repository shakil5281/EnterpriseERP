import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default function DataProcessPage() {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                <IconRefresh className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Data Synchronization</h1>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Sync</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Fetch data from biometric devices and update system logs.
                        </div>
                        <Button size="sm">Run Process</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Leave Recalculation</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Update leave balances based on current policies and usage.
                        </div>
                        <Button size="sm" variant="outline">Run Process</Button>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-800">Payroll System Lock</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground italic">
                            Finalize current period data and lock for salary generation.
                        </div>
                        <Button size="sm" variant="destructive">Lock Period</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
