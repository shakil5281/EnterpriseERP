"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "Production", "ProductionManager"]}>
      {children}
    </RouteGuard>
  )
}
