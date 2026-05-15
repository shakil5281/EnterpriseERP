"use client"

import * as React from "react"
import { IconShield, IconUsers, IconLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function AdministratorPage() {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-5xl mx-auto w-full">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <IconShield className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Administrator Panel</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage system users, roles, and access permissions.
                </p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/administrator/users">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <IconUsers className="size-5 text-blue-500" />
                                <CardTitle>User Management</CardTitle>
                            </div>
                            <CardDescription>
                                Create, edit, and manage system users and their assigned roles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">Manage Users</Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/administrator/permissions">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <IconLock className="size-5 text-orange-500" />
                                <CardTitle>Permissions & Roles</CardTitle>
                            </div>
                            <CardDescription>
                                Define roles and configure granular access permissions for the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">Configure Permissions</Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
