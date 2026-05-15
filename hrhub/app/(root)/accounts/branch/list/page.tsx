"use client"

import React, { useEffect, useState } from "react"
import { IconHierarchy, IconPlus, IconSearch, IconPencil, IconTrash, IconDotsVertical } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { accountService, Branch } from "@/lib/services/accounts"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function BranchListPage() {
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadBranches()
    }, [])

    const loadBranches = async () => {
        try {
            const res = await accountService.getBranches()
            setBranches(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredBranches = branches.filter(b =>
        b.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.branchCode?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Branches</h2>
                    <p className="text-muted-foreground">Organizational hierarchy and structural directory</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <IconHierarchy className="h-5 w-5 text-blue-500" />
                            <div>
                                <CardTitle>Branch Directory</CardTitle>
                                <CardDescription>Synchronized with core company management</CardDescription>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search branch..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            Loading branches...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBranches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No branches found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBranches.map((branch, index) => (
                                        <TableRow key={`${branch.id}-${index}`}>
                                            <TableCell className="font-medium">
                                                {branch.branchName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {branch.branchCode || "N/A"}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(branch.currentBalance || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`rounded-md ${branch.isActive
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        : "bg-muted text-muted-foreground"
                                                        }`}
                                                    variant="outline"
                                                >
                                                    {branch.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {branch.phone || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/management/information/company-information`}>
                                                    <Button variant="ghost" size="sm">
                                                        Details
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
