"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    IconId,
    IconPrinter,
    IconDownload,
    IconSearch,
    IconUserCircle,
    IconBarcode,
    IconQrcode,
    IconFilter,
    IconLayoutGrid,
    IconPalette,
    IconCheck,
    IconLoader,
    IconFileDescription
} from "@tabler/icons-react"
import api from "@/lib/api"
import { type ColumnDef } from "@tanstack/react-table"
import { employeeService, type Employee } from "@/lib/services/employee"
import { organogramService, type Department, type Section, type Designation } from "@/lib/services/organogram"
import { companyService, type Company } from "@/lib/services/company"
import { idCardService } from "@/lib/services/id-card"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"

type CardDesign = "modern" | "classic" | "minimal" | "compact" | "corporate" | "vibrant" | "industrial" | "professional"

export default function IDCardPage() {
    const router = useRouter()
    
    // States
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [selectedEmployees, setSelectedEmployees] = React.useState<Employee[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [selectedDesign, setSelectedDesign] = React.useState<CardDesign>("modern")

    // Filter States
    const [empIdSearch, setEmpIdSearch] = React.useState("")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<number | "All">("All")
    const [deptFilter, setDeptFilter] = React.useState<number | "All">("All")
    const [sectionFilter, setSectionFilter] = React.useState<number | "All">("All")
    const [statusFilter, setStatusFilter] = React.useState("All")

    // Reference Data
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])

    // Load initial data
    React.useEffect(() => {
        companyService.getAll().then(setCompanies).catch(console.error)
    }, [])

    // Cascading filters
    React.useEffect(() => {
        if (selectedCompanyId !== "All") {
            organogramService.getDepartments({ companyId: selectedCompanyId }).then(setDepartments)
        } else {
            setDepartments([])
            setDeptFilter("All")
        }
    }, [selectedCompanyId])

    React.useEffect(() => {
        if (deptFilter !== "All") {
            organogramService.getSections({ departmentId: deptFilter }).then(setSections)
        } else {
            setSections([])
            setSectionFilter("All")
        }
    }, [deptFilter])

    const fetchEmployees = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (statusFilter !== "All") params.status = statusFilter
            if (selectedCompanyId !== "All") params.companyId = selectedCompanyId
            if (deptFilter !== "All") params.departmentId = deptFilter
            if (sectionFilter !== "All") params.sectionId = sectionFilter
            if (empIdSearch.trim()) params.employeeId = empIdSearch.trim()

            const data = await employeeService.getEmployees(params)
            setEmployees(data)
        } catch (error) {
            toast.error("Failed to load employees")
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter, selectedCompanyId, deptFilter, sectionFilter, empIdSearch])

    React.useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    const columns: ColumnDef<Employee>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.employeeId}</span>,
        },
        {
            accessorKey: "fullNameEn",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-primary/10">
                        {row.original.profileImageUrl ? (
                            <img src={getImageUrl(row.original.profileImageUrl)} alt="" className="size-full object-cover" />
                        ) : (
                            <IconUserCircle className="size-full text-muted-foreground/40" />
                        )}
                    </div>
                    <span className="font-medium text-sm">{row.original.fullNameEn}</span>
                </div>
            ),
        },
        {
            accessorKey: "designationName",
            header: "Designation",
            cell: ({ row }) => <span className="text-xs">{row.original.designationName || '-'}</span>,
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => <Badge variant="outline" className="font-normal text-[10px]">{row.original.departmentName || 'N/A'}</Badge>,
        },
    ]

    const handleGeneratePDF = async (mode: 'download' | 'print' = 'download') => {
        if (selectedEmployees.length === 0) {
            toast.error("Please select at least one employee")
            return
        }

        setIsGenerating(true)
        const toastId = toast.loading(`${mode === 'download' ? 'Generating' : 'Preparing print for'} ${selectedEmployees.length} ID cards via server...`)

        try {
            const response = await api.post("/idcard/generate", {
                employeeIds: selectedEmployees.map(emp => emp.id),
                design: selectedDesign
            }, {
                responseType: 'blob'
            })

            const blob = new Blob([response.data], { type: "application/pdf" })
            const url = window.URL.createObjectURL(blob)
            
            // Both modes now open in a new tab for preview/print
            const printWindow = window.open(url, '_blank')
            if (printWindow) {
                toast.success(mode === 'download' ? "PDF Preview opened" : "Print preview opened", { id: toastId })
            } else {
                // Fallback to download if popup is blocked
                const a = document.createElement("a")
                a.href = url
                a.download = `IDCards_${new Date().getTime()}.pdf`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                toast.error("Pop-up blocked. PDF downloaded instead.", { id: toastId })
            }
            
            setTimeout(() => window.URL.revokeObjectURL(url), 60000)
        } catch (error) {
            console.error("PDF error:", error)
            toast.error("Failed to generate PDF", { id: toastId })
        } finally {
            setIsGenerating(false)
        }
    }

    const renderCardHTML = (emp: Employee, design: CardDesign, side: "front" | "back" = "front") => {
        const primaryColor = design === "modern" ? "#0f172a" : design === "compact" ? "#1e293b" : "#334155"
        const accentColor = "#3b82f6"
        
        if (side === "back") {
            return `
                <div style="width: 100%; height: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; font-family: sans-serif; padding: 15px; box-sizing: border-box; text-align: center;">
                    <div style="font-size: 10px; font-weight: bold; color: ${primaryColor}; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Terms & Conditions</div>
                    <div style="font-size: 7px; color: #64748b; text-align: left; line-height: 1.4;">
                        1. This card is official property.<br/>
                        2. If found, please return to office.<br/>
                        3. Misuse is a punishable offense.<br/>
                        4. Loss must be reported instantly.
                    </div>
                    <div style="margin-top: 15px;">
                        <div style="font-size: 8px; font-weight: bold; color: #1e293b;">Emergency Contact</div>
                        <div style="font-size: 9px; color: ${accentColor}; font-weight: bold; margin-top: 2px;">+880 1711 000000</div>
                    </div>
                    <div style="margin-top: auto; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                        <div style="font-size: 6px; color: #94a3b8;">Authorized Signature</div>
                        <div style="height: 20px; background: #f8fafc; margin-top: 4px; border-radius: 4px;"></div>
                    </div>
                    <div style="margin-top: 10px; font-size: 6px; color: #94a3b8;">
                        HR HUB TECH - Masterbari, Gazipur
                    </div>
                </div>
            `
        }

        const designs: Record<string, string> = {
            modern: `
                <div style="width: 100%; height: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; font-family: sans-serif;">
                    <div style="height: 35px; background: #1e3a8a; display: flex; align-items: center; padding: 0 10px; color: white; font-weight: bold; font-size: 10px;">HR HUB TECH</div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding-top: 10px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #e2e8f0; background: #f1f5f9; overflow: hidden;">
                            <img src="${emp.profileImageUrl ? getImageUrl(emp.profileImageUrl) : 'https://api.dicebear.com/7.x/initials/svg?seed=' + emp.fullNameEn}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                        <div style="margin-top: 5px; text-align: center; padding: 0 5px;">
                            <div style="font-weight: bold; font-size: 11px; color: #1e3a8a;">${emp.fullNameEn}</div>
                            <div style="font-size: 7px; color: #64748b; font-weight: bold;">${emp.designationName || ''}</div>
                        </div>
                        <div style="margin-top: 10px; width: 100%; padding: 0 10px; font-size: 6px; color: #64748b;">
                            <div style="display: flex; justify-content: space-between; border-bottom: 0.5px solid #f1f5f9; padding: 2px 0;"><span>ID:</span><b>${emp.employeeId}</b></div>
                            <div style="display: flex; justify-content: space-between; border-bottom: 0.5px solid #f1f5f9; padding: 2px 0;"><span>DEPT:</span><b>${emp.departmentName || ''}</b></div>
                        </div>
                    </div>
                </div>
            `,
            classic: `
                <div style="width: 100%; height: 100%; background: #f8fafc; border: 2px solid #0f172a; border-radius: 8px; display: flex; flex-direction: column; font-family: serif;">
                    <div style="background: white; border-bottom: 2px solid #0f172a; padding: 10px; text-align: center;">
                        <div style="font-size: 14px; font-weight: 900; color: #0f172a;">OFFICIAL ID CARD</div>
                    </div>
                    <div style="padding: 10px; display: flex; flex-direction: column; align-items: center; flex: 1;">
                        <div style="width: 70px; height: 90px; border: 1px solid #0f172a; background: white; padding: 2px;">
                            <img src="${emp.profileImageUrl ? getImageUrl(emp.profileImageUrl) : 'https://api.dicebear.com/7.x/initials/svg?seed=' + emp.fullNameEn}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                        <div style="margin-top: 10px; text-align: center;">
                            <div style="font-size: 14px; font-weight: bold; text-decoration: underline;">${emp.fullNameEn}</div>
                            <div style="font-size: 9px; margin-top: 3px;">${emp.designationName || ''}</div>
                        </div>
                        <div style="margin-top: auto; font-size: 8px; width: 100%; text-align: center;">
                            <div>ID: ${emp.employeeId}</div>
                        </div>
                    </div>
                </div>
            `,
            minimal: `
                 <div style="width: 100%; height: 100%; background: white; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; font-family: sans-serif; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 80px; height: 80px; border-radius: 16px; overflow: hidden; background: #f1f5f9;">
                            <img src="${emp.profileImageUrl ? getImageUrl(emp.profileImageUrl) : 'https://api.dicebear.com/7.x/initials/svg?seed=' + emp.fullNameEn}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                        <div style="margin-top: 15px; text-align: center;">
                            <h3 style="font-size: 16px; margin: 0; color: #1e293b;">${emp.fullNameEn}</h3>
                            <p style="font-size: 10px; margin: 5px 0 0; color: #64748b;">${emp.designationName || ''}</p>
                        </div>
                        <div style="margin-top: 20px; background: #f8fafc; border-radius: 8px; padding: 8px 15px; width: 100%;">
                            <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px;">Identity Number</div>
                            <div style="font-size: 12px; font-weight: bold; color: #334155;">${emp.employeeId}</div>
                        </div>
                    </div>
                    <div style="background: #3b82f6; height: 8px;"></div>
                </div>
            `,
            compact: `
                 <div style="width: 100%; height: 100%; background: #0f172a; color: white; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; font-family: sans-serif;">
                    <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                        <div style="width: 20px; height: 20px; border-radius: 4px; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">H</div>
                        <div style="font-size: 10px; font-weight: bold;">HR HUB TECH</div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <div style="width: 60px; height: 70px; border-radius: 4px; overflow: hidden; border: 1px solid #3b82f6;">
                            <img src="${emp.profileImageUrl ? getImageUrl(emp.profileImageUrl) : 'https://api.dicebear.com/7.x/initials/svg?seed=' + emp.fullNameEn}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; font-weight: bold; line-height: 1.2;">${emp.fullNameEn}</div>
                            <div style="font-size: 8px; color: #3b82f6; margin-top: 4px; font-weight: bold;">${emp.designationName || ''}</div>
                        </div>
                    </div>
                    <div style="margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between;">
                        <div style="text-align: right; width: 100%;">
                            <div style="font-size: 10px; font-weight: bold; color: #3b82f6;">${emp.employeeId}</div>
                        </div>
                    </div>
                </div>
            `,
            corporate: `
                <div style="width: 100%; height: 100%; background: white; border-top: 4px solid #312e81; display: flex; flex-direction: column; font-family: sans-serif; padding: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 10px; font-weight: 900; color: #312e81;">CORPORATE</div>
                        <div style="width: 15px; height: 15px; background: #312e81; border-radius: 2px;"></div>
                    </div>
                    <div style="display: flex; margin-top: 15px;">
                        <div style="width: 50px; height: 60px; background: #f1f5f9; border-radius: 4px;"></div>
                        <div style="margin-left: 10px;">
                            <div style="font-size: 10px; font-weight: bold;">${emp.fullNameEn}</div>
                            <div style="font-size: 6px; color: #312e81;">${emp.designationName || ''}</div>
                        </div>
                    </div>
                    <div style="margin-top: auto; background: #312e81; color: white; padding: 5px; font-size: 7px; font-weight: bold; text-align: center; border-radius: 4px;">ID: ${emp.employeeId}</div>
                </div>
            `,
            vibrant: `
                <div style="width: 100%; height: 100%; background: white; display: flex; flex-direction: column; font-family: sans-serif;">
                    <div style="height: 50px; background: #f97316; padding: 10px; position: relative;">
                        <div style="font-size: 8px; color: white; font-weight: bold;">VIBRANT</div>
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: white; border: 2px solid #f97316; position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); overflow: hidden;"></div>
                    </div>
                    <div style="margin-top: 30px; text-align: center; padding: 10px;">
                        <div style="font-size: 12px; font-weight: 900; color: #1e293b;">${emp.fullNameEn}</div>
                        <div style="font-size: 7px; color: #f97316; font-weight: bold; margin-top: 2px;">${emp.designationName || ''}</div>
                    </div>
                </div>
            `,
            industrial: `
                <div style="width: 100%; height: 100%; background: #f1f5f9; border: 1px solid #475569; display: flex; flex-direction: column; font-family: monospace;">
                    <div style="background: #334155; color: #fbbf24; padding: 5px; font-size: 8px; font-weight: bold;">INDUSTRIAL UNIT</div>
                    <div style="padding: 10px; display: flex;">
                        <div style="flex: 1;">
                            <div style="font-size: 5px; color: #64748b;">NAME</div>
                            <div style="font-size: 9px; font-weight: bold;">${emp.fullNameEn}</div>
                        </div>
                        <div style="width: 45px; height: 55px; border: 1px solid #334155; background: #cbd5e1;"></div>
                    </div>
                    <div style="margin-top: auto; background: #fbbf24; color: black; padding: 4px; font-size: 8px; font-weight: 900; text-align: center;">ID: ${emp.employeeId}</div>
                </div>
            `,
            professional: `
                <div style="width: 100%; height: 100%; background: white; border-bottom: 5px solid #1e40af; display: flex; flex-direction: column; font-family: sans-serif; padding: 10px;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 10px; height: 10px; background: #1e40af; border-radius: 50%;"></div>
                        <div style="font-size: 8px; font-weight: bold; color: #1e40af;">PROFESSIONAL</div>
                    </div>
                    <div style="display: flex; margin-top: 15px;">
                        <div style="flex: 1;">
                            <div style="font-size: 10px; font-weight: 900;">${emp.fullNameEn}</div>
                            <div style="font-size: 6px; color: #1e40af;">${emp.designationName || ''}</div>
                        </div>
                        <div style="width: 45px; height: 55px; background: #f1f5f9; border-radius: 4px;"></div>
                    </div>
                    <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 5px;">
                        <div style="font-size: 5px; color: #94a3b8;">EMPLOYEE ID</div>
                        <div style="font-size: 7px; font-weight: bold;">${emp.employeeId}</div>
                    </div>
                </div>
            `
        }
        
        return designs[design]
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                        <IconId className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bulk ID Card Generator</h1>
                        <p className="text-sm text-muted-foreground">Select employees and choose a design to generate professional ID cards (Front & Back).</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        className="gap-2 h-11 px-6 shadow-lg shadow-primary/20" 
                        onClick={() => handleGeneratePDF('download')}
                        disabled={isGenerating || selectedEmployees.length === 0}
                    >
                        {isGenerating ? <IconLoader className="size-4 animate-spin" /> : <IconFileDescription className="size-4" />}
                        Preview PDF ({selectedEmployees.length})
                    </Button>
                </div>
            </div>

            {/* Design Selection */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <IconPalette className="size-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Choose Card Design (Front & Back)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(["modern", "classic", "minimal", "compact", "corporate", "vibrant", "industrial", "professional"] as CardDesign[]).map((design) => (
                        <div 
                            key={design}
                            onClick={() => setSelectedDesign(design)}
                            className={`relative cursor-pointer group transition-all duration-300 rounded-2xl border-2 overflow-hidden bg-white shadow-sm ${selectedDesign === design ? 'border-primary ring-4 ring-primary/10 scale-[1.02]' : 'border-slate-200 hover:border-primary/30 hover:scale-[1.01]'}`}
                        >
                            <div className="h-64 bg-slate-50/50 flex items-center justify-center p-4 gap-3 overflow-hidden relative">
                                <div className="absolute top-2 left-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Preview</div>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-full aspect-[54/86] transform scale-[0.8] shadow-md rounded-sm overflow-hidden" dangerouslySetInnerHTML={{ __html: renderCardHTML({ fullNameEn: "John Doe", employeeId: "EMP-001", designationName: "Developer", departmentName: "IT", bloodGroup: "O+" } as any, design, "front") }} />
                                    <span className="mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Front Side</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-full aspect-[54/86] transform scale-[0.8] shadow-md rounded-sm overflow-hidden" dangerouslySetInnerHTML={{ __html: renderCardHTML({ fullNameEn: "John Doe", employeeId: "EMP-001" } as any, design, "back") }} />
                                    <span className="mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Back Side</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white border-t flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold capitalize block">{design} Design</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">Standard CR80 Size</span>
                                </div>
                                {selectedDesign === design ? (
                                    <div className="size-6 bg-primary rounded-full flex items-center justify-center">
                                        <IconCheck className="size-4 text-white" />
                                    </div>
                                ) : (
                                    <div className="size-6 rounded-full border-2 border-slate-200 group-hover:border-primary/50 transition-colors" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconFilter className="size-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">Advanced Selection Filters</CardTitle>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => {
                                setEmpIdSearch("")
                                setSelectedCompanyId("All")
                                setDeptFilter("All")
                                setSectionFilter("All")
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Company</Label>
                            <NativeSelect value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value === "All" ? "All" : Number(e.target.value))} className="h-9 bg-background">
                                <option value="All">All Companies</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.companyNameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Department</Label>
                            <NativeSelect value={deptFilter} onChange={(e) => setDeptFilter(e.target.value === "All" ? "All" : Number(e.target.value))} className="h-9 bg-background" disabled={selectedCompanyId === "All"}>
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Section</Label>
                            <NativeSelect value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value === "All" ? "All" : Number(e.target.value))} className="h-9 bg-background" disabled={deptFilter === "All"}>
                                <option value="All">All Sections</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Search ID</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Employee ID..." 
                                    className="h-9 pl-9 bg-background" 
                                    value={empIdSearch}
                                    onChange={(e) => setEmpIdSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employee List Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2">
                        <IconLoader className="size-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground font-medium">Loading employee records...</span>
                    </div>
                ) : (
                    <DataTable
                        data={employees}
                        columns={columns}
                        showTabs={false}
                        showActions={false}
                        enableSelection={true}
                        searchKey="fullNameEn"
                        onSelectionChange={setSelectedEmployees}
                    />
                )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-primary/20">
                        <IconLayoutGrid className="size-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-800">Ready to Export</div>
                        <div className="text-xs text-muted-foreground">You have selected <span className="font-bold text-primary">{selectedEmployees.length}</span> employees for the <span className="font-bold text-primary capitalize">{selectedDesign}</span> design.</div>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    className="gap-2 h-10 px-6 border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => handleGeneratePDF('print')}
                    disabled={isGenerating || selectedEmployees.length === 0}
                >
                    {isGenerating ? <IconLoader className="size-4 animate-spin" /> : <IconPrinter className="size-4" />}
                    Print Selected
                </Button>
            </div>
        </div>
    )
}
