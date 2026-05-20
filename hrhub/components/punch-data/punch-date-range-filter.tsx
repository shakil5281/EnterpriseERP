"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"

export type PunchDateRangeValue = {
  from?: Date
  to?: Date
  fromIso?: string
  toIso?: string
}

function toDhakaOffsetIso(date: Date, endOfDay: boolean): string {
  const d = new Date(date)
  if (endOfDay) {
    d.setHours(23, 59, 59, 999)
  } else {
    d.setHours(0, 0, 0, 0)
  }
  const offsetMs = 6 * 60 * 60 * 1000
  return new Date(d.getTime() - offsetMs).toISOString()
}

export function punchRangeToIso(range: DateRange | undefined): PunchDateRangeValue {
  if (!range?.from) return {}
  const from = range.from
  const to = range.to ?? range.from
  return {
    from,
    to,
    fromIso: toDhakaOffsetIso(from, false),
    toIso: toDhakaOffsetIso(to, true),
  }
}

type PunchDateRangeFilterProps = {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined, iso: PunchDateRangeValue) => void
  label?: string
  defaultDays?: number
}

export function PunchDateRangeFilter({
  value,
  onChange,
  label = "Date range",
  defaultDays = 7,
}: PunchDateRangeFilterProps) {
  React.useEffect(() => {
    if (!value?.from) {
      const from = subDays(new Date(), defaultDays)
      const to = new Date()
      const range = { from, to }
      onChange(range, punchRangeToIso(range))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>
      <DateRangePicker
        date={value}
        setDate={(range) => onChange(range, punchRangeToIso(range))}
      />
      {value?.from && (
        <p className="text-[10px] text-muted-foreground font-mono">
          {format(value.from, "yyyy-MM-dd")}
          {value.to ? ` → ${format(value.to, "yyyy-MM-dd")}` : ""}
        </p>
      )}
    </div>
  )
}
