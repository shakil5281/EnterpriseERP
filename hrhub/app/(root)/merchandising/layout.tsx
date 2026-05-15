"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function MerchandisingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "Merchandising", "Merchandiser"]}>
      {children}
    </RouteGuard>
  )
}
