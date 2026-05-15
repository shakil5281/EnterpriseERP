"use client"

import * as React from "react"
import { IconReportAnalytics, IconDownload, IconSearch, IconLoader2, IconChartPie } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import storeService, { StoreBooking } from "@/lib/services/store"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function OrderWiseConsumptionPage() {
    const [bookings, setBookings] = React.useState<StoreBooking[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchConsumption = async () => {
        setLoading(true);
        try {
            const data = await storeService.getBookings();
            setBookings(data);
        } catch (error) {
            toast.error("Failed to load consumption analytics");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchConsumption();
    }, []);

    const filtered = bookings.filter(b =>
        b.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.itemName.toLowerCase().includes(search.toLowerCase())
    );

    // Grouping logic for summary (optional, but let's keep it simple for now as requested)

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800">
                        <IconChartPie className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Order Material Consumption</h1>
                        <p className="text-muted-foreground text-sm">Detailed analysis of materials utilized across active production orders.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 h-10 border-violet-200">
                        <IconDownload className="size-4" /> PDF Report
                    </Button>
                    <Button variant="outline" className="gap-2 h-10 border-violet-200">
                        <IconDownload className="size-4" /> Excel Ledger
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-[500px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input
                                placeholder="Filter consumption by Order # or Item Type..."
                                className="pl-10 h-10 border-muted-foreground/20"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Order Reference</TableHead>
                                    <TableHead className="font-bold">Allocated Material</TableHead>
                                    <TableHead className="text-right font-bold">Planned Qty</TableHead>
                                    <TableHead className="text-right font-bold text-violet-600">Actual Issued</TableHead>
                                    <TableHead className="text-right font-bold">Variance</TableHead>
                                    <TableHead className="text-center font-bold">Efficiency</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-60 text-center">
                                            <IconLoader2 className="animate-spin size-10 mx-auto text-violet-500 mb-2" />
                                            <p className="text-muted-foreground font-bold italic tracking-wide">Crunching consumption metrics...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium italic">
                                            No consumption data available for the selected period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((b) => {
                                        const issued = b.issuedQty || 0;
                                        const booked = b.bookedQuantity || 1;
                                        const variance = issued - booked;
                                        const efficiency = Math.round((issued / booked) * 100);

                                        return (
                                            <TableRow key={b.id} className="hover:bg-violet-50/20 transition-colors">
                                                <TableCell className="font-bold text-sm">{b.orderNumber}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{b.itemName}</span>
                                                        <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 bg-violet-50/50 text-violet-700 border-none font-black uppercase">
                                                            {b.bookingType}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium">{b.bookedQuantity.toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-mono font-black text-violet-600">
                                                    {issued.toLocaleString()}
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${variance > 0 ? 'text-rose-600' : variance < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {variance > 0 ? `+${variance.toLocaleString()}` : variance.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={efficiency > 100 ? "bg-rose-500" : "bg-emerald-500"}>
                                                        {efficiency}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
