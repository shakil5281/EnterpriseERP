"use client"

import * as React from "react"
import { IconCheck, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { DatePicker } from "@/components/ui/date-picker"
import type { Company } from "@/lib/services/company"
import type { CreateEmployeeDto, UpdateEmployeeDto } from "@/lib/services/employee"
import { isValidHrEmployeeId, normalizeHrEmployeeId } from "@/lib/services/employee"
import { organogramService } from "@/lib/services/organogram"
import { toast } from "sonner"

export type EmployeeHrFormValues = CreateEmployeeDto & {
  isActive?: boolean
}

type EmployeeHrFormProps = {
  mode: "create" | "edit"
  companies: Company[]
  initial?: Partial<EmployeeHrFormValues>
  submitLabel?: string
  onSubmit: (data: CreateEmployeeDto | UpdateEmployeeDto) => Promise<void>
}

export function EmployeeHrForm({
  mode,
  companies,
  initial,
  submitLabel,
  onSubmit,
}: EmployeeHrFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [joinDate, setJoinDate] = React.useState<Date | undefined>(
    initial?.joinDate ? new Date(initial.joinDate) : new Date(),
  )
  const [dob, setDob] = React.useState<Date | undefined>(
    initial?.dateOfBirth ? new Date(initial.dateOfBirth) : undefined,
  )

  const [selectedCompanyId, setSelectedCompanyId] = React.useState(
    initial?.companyId ?? 0,
  )
  const [punchNumber, setPunchNumber] = React.useState(
    initial?.punchNumber ? String(initial.punchNumber) : "",
  )
  const [employeeId, setEmployeeId] = React.useState(initial?.employeeId ?? "")
  const [fullNameEn, setFullNameEn] = React.useState(initial?.fullNameEn ?? "")
  const [fullNameBn, setFullNameBn] = React.useState(initial?.fullNameBn ?? "")
  const [nid, setNid] = React.useState(initial?.nid ?? "")
  const [gender, setGender] = React.useState(initial?.gender ?? "")
  const [email, setEmail] = React.useState(initial?.email ?? "")
  const [phone, setPhone] = React.useState(initial?.phoneNumber ?? "")
  const [status, setStatus] = React.useState(initial?.status ?? "Active")
  const [departmentId, setDepartmentId] = React.useState(initial?.departmentId ?? 0)
  const [sectionId, setSectionId] = React.useState(initial?.sectionId ?? 0)
  const [designationId, setDesignationId] = React.useState(initial?.designationId ?? 0)
  const [isActive, setIsActive] = React.useState(initial?.isActive ?? true)

  const [basicSalary, setBasicSalary] = React.useState(String(initial?.basicSalary ?? 0))
  const [houseRent, setHouseRent] = React.useState(String(initial?.houseRent ?? 0))
  const [medicalAllowance, setMedicalAllowance] = React.useState(
    String(initial?.medicalAllowance ?? 0),
  )
  const [conveyance, setConveyance] = React.useState(String(initial?.conveyance ?? 0))
  const [foodAllowance, setFoodAllowance] = React.useState(
    String(initial?.foodAllowance ?? 0),
  )

  const [presentAddress, setPresentAddress] = React.useState(initial?.presentAddress ?? "")
  const [presentPostalCode, setPresentPostalCode] = React.useState(
    initial?.presentPostalCode ?? "",
  )
  const [permanentAddress, setPermanentAddress] = React.useState(
    initial?.permanentAddress ?? "",
  )
  const [permanentPostalCode, setPermanentPostalCode] = React.useState(
    initial?.permanentPostalCode ?? "",
  )

  const [bankName, setBankName] = React.useState(initial?.bankName ?? "")
  const [bankBranchName, setBankBranchName] = React.useState(initial?.bankBranchName ?? "")
  const [bankAccountNo, setBankAccountNo] = React.useState(initial?.bankAccountNo ?? "")
  const [bankRoutingNo, setBankRoutingNo] = React.useState(initial?.bankRoutingNo ?? "")

  const [emergencyContactName, setEmergencyContactName] = React.useState(
    initial?.emergencyContactName ?? "",
  )
  const [emergencyContactRelation, setEmergencyContactRelation] = React.useState(
    initial?.emergencyContactRelation ?? "",
  )
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState(
    initial?.emergencyContactPhone ?? "",
  )
  const [emergencyContactAddress, setEmergencyContactAddress] = React.useState(
    initial?.emergencyContactAddress ?? "",
  )

  const [departments, setDepartments] = React.useState<
    Awaited<ReturnType<typeof organogramService.getDepartments>>
  >([])
  const [sections, setSections] = React.useState<
    Awaited<ReturnType<typeof organogramService.getSections>>
  >([])
  const [designations, setDesignations] = React.useState<
    Awaited<ReturnType<typeof organogramService.getDesignations>>
  >([])

  React.useEffect(() => {
    if (selectedCompanyId) {
      organogramService.getDepartments({ companyId: selectedCompanyId }).then(setDepartments)
    } else {
      setDepartments([])
    }
    setSections([])
    setDesignations([])
  }, [selectedCompanyId])

  React.useEffect(() => {
    if (departmentId) {
      organogramService.getSections({ departmentId }).then(setSections)
    } else {
      setSections([])
    }
    setDesignations([])
  }, [departmentId])

  React.useEffect(() => {
    if (sectionId) {
      organogramService.getDesignations({ sectionId }).then(setDesignations)
    } else {
      setDesignations([])
    }
  }, [sectionId])

  const buildPayload = (): CreateEmployeeDto => ({
    companyId: selectedCompanyId || undefined,
    punchNumber: parseInt(punchNumber, 10),
    employeeId: normalizeHrEmployeeId(employeeId),
    fullNameEn,
    fullNameBn: fullNameBn || undefined,
    nid: nid || undefined,
    gender: gender || undefined,
    dateOfBirth: dob?.toISOString(),
    departmentId,
    sectionId: sectionId || undefined,
    designationId,
    status,
    joinDate: joinDate?.toISOString() ?? new Date().toISOString(),
    email: email || undefined,
    phoneNumber: phone || undefined,
    basicSalary: parseFloat(basicSalary) || 0,
    houseRent: parseFloat(houseRent) || 0,
    medicalAllowance: parseFloat(medicalAllowance) || 0,
    conveyance: parseFloat(conveyance) || 0,
    foodAllowance: parseFloat(foodAllowance) || 0,
    presentAddress: presentAddress || undefined,
    presentPostalCode: presentPostalCode || undefined,
    permanentAddress: permanentAddress || undefined,
    permanentPostalCode: permanentPostalCode || undefined,
    bankName: bankName || undefined,
    bankBranchName: bankBranchName || undefined,
    bankAccountNo: bankAccountNo || undefined,
    bankRoutingNo: bankRoutingNo || undefined,
    emergencyContactName: emergencyContactName || undefined,
    emergencyContactRelation: emergencyContactRelation || undefined,
    emergencyContactPhone: emergencyContactPhone || undefined,
    emergencyContactAddress: emergencyContactAddress || undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompanyId) {
      toast.error("Select a company")
      return
    }
    if (!fullNameEn.trim()) {
      toast.error("Full name is required")
      return
    }
    if (!punchNumber || parseInt(punchNumber, 10) <= 0) {
      toast.error("Valid punch number is required")
      return
    }
    if (!departmentId || !designationId) {
      toast.error("Department and designation are required")
      return
    }
    if (!joinDate) {
      toast.error("Join date is required")
      return
    }
    if (employeeId.trim() && !isValidHrEmployeeId(employeeId)) {
      toast.error("Employee ID must match EMP-#### (e.g. EMP-0001) or leave empty to auto-generate")
      return
    }

    setIsLoading(true)
    try {
      const base = buildPayload()
      if (mode === "edit") {
        await onSubmit({ ...base, isActive, isOtEnabled: false } as UpdateEmployeeDto)
      } else {
        await onSubmit(base)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Company and identity</CardTitle>
          <CardDescription>Fields stored on HR employee record.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Company *</Label>
            <NativeSelect
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(parseInt(e.target.value, 10))}
              required
            >
              <option value={0}>Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyNameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label>Punch number (device badge) *</Label>
            <Input
              type="number"
              min={1}
              value={punchNumber}
              onChange={(e) => setPunchNumber(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Employee ID</Label>
            <Input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Leave empty for auto (EMP-0001) or enter EMP-####"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Full name (English) *</Label>
            <Input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Full name (Bangla)</Label>
            <Input value={fullNameBn} onChange={(e) => setFullNameBn(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>NID</Label>
            <Input value={nid} onChange={(e) => setNid(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Gender</Label>
            <NativeSelect value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">â€”</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label>Date of birth</Label>
            <DatePicker date={dob} setDate={setDob} placeholder="DOB" />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label>Join date *</Label>
            <DatePicker date={joinDate} setDate={setJoinDate} placeholder="Join date" />
          </div>
          {mode === "edit" && (
            <div className="grid gap-2 flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active account
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Job placement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Department *</Label>
            <NativeSelect
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(parseInt(e.target.value, 10))
                setSectionId(0)
                setDesignationId(0)
              }}
              required
            >
              <option value={0}>Select</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label>Section</Label>
            <NativeSelect
              value={sectionId}
              onChange={(e) => {
                setSectionId(parseInt(e.target.value, 10))
                setDesignationId(0)
              }}
            >
              <option value={0}>â€”</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label>Designation *</Label>
            <NativeSelect
              value={designationId}
              onChange={(e) => setDesignationId(parseInt(e.target.value, 10))}
              required
            >
              <option value={0}>Select</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Salary components</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Basic", basicSalary, setBasicSalary],
            ["House rent", houseRent, setHouseRent],
            ["Medical", medicalAllowance, setMedicalAllowance],
            ["Conveyance", conveyance, setConveyance],
            ["Food", foodAllowance, setFoodAllowance],
          ].map(([label, val, setVal]) => (
            <div key={label as string} className="grid gap-2">
              <Label>{label as string}</Label>
              <Input
                type="number"
                min={0}
                value={val as string}
                onChange={(e) => (setVal as (v: string) => void)(e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Addresses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Present address</Label>
            <Input value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} />
            <Input
              placeholder="Postal code"
              value={presentPostalCode}
              onChange={(e) => setPresentPostalCode(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Permanent address</Label>
            <Input
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
            />
            <Input
              placeholder="Postal code"
              value={permanentPostalCode}
              onChange={(e) => setPermanentPostalCode(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bank account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Bank name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Branch</Label>
            <Input value={bankBranchName} onChange={(e) => setBankBranchName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Account no</Label>
            <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Routing no</Label>
            <Input value={bankRoutingNo} onChange={(e) => setBankRoutingNo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Relation</Label>
            <Input
              value={emergencyContactRelation}
              onChange={(e) => setEmergencyContactRelation(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <Input
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={emergencyContactAddress}
              onChange={(e) => setEmergencyContactAddress(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading} className="w-fit gap-2">
        {isLoading ? (
          <IconLoader className="size-4 animate-spin" />
        ) : (
          <IconCheck className="size-4" />
        )}
        {submitLabel ?? (mode === "create" ? "Create employee" : "Save changes")}
      </Button>
    </form>
  )
}
