"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
    merchandisingService, 
    ProgramOrder, 
    FabricColorPantone,
    AccessoryRequirement
} from "@/lib/services/merchandising"
import { format } from "date-fns"
import { toast } from "sonner"
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AccessoryProcurementMatrixProps {
    title: string;
    accessoryType: string;
}

export default function AccessoryProcurementMatrix({ title, accessoryType }: AccessoryProcurementMatrixProps) {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = React.useState<ProgramOrder | null>(null)
    const [masterColors, setMasterColors] = React.useState<FabricColorPantone[]>([])
    const [requirements, setRequirements] = React.useState<AccessoryRequirement[]>([])
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const id = parseInt(params.id as string)
            const [orderData, colorsData, requirementsData] = await Promise.all([
                merchandisingService.getProgramOrder(id),
                merchandisingService.getColors(1),
                merchandisingService.getAccessoryRequirements(id, accessoryType)
            ])
            
            setOrder(orderData)
            setMasterColors(colorsData)
            setRequirements(requirementsData)
        } catch (error) {
            console.error(error)
            toast.error(`Failed to fetch ${title} data`)
        } finally {
            setLoading(false)
        }
    }, [params.id, accessoryType, title])

    React.useEffect(() => {
        if (params.id) fetchData()
    }, [fetchData, params.id])

    const getRequirement = (sbId: number) => {
        return requirements.find(r => r.programSizeBreakdownId === sbId)
    }

    const handleCellChange = (sbId: number, field: keyof AccessoryRequirement, value: any) => {
        const newRequirements = [...requirements]
        const index = newRequirements.findIndex(r => r.programSizeBreakdownId === sbId)
        
        if (index > -1) {
            if (field === 'masterColorId') {
                const colorId = parseInt(value)
                const colorName = masterColors.find(c => c.id === colorId)?.colorName
                newRequirements[index] = { ...newRequirements[index], masterColorId: colorId, masterColorName: colorName }
            } else {
                newRequirements[index] = { ...newRequirements[index], [field]: value }
            }
        } else {
            const newItem: AccessoryRequirement = {
                programSizeBreakdownId: sbId,
                accessoryType: accessoryType,
                [field]: value
            }
            if (field === 'masterColorId') {
                const colorId = parseInt(value)
                const colorName = masterColors.find(c => c.id === colorId)?.colorName
                newItem.masterColorName = colorName
                newItem.masterColorId = colorId
            }
            newRequirements.push(newItem)
        }
        
        setRequirements(newRequirements)
    }

    const handleSave = async () => {
        if (!order) return
        try {
            setSaving(true)
            await merchandisingService.saveAccessoryRequirements(order.id, accessoryType, requirements)
            toast.success(`${title} mappings saved successfully`)
        } catch (error) {
            console.error(error)
            toast.error(`Failed to save ${title} mappings`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-screen">
                <IconLoader2 className="size-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading {title} Sheet...</p>
            </div>
        )
    }

    if (!order) return null

    const programTotal = order.articles?.reduce((acc: any, item: any) => acc + item.totalQty, 0) || 0

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 bg-background min-h-screen transition-colors duration-300">
            {/* Header Section */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" size="icon" className="rounded-full shadow-sm hover:translate-x-[-1px] transition-all border-border bg-card text-foreground"
                        onClick={() => router.back()}
                    >
                        <IconArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                            {title} Procurement Matrix
                        </h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Program: {order.programNumber} | {order.buyerName}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs tracking-widest rounded-lg shadow-md border-none"
                >
                    {saving ? <IconLoader2 className="size-4 animate-spin mr-2" /> : <IconDeviceFloppy className="size-4 mr-2" />}
                    Save Booking Data
                </Button>
            </div>

            <div className="w-full">
                {/* Visual Header */}
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className="text-2xl font-black text-foreground tracking-tight leading-none uppercase">{order.factoryName}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.2em]">{order.factoryAddress}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-4 mt-6 p-6 bg-card rounded-2xl border border-border">
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Program #</Label>
                            <p className="text-sm font-black text-foreground uppercase">{order.programNumber}</p>
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Buyer Entity</Label>
                            <p className="text-sm font-black text-foreground uppercase">{order.buyerName}</p>
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Customer</Label>
                            <p className="text-sm font-black text-foreground uppercase">{order.customerName || "---"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Order Date</Label>
                            <p className="text-sm font-black text-foreground uppercase">
                                {order.orderDate ? (
                                    (() => {
                                        const d = new Date(order.orderDate);
                                        return isNaN(d.getTime()) ? "N/A" : format(d, 'dd MMM yyyy');
                                    })()
                                ) : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="border border-border rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest text-center">
                                <th className="p-3 border-r border-primary-foreground/10">SL</th>
                                <th className="p-3 border-r border-primary-foreground/10">Article</th>
                                <th className="p-3 border-r border-primary-foreground/10">Item</th>
                                <th className="p-3 border-r border-primary-foreground/10">Garment Color</th>
                                <th className="p-3 border-r border-primary-foreground/10">Qty to Book</th>
                                <th className="p-3 border-r border-primary-foreground/10">{title} Color Spec</th>
                                <th className="p-3 border-r border-primary-foreground/10">Specification</th>
                                <th className="p-3">Required Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.articles?.map((item: any, itemIdx: number) => {
                                const totalRows = item.colors.reduce((acc: number, color: any) => acc + color.sizeBreakdowns.length, 0);
                                let rowCounter = 0;

                                return item.colors.map((color: any, colorIdx: number) => {
                                    return color.sizeBreakdowns.map((sb: any, sbIdx: number) => {
                                        const isFirstRowOfItem = rowCounter === 0;
                                        rowCounter++;
                                        const req = getRequirement(sb.id);

                                        return (
                                            <tr key={`${item.id}-${color.id}-${sb.id || sbIdx}`} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                 {isFirstRowOfItem && (
                                                    <>
                                                        <td className="p-3 text-center font-black border-r border-border align-middle bg-muted/30 text-foreground" rowSpan={totalRows}>{itemIdx + 1}</td>
                                                        <td className="p-3 text-center font-bold border-r border-border align-middle uppercase text-blue-600 dark:text-blue-400" rowSpan={totalRows}>{item.newArticleNo}</td>
                                                        <td className="p-3 text-center font-black border-r border-border align-middle uppercase text-[10px] text-foreground" rowSpan={totalRows}>{item.itemName}</td>
                                                    </>
                                                )}

                                                 <td className="p-2 border-r border-border font-black uppercase text-[10px] text-muted-foreground pl-4">{color.colorName}</td>
                                                
                                                <td className="p-2 border-r border-border text-center font-black bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400">{sb.rowTotal}</td>

                                                <td className="p-2 border-r border-border bg-emerald-50/10 dark:bg-emerald-950/10">
                                                    <Select
                                                        value={req?.masterColorId?.toString() || ""}
                                                        onValueChange={(val) => handleCellChange(sb.id, 'masterColorId', val)}
                                                    >
                                                        <SelectTrigger className="h-8 w-full bg-background border-border rounded-md text-[10px] font-black uppercase shadow-none focus:ring-1 focus:ring-primary">
                                                            <SelectValue placeholder="SELECT COLOR" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {masterColors.map(c => (
                                                                <SelectItem key={c.id} value={c.id.toString()} className="text-xs uppercase font-bold">
                                                                    {c.colorName} {c.pantoneCode ? `(${c.pantoneCode})` : ""}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-2 border-r border-border">
                                                    <Input 
                                                        value={req?.specification || ""}
                                                        onChange={(e) => handleCellChange(sb.id, 'specification', e.target.value)}
                                                        className="h-8 w-full bg-background border-border rounded-md text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-primary shadow-none"
                                                        placeholder="E.g. Size, Type..."
                                                    />
                                                </td>
                                                <td className="p-2 bg-emerald-50/10 dark:bg-emerald-950/10">
                                                    <Input 
                                                        type="number"
                                                        value={req?.requiredQuantity || ""}
                                                        onChange={(e) => handleCellChange(sb.id, 'requiredQuantity', e.target.value)}
                                                        className="h-8 w-full bg-background border-border rounded-md text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-primary shadow-none text-center"
                                                        placeholder="0"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    });
                                });
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted font-black uppercase text-[10px] border-t border-border">
                                <td colSpan={4} className="p-4 text-left border-r border-border tracking-widest text-muted-foreground">Total Order Quantity Summary</td>
                                <td className="p-4 text-center bg-orange-600 text-white shadow-inner">{programTotal.toLocaleString()} PCS</td>
                                <td colSpan={3} className="p-4 bg-muted"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    )
}
