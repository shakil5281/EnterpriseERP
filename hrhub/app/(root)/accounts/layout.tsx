"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "Accounts", "Accountant", "Account Officer"]}>
      {children}
    </RouteGuard>
  )
}
