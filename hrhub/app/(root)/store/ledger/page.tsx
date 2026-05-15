"use client"

import * as React from "react"
import { IconFileSpreadsheet, IconDownload, IconFilter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function StockLedgerPage() {
    const [selectedItem, setSelectedItem] = React.useState("RM-001")

    // Mock ledger data
    const ledgerData = [
        { date: "Jan 01, 2026", ref: "OB", type: "OPENING", in: 0, out: 0, balance: 4500 },
        { date: "Jan 05, 2026", ref: "GRN-2026-001", type: "IN", in: 500, out: 0, balance: 5000 },
        { date: "Jan 12, 2026", ref: "ISS-2026-012", type: "OUT", in: 0, out: 200, balance: 4800 },
        { date: "Jan 18, 2026", ref: "ISS-2026-033", type: "OUT", in: 0, out: 150, balance: 4650 },
        { date: "Jan 30, 2026", ref: "GRN-2026-022", type: "IN", in: 350, out: 0, balance: 5000 },
    ]

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconFileSpreadsheet className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Stock Ledger</h1>
                        <p className="text-sm text-muted-foreground">
                            Detailed transaction history per item.
                        </p>
                    </div>
                </div>
                <Button variant="outline">
                    <IconDownload className="mr-2 size-4" />
                    Export PDF/Excel
                </Button>
            </div>

            <div className="px-4 lg:px-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Ledger Report</CardTitle>
                        <CardDescription>Select an item to view its stock movement history.</CardDescription>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <div className="w-[300px]">
                                <Select value={selectedItem} onValueChange={setSelectedItem}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RM-001">Cotton Yarn 80/1</SelectItem>
                                        <SelectItem value="RM-002">Polyester Fabric</SelectItem>
                                        <SelectItem value="ACC-001">Plastic Buttons</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="secondary">
                                <IconFilter className="mr-2 size-4" />
                                Filter Date
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">In Qty</TableHead>
                                        <TableHead className="text-right">Out Qty</TableHead>
                                        <TableHead className="text-right font-bold">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledgerData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{row.ref}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${row.type === 'IN' || row.type === 'OPENING'
                                                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                        : 'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}>
                                                    {row.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">{row.in > 0 ? `+${row.in}` : '-'}</TableCell>
                                            <TableCell className="text-right text-red-600 font-medium">{row.out > 0 ? `-${row.out}` : '-'}</TableCell>
                                            <TableCell className="text-right font-bold">{row.balance}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
