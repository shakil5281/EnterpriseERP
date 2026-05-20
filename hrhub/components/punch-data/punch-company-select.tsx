"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { companyService, type Company } from "@/lib/services/company"
import { resolvePunchCompanyId } from "@/lib/punch-company"
import { toast } from "sonner"

type PunchCompanySelectProps = {
  value: string
  onValueChange: (entityId: string, punchCompanyId: number, company: Company | null) => void
  className?: string
}

export function PunchCompanySelect({ value, onValueChange, className }: PunchCompanySelectProps) {
  const [companies, setCompanies] = React.useState<Company[]>([])

  React.useEffect(() => {
    companyService
      .getAll()
      .then((rows) => {
        setCompanies(rows)
        if (!value && rows[0]?.entityId) {
          const c = rows[0]
          onValueChange(c.entityId, resolvePunchCompanyId(c), c)
        }
      })
      .catch(() => toast.error("Failed to load companies"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = companies.find((c) => c.entityId === value) ?? null
  const punchCompanyId = resolvePunchCompanyId(selected)

  return (
    <div className={className}>
      <Label className="text-xs font-bold uppercase text-muted-foreground">Company</Label>
      <NativeSelect
        value={value}
        onChange={(e) => {
          const entityId = e.target.value
          const company = companies.find((c) => c.entityId === entityId) ?? null
          onValueChange(entityId, resolvePunchCompanyId(company), company)
        }}
        className="mt-1.5 h-10"
      >
        <option value="">Select company</option>
        {companies.map((c) => (
          <option key={c.entityId} value={c.entityId}>
            {c.companyNameEn}
          </option>
        ))}
      </NativeSelect>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Punch DB company id: <span className="font-mono font-semibold">{punchCompanyId}</span>
      </p>
    </div>
  )
}
