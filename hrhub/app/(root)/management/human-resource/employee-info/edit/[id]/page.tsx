"use client"

import * as React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { IconArrowLeft, IconUserCircle, IconCheck, IconPhoto, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { employeeService, type UpdateEmployeeDto } from "@/lib/services/employee"
import { organogramService } from "@/lib/services/organogram"
import { companyService, type Company } from "@/lib/services/company"
import { Switch } from "@/components/ui/switch"
import { getImageUrl } from "@/lib/utils"

export default function EditEmployeePage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const employeeIdParam = params?.id as string
    const companyIdParam = searchParams.get("companyId")
    const companyIdInt = companyIdParam ? parseInt(companyIdParam) : 0
    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetching, setIsFetching] = React.useState(true)
    const [joinDate, setJoinDate] = React.useState<Date | undefined>(undefined)
    const [dob, setDob] = React.useState<Date | undefined>(undefined)

    // Form states
    const [fullNameEn, setFullNameEn] = React.useState("")
    const [employeeId, setEmployeeId] = React.useState("")
    const [fullNameBn, setFullNameBn] = React.useState("")
    const [nid, setNid] = React.useState("")
    const [proximity, setProximity] = React.useState("")
    const [gender, setGender] = React.useState("")
    const [religion, setReligion] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [departmentId, setDepartmentId] = React.useState<number>(0)
    const [sectionId, setSectionId] = React.useState<number>(0)
    const [designationId, setDesignationId] = React.useState<number>(0)
    const [lineId, setLineId] = React.useState<number>(0)
    const [status, setStatus] = React.useState("Active")
    const [shiftId, setShiftId] = React.useState<number>(0)
    const [groupId, setGroupId] = React.useState<number>(0)
    const [floorId, setFloorId] = React.useState<number>(0)
    const [isActive, setIsActive] = React.useState(true)
    const [isOtEnabled, setIsOtEnabled] = React.useState(false)
    const [companyName, setCompanyName] = React.useState("")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<number>(0)
    const [bloodGroup, setBloodGroup] = React.useState("")
    const [profileImageUrl, setProfileImageUrl] = React.useState<string | undefined>(undefined)
    const [signatureImageUrl, setSignatureImageUrl] = React.useState<string | undefined>(undefined)
    const [isUploading, setIsUploading] = React.useState(false)
    const [isUploadingSig, setIsUploadingSig] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const signatureInputRef = React.useRef<HTMLInputElement>(null)

    // Dropdown data
    const [departments, setDepartments] = React.useState<any[]>([])
    const [sections, setSections] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [lines, setLines] = React.useState<any[]>([])
    const [shifts, setShifts] = React.useState<any[]>([])
    const [groups, setGroups] = React.useState<any[]>([])
    const [floors, setFloors] = React.useState<any[]>([])
    const [companies, setCompanies] = React.useState<Company[]>([])

    // Fetch employee data
    React.useEffect(() => {
        if (!employeeIdParam || !companyIdInt) return

        const fetchEmployee = async () => {
            setIsFetching(true)
            try {
                const employee = await employeeService.getEmployee(employeeIdParam, companyIdInt)

                setFullNameEn(employee.fullNameEn || "")
                setEmployeeId(employee.employeeId || "")
                setFullNameBn(employee.fullNameBn || "")
                setNid(employee.nid || "")
                setProximity(employee.proximity || "")
                setGender(employee.gender || "")
                setReligion(employee.religion || "")
                setEmail(employee.email || "")
                setPhone(employee.phoneNumber || "")
                setDepartmentId(employee.departmentId || 0)
                setSectionId(employee.sectionId || 0)
                setDesignationId(employee.designationId || 0)
                setLineId(employee.lineId || 0)
                setShiftId(employee.shiftId || 0)
                setGroupId(employee.groupId || 0)
                setFloorId(employee.floorId || 0)
                setStatus(employee.status || "Active")
                setIsActive(employee.isActive)
                setIsOtEnabled(employee.isOtEnabled)
                setSelectedCompanyId(employee.companyId || 0)
                setCompanyName(employee.companyName || "")
                setBloodGroup(employee.bloodGroup || "")
                setProfileImageUrl(employee.profileImageUrl)
                setSignatureImageUrl(employee.signatureImageUrl)
                setJoinDate(employee.joinDate ? new Date(employee.joinDate) : undefined)
                setDob(employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined)
            } catch (error) {
                toast.error("Failed to load employee data")
                console.error(error)
            } finally {
                setIsFetching(false)
            }
        }

        fetchEmployee()
    }, [employeeIdParam])

    // Fetch dropdown data
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [comps] = await Promise.all([
                    companyService.getAll()
                ])
                setCompanies(comps)
            } catch (error) {
                console.error("Failed to load dropdown data", error)
            }
        }
        fetchData()
    }, [])

    // Set selectedCompanyId when companyName is loaded from employee data (fallback for old records)
    React.useEffect(() => {
        if (companies.length > 0 && companyName && selectedCompanyId === 0) {
            const comp = companies.find(c => c.companyNameEn === companyName)
            if (comp) setSelectedCompanyId(comp.id)
        }
    }, [companies, companyName, selectedCompanyId])

    // Fetch departments when company changes
    React.useEffect(() => {
        if (selectedCompanyId > 0) {
            organogramService.getDepartments({ companyId: selectedCompanyId })
                .then(setDepartments)
                .catch(console.error)

            Promise.all([
                organogramService.getShifts({ companyId: selectedCompanyId }),
                organogramService.getGroups({ companyId: selectedCompanyId }),
                organogramService.getFloors({ companyId: selectedCompanyId })
            ]).then(([shfs, grps, flrs]) => {
                setShifts(shfs)
                setGroups(grps)
                setFloors(flrs)
            }).catch(console.error)
        } else {
            setDepartments([])
            setShifts([])
            setGroups([])
            setFloors([])
        }
    }, [selectedCompanyId])

    // Fetch sections when department changes
    React.useEffect(() => {
        if (departmentId > 0) {
            organogramService.getSections({ departmentId })
                .then(setSections)
                .catch(console.error)
        } else {
            setSections([])
        }
    }, [departmentId])

    // Fetch designations and lines when section changes
    React.useEffect(() => {
        if (sectionId > 0) {
            const fetchData = async () => {
                try {
                    const [desigs, lns] = await Promise.all([
                        organogramService.getDesignations({ sectionId }),
                        organogramService.getLines({ sectionId })
                    ])
                    setDesignations(desigs)
                    setLines(lns)
                } catch (error) {
                    console.error("Failed to load section data", error)
                }
            }
            fetchData()
        } else {
            setDesignations([])
            setLines([])
        }
    }, [sectionId])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const { url } = await employeeService.uploadImage(file, 'profile')
            setProfileImageUrl(url)
            toast.success("Image uploaded successfully")
        } catch (error) {
            toast.error("Failed to upload image")
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingSig(true)
        try {
            const { url } = await employeeService.uploadImage(file, 'signature')
            setSignatureImageUrl(url)
            toast.success("Signature uploaded successfully")
        } catch (error) {
            toast.error("Failed to upload signature")
            console.error(error)
        } finally {
            setIsUploadingSig(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!fullNameEn.trim()) {
            toast.error("Please enter employee name")
            return
        }

        if (departmentId === 0) {
            toast.error("Please select a department")
            return
        }

        if (designationId === 0) {
            toast.error("Please select a designation")
            return
        }

        if (!joinDate) {
            toast.error("Please select joining date")
            return
        }

        setIsLoading(true)

        try {
            const data: UpdateEmployeeDto = {
                employeeId: employeeId || undefined,
                fullNameEn,
                fullNameBn: fullNameBn || undefined,
                nid: nid || undefined,
                proximity: proximity || undefined,
                dateOfBirth: dob?.toISOString(),
                gender: gender || undefined,
                religion: religion || undefined,
                departmentId,
                sectionId: sectionId > 0 ? sectionId : undefined,
                designationId,
                lineId: lineId > 0 ? lineId : undefined,
                shiftId: shiftId > 0 ? shiftId : undefined,
                groupId: groupId > 0 ? groupId : undefined,
                floorId: floorId > 0 ? floorId : undefined,
                status,
                joinDate: joinDate.toISOString(),
                email: email || undefined,
                phoneNumber: phone || undefined,
                profileImageUrl: profileImageUrl || undefined,
                signatureImageUrl: signatureImageUrl || undefined,
                isActive,
                isOtEnabled,
                companyId: selectedCompanyId > 0 ? selectedCompanyId : undefined,
                companyName: companyName || undefined,
                bloodGroup: bloodGroup || undefined,
            }

            await employeeService.updateEmployee(employeeIdParam, data, companyIdInt)
            toast.success("Employee updated successfully")
            router.push("/management/human-resource/employee-info")
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update employee")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <IconLoader className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <IconArrowLeft className="size-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <IconUserCircle className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Edit Employee</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Basic Info & Profile Image */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-primary/10 shadow-sm overflow-hidden text-center">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-sm">Profile Picture</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                />
                                <div
                                    className="size-32 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-inner mb-4 relative group cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {profileImageUrl ? (
                                        <img src={getImageUrl(profileImageUrl)} alt="Profile" className="size-full object-cover" />
                                    ) : (
                                        <IconPhoto className="size-10 text-muted-foreground" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                                            {isUploading ? "Uploading..." : "Upload"}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground px-4">
                                    Allowed JPG, PNG. Max size 2MB.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-sm overflow-hidden text-center">
                            <CardHeader className="bg-muted/30 pb-2">
                                <CardTitle className="text-sm">Employee Signature</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6">
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={signatureInputRef}
                                    onChange={handleSignatureUpload}
                                    accept="image/*"
                                />
                                <div
                                    className="w-full h-24 rounded-md bg-muted flex items-center justify-center border-2 border-dashed border-primary/20 mb-3 relative group cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                                    onClick={() => signatureInputRef.current?.click()}
                                >
                                    {signatureImageUrl ? (
                                        <img src={getImageUrl(signatureImageUrl)} alt="Signature" className="h-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <IconPhoto className="size-6 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">Click to upload signature</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                                            {isUploadingSig ? "Uploading..." : "Update Signature"}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Transparent PNG recommended.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-sm">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-sm">Status & Date</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <NativeSelect
                                        id="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Probation">Probation</option>
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="isActive">Active Status</Label>
                                    <NativeSelect
                                        id="isActive"
                                        value={isActive ? "true" : "false"}
                                        onChange={(e) => setIsActive(e.target.value === "true")}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="joinDate">Joining Date *</Label>
                                    <DatePicker date={joinDate} setDate={setJoinDate} placeholder="Select Joining Date" />
                                </div>
                                <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-muted/20">
                                    <div className="flex flex-col gap-0.5">
                                        <Label htmlFor="is_ot_enabled" className="text-sm font-medium">OT Status</Label>
                                        <p className="text-[10px] text-muted-foreground">Enabled overtime for this employee</p>
                                    </div>
                                    <Switch
                                        id="is_ot_enabled"
                                        checked={isOtEnabled}
                                        onCheckedChange={setIsOtEnabled}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Info Sections */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Unique Information */}
                        <Card className="border-primary/10 shadow-sm">
                            <CardHeader className="bg-muted/30 pb-4 border-b">
                                <CardTitle className="text-sm">Unique Information</CardTitle>
                                <CardDescription>Identifiers used across the system.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="employeeId">Employee ID</Label>
                                        <Input
                                            id="employeeId"
                                            placeholder="Leave empty for auto-generation"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="proximity">Proximity / Card ID</Label>
                                        <Input
                                            id="proximity"
                                            placeholder="RFID/Card number"
                                            value={proximity}
                                            onChange={(e) => setProximity(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Personal Information */}
                        <Card className="border-primary/10 shadow-sm">
                            <CardHeader className="bg-muted/30 pb-4 border-b">
                                <CardTitle className="text-sm">Personal Information</CardTitle>
                                <CardDescription>Basic personal details for identification.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullNameEn">Full Name (English) *</Label>
                                        <Input
                                            id="fullNameEn"
                                            placeholder="e.g. John Doe"
                                            required
                                            value={fullNameEn}
                                            onChange={(e) => setFullNameEn(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullNameBn">Full Name (Bangla)</Label>
                                        <Input
                                            id="fullNameBn"
                                            placeholder="যেমন: জন ডো"
                                            value={fullNameBn}
                                            onChange={(e) => setFullNameBn(e.target.value)}
                                            className="font-sutonny"
                                            lang="bn"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nid">NID (National ID)</Label>
                                        <Input
                                            id="nid"
                                            placeholder="123 456 7890"
                                            value={nid}
                                            onChange={(e) => setNid(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <NativeSelect id="bloodGroup" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </NativeSelect>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="dob">Date of Birth</Label>
                                        <DatePicker date={dob} setDate={setDob} placeholder="Select Date of Birth" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <NativeSelect id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="religion">Religion</Label>
                                        <NativeSelect id="religion" value={religion} onChange={(e) => setReligion(e.target.value)}>
                                            <option value="">Select Religion</option>
                                            <option value="Islam">Islam</option>
                                            <option value="Hinduism">Hinduism</option>
                                            <option value="Buddhism">Buddhism</option>
                                            <option value="Christianity">Christianity</option>
                                            <option value="Others">Others</option>
                                        </NativeSelect>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+880 1XXX XXXXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Official Information */}
                        <Card className="border-primary/10 shadow-sm">
                            <CardHeader className="bg-muted/30 pb-4 border-b">
                                <CardTitle className="text-sm">Company Official Information</CardTitle>
                                <CardDescription>Departmental and structural placement.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="companyName" className="text-red-500">Company Name *</Label>
                                        <NativeSelect
                                            id="companyName"
                                            required
                                            value={selectedCompanyId}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value)
                                                setSelectedCompanyId(id)
                                                const comp = companies.find(c => c.id === id)
                                                setCompanyName(comp ? comp.companyNameEn : "")

                                                // Cascade resets
                                                setDepartmentId(0)
                                                setSectionId(0)
                                                setDesignationId(0)
                                                setLineId(0)
                                                setSections([])
                                                setDesignations([])
                                                setLines([])
                                            }}
                                        >
                                            <option value="0">Select Company</option>
                                            {companies.map(comp => (
                                                <option key={comp.id} value={comp.id}>{comp.companyNameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="department">Department *</Label>
                                        <NativeSelect
                                            id="department"
                                            required
                                            value={departmentId}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value)
                                                setDepartmentId(id)
                                                setSectionId(0)
                                                setDesignationId(0)
                                                setLineId(0)
                                                setDesignations([])
                                                setLines([])
                                            }}
                                        >
                                            <option value="0">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="section">Section</Label>
                                        <NativeSelect
                                            id="section"
                                            value={sectionId}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value)
                                                setSectionId(id)
                                                setDesignationId(0)
                                                setLineId(0)
                                            }}
                                            disabled={!departmentId}
                                        >
                                            <option value="0">Select Section</option>
                                            {sections.map(sec => (
                                                <option key={sec.id} value={sec.id}>{sec.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="designation">Designation *</Label>
                                        <NativeSelect
                                            id="designation"
                                            required
                                            value={designationId}
                                            onChange={(e) => setDesignationId(parseInt(e.target.value))}
                                            disabled={!sectionId}
                                        >
                                            <option value="0">Select Designation</option>
                                            {designations.map(desig => (
                                                <option key={desig.id} value={desig.id}>{desig.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="line">Line</Label>
                                        <NativeSelect
                                            id="line"
                                            value={lineId}
                                            onChange={(e) => setLineId(parseInt(e.target.value))}
                                            disabled={!sectionId}
                                        >
                                            <option value="0">Select Line</option>
                                            {lines.map(line => (
                                                <option key={line.id} value={line.id}>{line.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="shift">Shift</Label>
                                        <NativeSelect
                                            id="shift"
                                            value={shiftId}
                                            onChange={(e) => setShiftId(parseInt(e.target.value))}
                                        >
                                            <option value="0">Select Shift</option>
                                            {shifts.map(item => (
                                                <option key={item.id} value={item.id}>{item.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="group">Group</Label>
                                        <NativeSelect
                                            id="group"
                                            value={groupId}
                                            onChange={(e) => setGroupId(parseInt(e.target.value))}
                                        >
                                            <option value="0">Select Group</option>
                                            {groups.map(item => (
                                                <option key={item.id} value={item.id}>{item.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="floor">Floor</Label>
                                        <NativeSelect
                                            id="floor"
                                            value={floorId}
                                            onChange={(e) => setFloorId(parseInt(e.target.value))}
                                        >
                                            <option value="0">Select Floor</option>
                                            {floors.map(item => (
                                                <option key={item.id} value={item.id}>{item.nameEn}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t pt-6">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => router.push(`/management/human-resource/employee-info/others-information?employeeId=${employeeIdParam}&companyId=${companyIdInt}`)}
                    >
                        Others Information
                    </Button>
                    <Button type="submit" className="min-w-32" disabled={isLoading}>
                        {isLoading ? "Updating..." : (
                            <span className="flex items-center gap-2">
                                <IconCheck className="size-4" />
                                Update Employee
                            </span>
                        )}
                    </Button>
                </div>
            </form >
        </div >
    )
}
