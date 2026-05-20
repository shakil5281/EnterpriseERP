"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { IconLoader } from "@tabler/icons-react"

/** Legacy numeric id route — redirect users to pay-slip list (period + employee ids required). */
export default function LegacyPayslipRedirectPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    router.replace("/management/payroll/pay-slip")
  }, [router, params.id])

  return (
    <div className="flex items-center justify-center h-screen">
      <IconLoader className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}
