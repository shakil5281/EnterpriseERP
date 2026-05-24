"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullScreenLoading } from "@/components/loading-state"
import { authService } from "@/lib/services/auth"

interface RouteGuardProps {
    children: React.ReactNode
    requiredRoles?: string[]
    fallbackUrl?: string
}

export function RouteGuard({ children, requiredRoles = [], fallbackUrl = "/unauthorized" }: RouteGuardProps) {
    const { user, loading, hasAnyRole } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        const hasToken = authService.isAuthenticated()

        if (!user && !hasToken) {
            router.push("/login")
            return
        }

        if (!user) return

        if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
            router.push(fallbackUrl)
        }
    }, [user, loading, hasAnyRole, requiredRoles, router, fallbackUrl])

    if (loading) {
        return <FullScreenLoading message="Verifying access..." />
    }

    if (!user) {
        if (authService.isAuthenticated()) {
            return <FullScreenLoading message="Verifying access..." />
        }
        return <FullScreenLoading message="Redirecting to login..." />
    }

    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        return <FullScreenLoading message="Access denied..." />
    }

    return <>{children}</>
}
