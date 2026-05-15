"use client"

import * as React from "react"
import {
    IconCalculator,
    IconDeviceFloppy,
    IconRefresh,
    IconBuildingFactory,
    IconCurrencyDollar,
    IconInfoCircle,
    IconCoins,
    IconStretching,
    IconWashDry1,
    IconBuildingWarehouse,
    IconTarget
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { merchandisingService, Buyer, Style } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CostingData {
    id: number;
    fabricCost: string;
    trimCost: string;
    cmCost: string;
    washCost: string;
    printCost: string;
    embroideryCost: string;
    packingCost: string;
    overheadCost: string;
    profitMargin: string;
    fobPrice: number;
    [key: string]: string | number;
}

export default function CostingPage() {
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [styles, setStyles] = React.useState<Style[]>([])
    const [selectedBuyer, setSelectedBuyer] = React.useState<string>("")
    const [selectedStyle, setSelectedStyle] = React.useState<string>("")
    const [loading, setLoading] = React.useState(false)

    const [costing, setCosting] = React.useState<CostingData>({
        id: 0,
        fabricCost: "",
        trimCost: "",
        cmCost: "",
        washCost: "",
        printCost: "",
        embroideryCost: "",
        packingCost: "",
        overheadCost: "",
        profitMargin: "",
        fobPrice: 0
    })

    const calculateFOB = React.useCallback(() => {
        const total =
            Number(costing.fabricCost || 0) +
            Number(costing.trimCost || 0) +
            Number(costing.cmCost || 0) +
            Number(costing.washCost || 0) +
            Number(costing.printCost || 0) +
            Number(costing.embroideryCost || 0) +
            Number(costing.packingCost || 0) +
            Number(costing.overheadCost || 0) +
            Number(costing.profitMargin || 0);
        setCosting((prev: CostingData) => ({ ...prev, fobPrice: total }));
    }, [costing])

    React.useEffect(() => {
        const fetchBuyers = async () => {
            try {
                const data = await merchandisingService.getBuyers(1)
                setBuyers(data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchBuyers()
    }, [])

    const handleBuyerChange = async (value: string) => {
        setSelectedBuyer(value)
        setSelectedStyle("")
        setStyles([])
        try {
            const data = await merchandisingService.getStyles(parseInt(value))
            setStyles(data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleStyleChange = async (value: string) => {
        setSelectedStyle(value)
        try {
            const data = await merchandisingService.getCosting(parseInt(value))
            if (data) {
                const formatted: any = { ...data }
                const numericFields = ['fabricCost', 'trimCost', 'cmCost', 'washCost', 'printCost', 'embroideryCost', 'packingCost', 'overheadCost', 'profitMargin']
                numericFields.forEach(field => {
                    formatted[field] = formatted[field] === 0 ? "" : formatted[field].toString()
                })
                setCosting(formatted)
            } else {
                setCosting({
                    id: 0,
                    fabricCost: "", trimCost: "", cmCost: "", washCost: "",
                    printCost: "", embroideryCost: "", packingCost: "",
                    overheadCost: "", profitMargin: "", fobPrice: 0
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setCosting((prev: CostingData) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!selectedStyle) {
            toast.error("Please select a style first")
            return
        }
        try {
            setLoading(true)
            const apiData = { ...costing }
            const numericFields = ['fabricCost', 'trimCost', 'cmCost', 'washCost', 'printCost', 'embroideryCost', 'packingCost', 'overheadCost', 'profitMargin']
            numericFields.forEach(field => {
                apiData[field] = Number(apiData[field] || 0)
            })

            await merchandisingService.saveCosting({
                ...apiData,
                styleId: parseInt(selectedStyle),
                companyId: 1,
                branchId: 1
            })
            toast.success("Costing saved successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save costing")
        } finally {
            setLoading(false)
        }
    }

    const resetCosting = () => {
        setCosting({
            id: 0, fabricCost: "", trimCost: "", cmCost: "", washCost: "",
            printCost: "", embroideryCost: "", packingCost: "",
            overheadCost: "", profitMargin: "", fobPrice: 0
        })
        setSelectedBuyer("")
        setSelectedStyle("")
    }

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <IconCalculator className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Costing Sheet</h1>
                        <p className="text-muted-foreground text-sm">Strategic price analysis and margin optimization tool</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetCosting} className="gap-2">
                        <IconRefresh className="size-4" />
                        Reset
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading} className="gap-2">
                        <IconDeviceFloppy className="size-4" />
                        {loading ? "Saving..." : "Save Costing"}
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
                <KPICard title="Total FOB" value={`$${costing.fobPrice.toFixed(2)}`} icon={IconCurrencyDollar} color="text-primary" bgColor="bg-primary/10" />
                <KPICard title="Profit Margin" value={`$${Number(costing.profitMargin || 0).toFixed(2)}`} icon={IconCoins} color="text-emerald-600" bgColor="bg-emerald-100" />
                <KPICard title="Corporate Overhead" value={`$${Number(costing.overheadCost || 0).toFixed(2)}`} icon={IconBuildingWarehouse} color="text-indigo-600" bgColor="bg-indigo-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-6">
                {/* Selection Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <IconBuildingFactory className="size-4 text-muted-foreground" /> Style Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Select Buyer</Label>
                                <Select value={selectedBuyer} onValueChange={handleBuyerChange}>
                                    <SelectTrigger className="bg-muted/30">
                                        <SelectValue placeholder="Select Buyer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buyers.map(b => (
                                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Style Number</Label>
                                <Select value={selectedStyle} onValueChange={handleStyleChange} disabled={!selectedBuyer}>
                                    <SelectTrigger className="bg-muted/30">
                                        <SelectValue placeholder="Select Style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {styles.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.styleNumber}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-muted/30">
                        <CardContent className="p-4 flex gap-3">
                            <IconInfoCircle className="size-5 text-primary shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Adjust CM charges based on stitch complexity. Material costs are derived from current BOM entries.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Cost Parameters */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Cost Breakdown Structure</CardTitle>
                                <Button variant="ghost" size="sm" onClick={calculateFOB} className="text-primary text-xs font-bold gap-2">
                                    <IconRefresh className="size-3" />
                                    Recalculate
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <SectionGroup title="Material Costs" icon={<IconStretching className="size-4" />}>
                                    <CostInput label="Fabric Cost" value={costing.fabricCost} onChange={v => handleInputChange("fabricCost", v)} onBlur={calculateFOB} />
                                    <CostInput label="Trims & Accessories" value={costing.trimCost} onChange={v => handleInputChange("trimCost", v)} onBlur={calculateFOB} />
                                </SectionGroup>

                                <SectionGroup title="Manufacturing" icon={<IconWashDry1 className="size-4" />}>
                                    <CostInput label="CM (Cut & Make)" value={costing.cmCost} onChange={v => handleInputChange("cmCost", v)} onBlur={calculateFOB} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <CostInput label="Wash" value={costing.washCost} onChange={v => handleInputChange("washCost", v)} onBlur={calculateFOB} />
                                        <CostInput label="Print / Emb" value={costing.printCost} onChange={v => handleInputChange("printCost", v)} onBlur={calculateFOB} />
                                    </div>
                                </SectionGroup>

                                <SectionGroup title="Logistics" icon={<IconBuildingWarehouse className="size-4" />}>
                                    <CostInput label="Packaging" value={costing.packingCost} onChange={v => handleInputChange("packingCost", v)} onBlur={calculateFOB} />
                                    <CostInput label="Overhead Cost" value={costing.overheadCost} onChange={v => handleInputChange("overheadCost", v)} onBlur={calculateFOB} />
                                </SectionGroup>

                                <SectionGroup title="Profitability" icon={<IconTarget className="size-4" />}>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <Label className="text-xs font-bold text-emerald-700 uppercase mb-2 block">Profit Margin</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">$</span>
                                            <Input
                                                type="number"
                                                className="pl-7 h-11 border-emerald-200 focus:border-emerald-500 bg-white"
                                                value={costing.profitMargin}
                                                onChange={e => handleInputChange("profitMargin", e.target.value)}
                                                onBlur={calculateFOB}
                                            />
                                        </div>
                                    </div>
                                </SectionGroup>
                            </div>

                            <div className="mt-8 p-6 bg-muted/40 rounded-xl flex items-center justify-between border">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Final Price Conclusion</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">${costing.fobPrice.toFixed(2)}</span>
                                        <span className="text-xs font-medium text-muted-foreground">USD / PC (FOB)</span>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none py-1.5 px-4 font-bold text-xs">
                                    Approved Model
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function SectionGroup({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                <span className="text-primary">{icon}</span> {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
}

function CostInput({ label, value, onChange, onBlur }: {
    label: string,
    value: string,
    onChange: (v: string) => void,
    onBlur?: () => void
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                <Input
                    type="number"
                    className="pl-7 h-10 border-muted-foreground/10 focus:border-primary bg-muted/20"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                />
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className="text-xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}


