"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { payrollService } from "@/lib/services/payroll"
import type { PayrollPeriodDto } from "@/lib/services/payroll-types"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection, monthName } from "@/lib/payroll-utils"
import { PayrollPageHeader } from "@/components/payroll/payroll-page-header"
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function PayrollPeriodsPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [companyId, setCompanyId] = React.useState("")
  const [rows, setRows] = React.useState<PayrollPeriodDto[]>([])

  React.useEffect(() => {
    companyService.getAll().then((c) => {
      setCompanies(c)
      if (c[0]) setCompanyId(String(c[0].id))
    })
  }, [])

  const load = async () => {
    const guid = companyGuidFromSelection(companies, companyId)
    if (!guid) return
    try {
      setRows(await payrollService.getPayrollPeriods(guid))
    } catch {
      toast.error("Failed to load periods")
    }
  }

  React.useEffect(() => {
    if (companyId) load()
  }, [companyId])

  const columns: ColumnDef<PayrollPeriodDto>[] = [
    {
      id: "period",
      header: "Period",
      cell: ({ row }) => `${monthName(row.original.monthNo)} ${row.original.yearNo}`,
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <PayrollStatusBadge status={row.original.status} /> },
    {
      id: "lock",
      header: "Lock",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={!user?.id || row.original.isPayrollLocked}
          onClick={async () => {
            try {
              await payrollService.lockPayrollPeriod(row.original.id, { lockedBy: user!.id })
              load()
            } catch {
              toast.error("Lock failed")
            }
          }}
        >
          Lock
        </Button>
      ),
    },
  ]

  return (
    <div className="py-6 flex flex-col gap-6">
      <PayrollPageHeader title="Payroll Periods" description="Open, close, and lock payroll months" />
      <div className="px-6 flex gap-4 items-end">
        <div className="space-y-1">
          <Label>Company</Label>
          <NativeSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="min-w-[200px]">
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.companyNameEn}</option>
            ))}
          </NativeSelect>
        </div>
        <Button onClick={load}>Refresh</Button>
      </div>
      <div className="px-6">
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  )
}
