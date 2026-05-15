"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullScreenLoading } from "@/components/loading-state"

interface RouteGuardProps {
    children: React.ReactNode
    requiredRoles?: string[]
    fallbackUrl?: string
}

export function RouteGuard({ children, requiredRoles = [], fallbackUrl = "/unauthorized" }: RouteGuardProps) {
    const { user, loading, hasAnyRole } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Wait for auth to initialize
        if (loading) return

        // If not logged in, redirect to login
        if (!user) {
            router.push('/login')
            return
        }

        // If specific roles are required, check them
        if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
            router.push(fallbackUrl)
        }
    }, [user, loading, hasAnyRole, requiredRoles, router, fallbackUrl])

    // Show loading while checking auth
    if (loading) {
        return <FullScreenLoading message="Verifying access..." />
    }

    // If not authenticated
    if (!user) {
        return <FullScreenLoading message="Redirecting to login..." />
    }

    // If role check fails
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        return <FullScreenLoading message="Access denied..." />
    }

    // User has access
    return <>{children}</>
}
