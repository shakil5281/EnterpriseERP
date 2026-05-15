"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { getRedirectUrlForUser } from "@/lib/role-redirect"

/**
 * Route Access Guard - Redirects users if they try to access unauthorized routes
 * This component checks if the current path is allowed for the user's role
 */
export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Don't check during loading or if no user
        if (loading || !user || !user.roles) return

        // Skip check for public routes
        const publicPaths = ['/login', '/register', '/forgot-password', '/unauthorized']
        if (publicPaths.some(path => pathname.startsWith(path))) return

        // SuperAdmin and Admin can access everything
        if (user.roles.includes('SuperAdmin') || user.roles.includes('Admin')) {
            return
        }

        // Get user's allowed base path
        const userHomePath = getRedirectUrlForUser(user.roles)

        // Define module paths
        const modulePaths = {
            '/accounts': ['Accounts', 'Accountant', 'Account Officer'],
            '/production': ['Production', 'ProductionManager'],
            '/store': ['Store', 'StoreKeeper'],
            '/cutting': ['Cutting'],
            '/merchandising': ['Merchandising', 'Merchandiser'],
            '/management': ['HR', 'Management', 'HR Officer', 'IT Officer'],
        }

        // Check if user is trying to access a module path they don't have access to
        for (const [path, allowedRoles] of Object.entries(modulePaths)) {
            if (pathname.startsWith(path)) {
                // Check if user has any of the allowed roles for this path
                const hasAccess = user.roles.some(role =>
                    allowedRoles.includes(role) || role === 'SuperAdmin' || role === 'Admin'
                )

                if (!hasAccess) {
                    // User doesn't have access to this module, redirect to their home
                    console.log(`Access denied for ${pathname}, redirecting to ${userHomePath}`)
                    router.replace(userHomePath)
                    return
                }
            }
        }

        // Special check: If user is single-module user and tries to access root "/"
        // Only redirect if they should NOT be on root (i.e., not Management roles)
        if (pathname === '/' || pathname === '') {
            const managementRoles = ['HR', 'Management', 'HR Officer', 'IT Officer']
            const isManagementUser = user.roles.some(role => managementRoles.includes(role))

            if (!isManagementUser && userHomePath !== '/') {
                // Single module user trying to access root, redirect to their module
                console.log(`Redirecting single-module user from root to ${userHomePath}`)
                router.replace(userHomePath)
            }
        }

    }, [user, loading, pathname, router])

    return <>{children}</>
}
