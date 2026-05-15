"use client"

import * as React from "react"
import { IconPlus, IconTrash, IconEdit, IconLoader2, IconDatabase } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface MasterGridProps {
    title: string;
    description: string;
    fetchData: () => Promise<any[]>;
    createData: (data: any) => Promise<any>;
}

export default function MasterGrid({ title, description, fetchData, createData }: MasterGridProps) {
    const [data, setData] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [open, setOpen] = React.useState(false)
    const [newName, setNewName] = React.useState("")
    const [newDesc, setNewDesc] = React.useState("")

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true)
            const result = await fetchData()
            setData(result)
        } catch (error) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [fetchData])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleCreate = async () => {
        if (!newName) return
        try {
            await createData({ name: newName, description: newDesc, companyId: 1, branchId: 1 })
            toast.success("Record created")
            setOpen(false)
            setNewName("")
            setNewDesc("")
            loadData()
        } catch (error) {
            toast.error("Failed to create record")
        }
    }

    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
                            <IconDatabase className="size-5 text-orange-600" /> {title}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{description}</CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest h-9 px-6 rounded-lg shadow-lg">
                                <IconPlus className="mr-2 size-4 text-orange-400" /> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase italic">New {title} Entry</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Name / Label</Label>
                                    <Input value={newName} onChange={e => setNewName(e.target.value)} className="bg-slate-50 border-none h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                                    <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-slate-50 border-none h-12" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 w-full h-12 font-black uppercase">Save Record</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <IconLoader2 className="size-10 animate-spin text-orange-600" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">Name</TableHead>
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">Description</TableHead>
                                <TableHead className="px-8 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, i) => (
                                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-8 py-5 font-bold text-slate-700">{item.name}</TableCell>
                                    <TableCell className="px-8 py-5 text-slate-400 text-sm italic">{item.description || "N/A"}</TableCell>
                                    <TableCell className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-orange-600 transition-colors">
                                                <IconEdit className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-red-600 transition-colors">
                                                <IconTrash className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No Records Found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
