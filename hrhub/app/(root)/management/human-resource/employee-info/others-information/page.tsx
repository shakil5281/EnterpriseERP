"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    IconArrowLeft,
    IconUserCircle,
    IconCheck,
    IconUsers,
    IconMapPin,
    IconCash,
    IconCreditCard,
    IconPhone,
    IconDeviceFloppy,
    IconSearch,
    IconLoader2,
    IconFileLike,
    IconWriting
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"
import { employeeService, type Employee, type UpdateEmployeeDto } from "@/lib/services/employee"
import { getPublicApiOrigin } from "@/lib/api-base"
import {
    addressService,
    type Division,
    type District,
    type Thana,
    type PostOffice
} from "@/lib/services/address"

export default function OthersInformationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const employeeIdUrl = searchParams.get("employeeId")
    const companyIdUrl = searchParams.get("companyId")
    const idUrl = searchParams.get("id")

    const [isLoading, setIsLoading] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [employee, setEmployee] = React.useState<Employee | null>(null)
    const [searchId, setSearchId] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)
    const sigInputRef = React.useRef<HTMLInputElement>(null)

    // Address dropdown data
    const [divisions, setDivisions] = React.useState<Division[]>([])

    const [presentDistricts, setPresentDistricts] = React.useState<District[]>([])
    const [presentThanas, setPresentThanas] = React.useState<Thana[]>([])
    const [presentPostOffices, setPresentPostOffices] = React.useState<PostOffice[]>([])

    const [permanentDistricts, setPermanentDistricts] = React.useState<District[]>([])
    const [permanentThanas, setPermanentThanas] = React.useState<Thana[]>([])
    const [permanentPostOffices, setPermanentPostOffices] = React.useState<PostOffice[]>([])

    // Fetch initial divisions
    React.useEffect(() => {
        addressService.getDivisions().then(setDivisions).catch(console.error)
    }, [])

    // Present Address Cascade
    React.useEffect(() => {
        if (employee?.presentDivisionId) {
            addressService.getDistricts(employee.presentDivisionId).then(setPresentDistricts).catch(console.error)
        } else {
            setPresentDistricts([])
        }
    }, [employee?.presentDivisionId])

    React.useEffect(() => {
        if (employee?.presentDistrictId) {
            addressService.getThanas(employee.presentDistrictId).then(setPresentThanas).catch(console.error)
            addressService
                .getPostOffices({ districtId: employee.presentDistrictId })
                .then(setPresentPostOffices)
                .catch(console.error)
        } else {
            setPresentThanas([])
            setPresentPostOffices([])
        }
    }, [employee?.presentDistrictId])

    // Permanent Address Cascade
    React.useEffect(() => {
        if (employee?.permanentDivisionId) {
            addressService.getDistricts(employee.permanentDivisionId).then(setPermanentDistricts).catch(console.error)
        } else {
            setPermanentDistricts([])
        }
    }, [employee?.permanentDivisionId])

    React.useEffect(() => {
        if (employee?.permanentDistrictId) {
            addressService.getThanas(employee.permanentDistrictId).then(setPermanentThanas).catch(console.error)
            addressService
                .getPostOffices({ districtId: employee.permanentDistrictId })
                .then(setPermanentPostOffices)
                .catch(console.error)
        } else {
            setPermanentThanas([])
            setPermanentPostOffices([])
        }
    }, [employee?.permanentDistrictId])

    // Load employee data
    const loadEmployee = React.useCallback(async (empId: string, compId: number) => {
        setIsLoading(true)
        try {
            const data = await employeeService.getEmployee(empId, compId)
            if (data) {
                setEmployee(data)
            } else {
                toast.error("Employee not found")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to load employee data")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const loadEmployeeById = React.useCallback(async (id: number) => {
        setIsLoading(true)
        try {
            const data = await employeeService.getEmployeeById(id)
            if (data) {
                setEmployee(data)
            } else {
                toast.error("Employee not found")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to load employee")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        if (employeeIdUrl && companyIdUrl) {
            loadEmployee(employeeIdUrl, parseInt(companyIdUrl))
        } else if (idUrl) {
            if (companyIdUrl) {
                // If companyId is present, try literal EmployeeId string first
                loadEmployee(idUrl, parseInt(companyIdUrl))
            } else {
                // Otherwise treat as internal integer ID
                const numericId = parseInt(idUrl)
                if (!isNaN(numericId)) {
                    loadEmployeeById(numericId)
                } else {
                    toast.error("Invalid Employee ID format")
                }
            }
        }
    }, [employeeIdUrl, companyIdUrl, idUrl, loadEmployee, loadEmployeeById])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchId.trim()) return

        setIsLoading(true)
        try {
            // Search across all employees to find the right one (returns EmployeeSimple)
            const results = await employeeService.getEmployeesSimple({
                searchTerm: searchId.trim(),
                isActive: undefined
            })

            const foundEmployee = results.find(e => e.employeeId === searchId || e.id.toString() === searchId || e.fullNameEn.toLowerCase().includes(searchId.toLowerCase()))

            if (foundEmployee) {
                // Use internal ID and Company ID for redirection
                router.push(`/management/human-resource/employee-info/others-information?id=${foundEmployee.id}&companyId=${foundEmployee.companyId}`)
            } else {
                toast.error("Employee not found")
            }
        } catch (error) {
            toast.error("Search failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGrossSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const gross = parseFloat(e.target.value) || 0

        // Fixed allowances as per requirements
        const medical = 750
        const food = 1250
        const conveyance = 450
        const other = 0

        // Calculate Basic & House Rent
        // Formula: Basic = (Gross - Medical - Food - Conveyance) / 1.5
        const fixedTotal = medical + food + conveyance + other
        let basic = 0
        let houseRent = 0

        if (gross > fixedTotal) {
            basic = (gross - fixedTotal) / 1.5
            houseRent = gross - fixedTotal - basic
        }

        if (employee) {
            setEmployee({
                ...employee,
                grossSalary: gross,
                basicSalary: parseFloat(basic.toFixed(2)),
                houseRent: parseFloat(houseRent.toFixed(2)),
                medicalAllowance: medical,
                foodAllowance: food,
                conveyance: conveyance,
                otherAllowance: other
            })
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employee) return

        setIsSaving(true)
        try {
            const formData = new FormData(e.currentTarget as HTMLFormElement)

            // Collect all data from form and merge with existing employee data
            const data: UpdateEmployeeDto = {
                ...employee,
                // Personal/Basic
                proximity: formData.get("proximity") as string || employee.proximity,
                religion: formData.get("religion") as string || employee.religion,
                gender: formData.get("gender") as string || employee.gender,
                bloodGroup: formData.get("bloodGroup") as string || employee.bloodGroup,

                // Address
                presentAddress: formData.get("presentAddress") as string,
                presentAddressBn: formData.get("presentAddressBn") as string,
                presentDivisionId: parseInt(formData.get("presentDivisionId") as string) || employee.presentDivisionId,
                presentDistrictId: parseInt(formData.get("presentDistrictId") as string) || employee.presentDistrictId,
                presentThanaId: parseInt(formData.get("presentThanaId") as string) || employee.presentThanaId,
                presentPostOfficeId: parseInt(formData.get("presentPostOfficeId") as string) || employee.presentPostOfficeId,
                presentPostalCode: formData.get("presentPostalCode") as string || employee.presentPostalCode,

                permanentAddress: formData.get("permanentAddress") as string,
                permanentAddressBn: formData.get("permanentAddressBn") as string,
                permanentDivisionId: parseInt(formData.get("permanentDivisionId") as string) || employee.permanentDivisionId,
                permanentDistrictId: parseInt(formData.get("permanentDistrictId") as string) || employee.permanentDistrictId,
                permanentThanaId: parseInt(formData.get("permanentThanaId") as string) || employee.permanentThanaId,
                permanentPostOfficeId: parseInt(formData.get("permanentPostOfficeId") as string) || employee.permanentPostOfficeId,
                permanentPostalCode: formData.get("permanentPostalCode") as string || employee.permanentPostalCode,

                // Family
                fatherNameEn: formData.get("fatherNameEn") as string,
                fatherNameBn: formData.get("fatherNameBn") as string,
                motherNameEn: formData.get("motherNameEn") as string,
                motherNameBn: formData.get("motherNameBn") as string,
                maritalStatus: formData.get("maritalStatus") as string,
                spouseNameEn: formData.get("spouseNameEn") as string,
                spouseNameBn: formData.get("spouseNameBn") as string,
                spouseOccupation: formData.get("spouseOccupation") as string,
                spouseContact: formData.get("spouseContact") as string,

                // Salary (Keep current employee values as they are calculated by handleGrossSalaryChange)
                basicSalary: employee.basicSalary,
                houseRent: employee.houseRent,
                medicalAllowance: employee.medicalAllowance,
                conveyance: employee.conveyance,
                foodAllowance: employee.foodAllowance,
                otherAllowance: employee.otherAllowance,
                grossSalary: employee.grossSalary,

                // Account
                bankName: formData.get("bankName") as string,
                bankBranchName: formData.get("bankBranchName") as string,
                bankAccountNo: formData.get("bankAccountNo") as string,
                bankRoutingNo: formData.get("bankRoutingNo") as string,
                bankAccountType: formData.get("bankAccountType") as string,

                // Emergency
                emergencyContactName: formData.get("emergencyContactName") as string,
                emergencyContactRelation: formData.get("emergencyContactRelation") as string,
                emergencyContactPhone: formData.get("emergencyContactPhone") as string,
                emergencyContactAddress: formData.get("emergencyContactAddress") as string,
            }

            await employeeService.updateEmployee(employee.employeeId, data, employee.companyId || 0)
            toast.success("Information updated successfully")
            loadEmployee(employee.employeeId, employee.companyId || 0)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update information")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!employee) return
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const { url } = await employeeService.uploadImage(file, 'signature')
            setEmployee({ ...employee, signatureImageUrl: url })
            toast.success("Signature uploaded")
        } catch (error) {
            toast.error("Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    if (!employeeIdUrl && !idUrl && !employee) {
        return (
            <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full max-w-2xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Search Employee</h1>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Select Employee</CardTitle>
                        <CardDescription>Enter Employee ID or Name to manage their additional information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Employee ID (e.g. EMP000001)"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <IconLoader2 className="animate-spin size-4" /> : <IconSearch className="size-4 mr-2" />}
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isLoading && !employee) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <IconLoader2 className="animate-spin size-8 text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/management/human-resource/employee-info")}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{employee?.fullNameEn}</h1>
                        <p className="text-sm text-muted-foreground">ID: {employee?.employeeId} | {employee?.designationName} | {employee?.departmentName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        setEmployee(null)
                        router.push("/management/human-resource/employee-info/others-information")
                    }}>
                        Change Employee
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <Tabs defaultValue="family" className="w-full">
                    <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide">
                        <TabsList className="w-full justify-start h-auto bg-muted/50 p-1 border rounded-lg">
                            <TabsTrigger value="family" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <IconUsers className="size-5" />
                                <span>Family Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="salary" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <IconCash className="size-5" />
                                <span>Salary Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="accounts" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <IconCreditCard className="size-5" />
                                <span>Account Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="address" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <IconMapPin className="size-5" />
                                <span>Address</span>
                            </TabsTrigger>
                            <TabsTrigger value="emergency" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <IconPhone className="size-5" />
                                <span>Emergency Contact</span>
                            </TabsTrigger>
                            <TabsTrigger value="signature" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <IconWriting className="size-5" />
                                <span>Signature</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Family Information */}
                    <TabsContent value="family">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconUsers className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Family Information</CardTitle>
                                        <CardDescription>Parents and Spouse details</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fatherNameEn">Father&apos;s Name (English)</Label>
                                        <Input id="fatherNameEn" name="fatherNameEn" defaultValue={employee?.fatherNameEn} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fatherNameBn">Father&apos;s Name (Bangla)</Label>
                                        <Input id="fatherNameBn" name="fatherNameBn" defaultValue={employee?.fatherNameBn} className="font-sutonny" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="motherNameEn">Mother&apos;s Name (English)</Label>
                                        <Input id="motherNameEn" name="motherNameEn" defaultValue={employee?.motherNameEn} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="motherNameBn">Mother&apos;s Name (Bangla)</Label>
                                        <Input id="motherNameBn" name="motherNameBn" defaultValue={employee?.motherNameBn} className="font-sutonny" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="maritalStatus">Marital Status</Label>
                                        <NativeSelect id="maritalStatus" name="maritalStatus" defaultValue={employee?.maritalStatus}>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Widowed">Widowed</option>
                                            <option value="Divorced">Divorced</option>
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="proximity">Proximity (Card ID)</Label>
                                        <Input id="proximity" name="proximity" defaultValue={employee?.proximity} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <NativeSelect id="bloodGroup" name="bloodGroup" defaultValue={employee?.bloodGroup}>
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </NativeSelect>
                                    </div>
                                </div>

                                <div className="pt-4 border-t space-y-4">
                                    <h3 className="text-sm font-semibold">Spouse Information (if married)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="spouseNameEn">Spouse Name (English)</Label>
                                            <Input id="spouseNameEn" name="spouseNameEn" defaultValue={employee?.spouseNameEn} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="spouseNameBn">Spouse Name (Bangla)</Label>
                                            <Input id="spouseNameBn" name="spouseNameBn" defaultValue={employee?.spouseNameBn} className="font-sutonny" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="spouseOccupation">Spouse Occupation</Label>
                                            <Input id="spouseOccupation" name="spouseOccupation" defaultValue={employee?.spouseOccupation} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="spouseContact">Spouse Contact</Label>
                                            <Input id="spouseContact" name="spouseContact" defaultValue={employee?.spouseContact} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Address Information */}
                    <TabsContent value="address">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconMapPin className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Address Information</CardTitle>
                                        <CardDescription>Present and permanent address details</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-6">
                                {/* Present Address */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold border-b pb-2">Present Address</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                                            <Label htmlFor="presentAddress">Address Line (English)</Label>
                                            <Textarea id="presentAddress" name="presentAddress" defaultValue={employee?.presentAddress} placeholder="House/Road/Village etc." />
                                        </div>
                                        <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                                            <Label htmlFor="presentAddressBn">Address Line (Bangla)</Label>
                                            <Textarea id="presentAddressBn" name="presentAddressBn" defaultValue={employee?.presentAddressBn} placeholder="বাড়ি/সড়ক/গ্রাম ইত্যাদি" className="font-sutonny" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="presentDivisionId">Division</Label>
                                            <NativeSelect
                                                id="presentDivisionId"
                                                name="presentDivisionId"
                                                value={employee?.presentDivisionId || 0}
                                                onChange={(e) => setEmployee(prev => prev ? ({ ...prev, presentDivisionId: parseInt(e.target.value) }) : null)}
                                            >
                                                <option value="0">Select Division</option>
                                                {divisions.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="presentDistrictId">District</Label>
                                            <NativeSelect
                                                id="presentDistrictId"
                                                name="presentDistrictId"
                                                value={employee?.presentDistrictId || 0}
                                                onChange={(e) => setEmployee(prev => prev ? ({ ...prev, presentDistrictId: parseInt(e.target.value) }) : null)}
                                                disabled={!employee?.presentDivisionId}
                                            >
                                                <option value="0">Select District</option>
                                                {presentDistricts.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="presentThanaId">Thana</Label>
                                            <NativeSelect
                                                id="presentThanaId"
                                                name="presentThanaId"
                                                value={employee?.presentThanaId || 0}
                                                onChange={(e) => setEmployee(prev => prev ? ({ ...prev, presentThanaId: parseInt(e.target.value) }) : null)}
                                                disabled={!employee?.presentDistrictId}
                                            >
                                                <option value="0">Select Thana</option>
                                                {presentThanas.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="presentPostOfficeId">Post Office</Label>
                                            <NativeSelect
                                                id="presentPostOfficeId"
                                                name="presentPostOfficeId"
                                                value={employee?.presentPostOfficeId || 0}
                                                onChange={(e) => {
                                                    const id = parseInt(e.target.value);
                                                    const po = presentPostOffices.find(p => p.id === id);
                                                    setEmployee(prev => prev ? ({ ...prev, presentPostOfficeId: id, presentPostalCode: po?.code || prev.presentPostalCode }) : null)
                                                }}
                                                disabled={!employee?.presentDistrictId}
                                            >
                                                <option value="0">Select Post Office</option>
                                                {presentPostOffices.map(p => <option key={p.id} value={p.id}>{p.nameEn} ({p.code})</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="presentPostalCode">Postal Code</Label>
                                            <Input id="presentPostalCode" name="presentPostalCode" value={employee?.presentPostalCode || ""} onChange={(e) => setEmployee(prev => prev ? ({ ...prev, presentPostalCode: e.target.value }) : null)} />
                                        </div>
                                    </div>
                                </div>

                                {/* Permanent Address */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Permanent Address</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (employee) {
                                                    setEmployee({
                                                        ...employee,
                                                        permanentAddress: employee.presentAddress,
                                                        permanentAddressBn: employee.presentAddressBn,
                                                        permanentDivisionId: employee.presentDivisionId,
                                                        permanentDistrictId: employee.presentDistrictId,
                                                        permanentThanaId: employee.presentThanaId,
                                                        permanentPostOfficeId: employee.presentPostOfficeId,
                                                        permanentPostalCode: employee.presentPostalCode
                                                    })
                                                }
                                            }}
                                        >
                                            Same as Present
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                                            <Label htmlFor="permanentAddress">Address Line (English)</Label>
                                            <Textarea id="permanentAddress" name="permanentAddress" defaultValue={employee?.permanentAddress} placeholder="House/Road/Village etc." />
                                        </div>
                                        <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                                            <Label htmlFor="permanentAddressBn">Address Line (Bangla)</Label>
                                            <Textarea id="permanentAddressBn" name="permanentAddressBn" defaultValue={employee?.permanentAddressBn} placeholder="বাড়ি/সড়ক/গ্রাম ইত্যাদি" className="font-sutonny" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="permanentDivisionId">Division</Label>
                                            <NativeSelect
                                                id="permanentDivisionId"
                                                name="permanentDivisionId"
                                                value={employee?.permanentDivisionId || 0}
                                                onChange={(e) => setEmployee(prev => prev ? ({ ...prev, permanentDivisionId: parseInt(e.target.value) }) : null)}
                                            >
                                                <option value="0">Select Division</option>
                                                {divisions.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="permanentDistrictId">District</Label>
                                            <NativeSelect
                                                id="permanentDistrictId"
                                                name="permanentDistrictId"
                                                value={employee?.permanentDistrictId || 0}
                                                onChange={(e) => setEmployee(prev => prev ? ({ ...prev, permanentDistrictId: parseInt(e.target.value) }) : null)}
                                                disabled={!employee?.permanentDivisionId}
                                            >
                                                <option value="0">Select District</option>
                                                {permanentDistricts.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="permanentThanaId">Thana</Label>
                                            <NativeSelect
                                                id="permanentThanaId"
                                                name="permanentThanaId"
                                                value={employee?.permanentThanaId || 0}
                                                onChange={(e) => setEmployee(prev => prev ? ({ ...prev, permanentThanaId: parseInt(e.target.value) }) : null)}
                                                disabled={!employee?.permanentDistrictId}
                                            >
                                                <option value="0">Select Thana</option>
                                                {permanentThanas.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="permanentPostOfficeId">Post Office</Label>
                                            <NativeSelect
                                                id="permanentPostOfficeId"
                                                name="permanentPostOfficeId"
                                                value={employee?.permanentPostOfficeId || 0}
                                                onChange={(e) => {
                                                    const id = parseInt(e.target.value);
                                                    const po = permanentPostOffices.find(p => p.id === id);
                                                    setEmployee(prev => prev ? ({ ...prev, permanentPostOfficeId: id, permanentPostalCode: po?.code || prev.permanentPostalCode }) : null)
                                                }}
                                                disabled={!employee?.permanentDistrictId}
                                            >
                                                <option value="0">Select Post Office</option>
                                                {permanentPostOffices.map(p => <option key={p.id} value={p.id}>{p.nameEn} ({p.code})</option>)}
                                            </NativeSelect>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="permanentPostalCode">Postal Code</Label>
                                            <Input id="permanentPostalCode" name="permanentPostalCode" value={employee?.permanentPostalCode || ""} onChange={(e) => setEmployee(prev => prev ? ({ ...prev, permanentPostalCode: e.target.value }) : null)} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Salary Information */}
                    <TabsContent value="salary">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconCash className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Salary Information</CardTitle>
                                        <CardDescription>Salary structure and allowances (Calculated automatically based on Gross Salary)</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="grid gap-2 border-b pb-2 sm:col-span-2 lg:col-span-3 mb-2">
                                        <Label htmlFor="grossSalary" className="font-bold text-primary text-lg">Gross Salary</Label>
                                        <Input
                                            id="grossSalary"
                                            name="grossSalary"
                                            type="number"
                                            step="0.01"
                                            value={employee?.grossSalary || ''}
                                            onChange={handleGrossSalaryChange}
                                            className="border-primary/50 font-bold text-lg h-12"
                                            placeholder="Enter Gross Salary to calculate Breakdown"
                                        />
                                        <p className="text-xs text-muted-foreground">Enter the Gross Salary to automatically calculate the breakdown below.</p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="basicSalary">Basic Salary</Label>
                                        <Input id="basicSalary" name="basicSalary" type="number" step="0.01" value={employee?.basicSalary || 0} readOnly className="bg-muted" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="houseRent">House Rent</Label>
                                        <Input id="houseRent" name="houseRent" type="number" step="0.01" value={employee?.houseRent || 0} readOnly className="bg-muted" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="medicalAllowance">Medical Allowance</Label>
                                        <Input id="medicalAllowance" name="medicalAllowance" type="number" step="0.01" value={employee?.medicalAllowance || 0} readOnly className="bg-muted" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="conveyance">Conveyance</Label>
                                        <Input id="conveyance" name="conveyance" type="number" step="0.01" value={employee?.conveyance || 0} readOnly className="bg-muted" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="foodAllowance">Food Allowance</Label>
                                        <Input id="foodAllowance" name="foodAllowance" type="number" step="0.01" value={employee?.foodAllowance || 0} readOnly className="bg-muted" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="otherAllowance">Other Allowance</Label>
                                        <Input id="otherAllowance" name="otherAllowance" type="number" step="0.01" value={employee?.otherAllowance || 0} readOnly className="bg-muted" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Information */}
                    <TabsContent value="accounts">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconCreditCard className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Account Information</CardTitle>
                                        <CardDescription>Bank account details for salary disbursement</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <NativeSelect
                                            id="bankName"
                                            name="bankName"
                                            defaultValue={employee?.bankName || "Islami Bank Bangladesh Limited"}
                                        >
                                            <option value="Islami Bank Bangladesh Limited">Islami Bank Bangladesh Limited</option>
                                            <option value="Dutch Bangla Bank">Dutch Bangla Bank</option>
                                            <option value="BRAC Bank">BRAC Bank</option>
                                            <option value="Sonali Bank">Sonali Bank</option>
                                            <option value="The City Bank">The City Bank</option>
                                            <option value="Eastern Bank Limited">Eastern Bank Limited</option>
                                            <option value="Other">Other</option>
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bankBranchName">Branch Name</Label>
                                        <NativeSelect
                                            id="bankBranchName"
                                            name="bankBranchName"
                                            defaultValue={employee?.bankBranchName || "Chawrasta"}
                                        >
                                            <option value="Chawrasta">Chawrasta</option>
                                            <option value="Motijheel">Motijheel</option>
                                            <option value="Gulshan">Gulshan</option>
                                            <option value="Banani">Banani</option>
                                            <option value="Mirpur">Mirpur</option>
                                            <option value="Dhanmondi">Dhanmondi</option>
                                            <option value="Uttara">Uttara</option>
                                            <option value="Agrabad">Agrabad</option>
                                            <option value="Other">Other</option>
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bankAccountNo">Account Number</Label>
                                        <Input id="bankAccountNo" name="bankAccountNo" defaultValue={employee?.bankAccountNo} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bankRoutingNo">Routing Number</Label>
                                        <Input id="bankRoutingNo" name="bankRoutingNo" defaultValue={employee?.bankRoutingNo} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bankAccountType">Account Type</Label>
                                        <NativeSelect id="bankAccountType" name="bankAccountType" defaultValue={employee?.bankAccountType || "Savings"}>
                                            <option value="Savings">Savings</option>
                                            <option value="Current">Current</option>
                                            <option value="Salary">Salary</option>
                                            <option value="mCash">mCash</option>
                                            <option value="bank">Bank</option>
                                            <option value="Card">Card</option>
                                        </NativeSelect>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Emergency Contact */}
                    <TabsContent value="emergency">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconPhone className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Emergency Contact</CardTitle>
                                        <CardDescription>Person to contact in case of emergency</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="emergencyContactName">Contact Name</Label>
                                        <Input id="emergencyContactName" name="emergencyContactName" defaultValue={employee?.emergencyContactName} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="emergencyContactRelation">Relation</Label>
                                        <Input id="emergencyContactRelation" name="emergencyContactRelation" defaultValue={employee?.emergencyContactRelation} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                                        <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={employee?.emergencyContactPhone} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="emergencyContactAddress">Address</Label>
                                        <Textarea id="emergencyContactAddress" name="emergencyContactAddress" defaultValue={employee?.emergencyContactAddress} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Signature Information */}
                    <TabsContent value="signature">
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconWriting className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Employee Signature</CardTitle>
                                        <CardDescription>Digital signature for documents</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={sigInputRef}
                                    onChange={handleSigUpload}
                                    accept="image/*"
                                />
                                <div
                                    className="w-full max-w-md h-48 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-primary/20 mb-4 relative group cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                                    onClick={() => sigInputRef.current?.click()}
                                >
                                    {employee?.signatureImageUrl ? (
                                        <img
                                            src={`${getPublicApiOrigin()}${employee.signatureImageUrl}`}
                                            alt="Signature"
                                            className="h-full object-contain p-4"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <IconWriting className="size-12 text-muted-foreground opacity-20" />
                                            <span className="text-muted-foreground">No signature uploaded</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-white font-bold uppercase tracking-wider">
                                            {isUploading ? "Uploading..." : "Click to Update Signature"}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <IconCheck className="size-4 text-green-500" />
                                    Transparent PNG or high-contrast JPG recommended.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6 border-t pt-6">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" className="min-w-32" disabled={isSaving}>
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <IconLoader2 className="animate-spin size-4" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <IconDeviceFloppy className="size-4" />
                                Save All Information
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
