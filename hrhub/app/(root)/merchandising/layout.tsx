"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { canAccessRoute } from "@/lib/auth/access-config"
import { FullScreenLoading } from "@/components/loading-state"

export default function MerchandisingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return
    if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
      router.replace("/unauthorized")
    }
  }, [user, loading, pathname, router])

  if (loading || !user) {
    return <FullScreenLoading message="Verifying access..." />
  }

  if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
    return <FullScreenLoading message="Access denied..." />
  }

  return <>{children}</>
}
