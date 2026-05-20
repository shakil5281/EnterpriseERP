"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { getRedirectUrlForUser } from "@/lib/role-redirect"
import { canAccessRoute } from "@/lib/auth/access-config"

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (loading || !user || !user.roles) return

        const publicPaths = ['/login', '/register', '/forgot-password', '/unauthorized']
        if (publicPaths.some(path => pathname.startsWith(path))) return

        if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
            router.replace('/unauthorized')
            return
        }

        if (pathname === '/' || pathname === '') {
            const userHomePath = getRedirectUrlForUser(user.roles)
            const managementRoles = ['HR', 'Management', 'HR Officer', 'IT Officer', 'SuperAdmin']
            const isManagementUser = user.roles.some(role => managementRoles.includes(role))

            if (!isManagementUser && userHomePath !== '/') {
                router.replace(userHomePath)
            }
        }
    }, [user, loading, pathname, router])

    return <>{children}</>
}
