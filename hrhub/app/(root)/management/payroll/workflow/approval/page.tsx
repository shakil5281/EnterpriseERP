"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { payrollService } from "@/lib/services/payroll"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection, findOrCreatePayrollPeriod } from "@/lib/payroll-utils"
import { PayrollPageHeader } from "@/components/payroll/payroll-page-header"
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function PayrollApprovalPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [companyId, setCompanyId] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [month, setMonth] = React.useState(new Date().getMonth() + 1)
  const [periodId, setPeriodId] = React.useState<string>()
  const [status, setStatus] = React.useState("")

  React.useEffect(() => {
    companyService.getAll().then((c) => {
      setCompanies(c)
      if (c[0]) setCompanyId(String(c[0].id))
    })
  }, [])

  const loadPeriod = async () => {
    const guid = companyGuidFromSelection(companies, companyId)
    if (!guid) return
    try {
      const period = await findOrCreatePayrollPeriod(guid, year, month)
      setPeriodId(period.id)
      const summary = await payrollService.getPayrollSummary(period.id)
      setStatus(summary.status)
    } catch {
      toast.error("Failed to load payroll period")
    }
  }

  React.useEffect(() => {
    if (companyId) loadPeriod()
  }, [companyId, year, month])

  const act = async (fn: () => Promise<unknown>, label: string) => {
    if (!periodId || !user?.id) return
    try {
      await fn()
      toast.success(label)
      loadPeriod()
    } catch {
      toast.error(`${label} failed`)
    }
  }

  return (
    <div className="py-6 flex flex-col gap-6">
      <PayrollPageHeader title="Payroll Approval" description="Submit and approve processed payroll" />
      <div className="px-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label>Company</Label>
          <NativeSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.companyNameEn}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label>Year</Label>
          <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label>Month</Label>
          <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-end">
          <Button onClick={loadPeriod}>Reload</Button>
        </div>
      </div>
      <div className="px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Period status {status ? <PayrollStatusBadge status={status} /> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => act(() => payrollService.submitPayroll(periodId!, { userId: user!.id }), "Submitted")}>
              Submit
            </Button>
            <Button onClick={() => act(() => payrollService.approvePayroll(periodId!, { userId: user!.id }), "Approved")}>
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => act(() => payrollService.rejectPayroll(periodId!, { userId: user!.id }), "Rejected")}
            >
              Reject
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
