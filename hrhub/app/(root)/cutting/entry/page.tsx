"use client"

import React, { useState } from "react"
import { IconScissors, IconPlus, IconTrash, IconDeviceFloppy, IconHistory } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function CuttingEntryPage() {
    const [items, setItems] = useState([{ size: "M", quantity: 0, wastage: 0 }])

    const addItem = () => setItems([...items, { size: "M", quantity: 0, wastage: 0 }])

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cutting Entry</h2>
                    <p className="text-muted-foreground">Record actual production output from the cutting floor</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Production Details</CardTitle>
                            <CardDescription>Specify sizes and quantities cut in this batch</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Size</TableHead>
                                        <TableHead className="text-right">Quantity (Pcs)</TableHead>
                                        <TableHead className="text-right">Waste (Grams)</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Select defaultValue={item.size}>
                                                    <SelectTrigger className="h-9 w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {["S", "M", "L", "XL", "XXL"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" className="text-right h-9" placeholder="0" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" className="text-right h-9" placeholder="0" />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, idx) => idx !== i))} disabled={items.length === 1}>
                                                    <IconTrash className="h-4 w-4 text-rose-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button variant="outline" className="w-full mt-4 border-dashed gap-2" onClick={addItem}>
                                <IconPlus className="h-4 w-4" /> Add Line
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-card/60">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Batch Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Reference Style</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select Style" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Levis 501 Classic</SelectItem>
                                        <SelectItem value="2">Zara Slim Fit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cutting Date</Label>
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cutter Name</Label>
                                <Input placeholder="Enter name..." />
                            </div>
                            <div className="pt-4 border-t">
                                <Button className="w-full gap-2">
                                    <IconDeviceFloppy className="h-4 w-4" />
                                    Save Batch Entry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-primary/5 text-primary border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase">Today's Batch Count</span>
                                <span className="text-3xl font-black">12</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
