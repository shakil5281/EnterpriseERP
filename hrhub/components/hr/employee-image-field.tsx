"use client"

import * as React from "react"
import { IconPhoto, IconUpload } from "@tabler/icons-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { employeeFormFieldsCn } from "@/components/hr/employee-form-fields"
import { getImageUrl } from "@/lib/utils"

const MAX_URL_LENGTH = 500

type Props = {
  label: string
  description: string
  value: string
  onChange: (url: string) => void
  variant?: "profile" | "signature"
}

export function EmployeeImageField({
  label,
  description,
  value,
  onChange,
  variant = "profile",
}: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayUrl = previewUrl || (value ? getImageUrl(value) : null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <div className={employeeFormFieldsCn("space-y-4")}>
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div
        className={
          variant === "profile"
            ? "mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border bg-muted/30"
            : "flex h-28 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border bg-muted/30"
        }
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <IconPhoto className="size-12 text-muted-foreground/40" />
        )}
      </div>

      <div className="grid gap-2 max-w-md">
        <Label>Image URL</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          maxLength={MAX_URL_LENGTH}
        />
        <p className="text-[10px] text-muted-foreground">
          Paste a hosted image URL (max {MAX_URL_LENGTH} characters).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
          <IconUpload className="size-4" />
          Preview from file
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Clear URL
          </Button>
        ) : null}
      </div>
    </div>
  )
}
