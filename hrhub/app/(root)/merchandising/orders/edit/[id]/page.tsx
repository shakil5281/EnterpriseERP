"use client"

import * as React from "react"
import {
    IconFileDescription,
    IconPlus,
    IconLoader2,
    IconDeviceFloppy as IconSave,
    IconTrash,
    IconArrowLeft,
    IconCopy,
    IconShirt,
    IconPalette,
    IconPrinter,
    IconSearch,
    IconChevronDown
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
    merchandisingService,
    ProgramOrder,
    Buyer,
    Style,
    FabricColorPantone
} from "@/lib/services/merchandising"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface LocalSizeBreakdown {
    id?: number;
    sizeM: number;
    sizeL: number;
    sizeXL: number;
    sizeXXL: number;
    sizeXXXL: number;
    size3XL: number;
    size4XL: number;
    size5XL: number;
    size6XL: number;
    rowTotal: number;
    buyerPackingNumber: string;
}

interface LocalColorRow {
    id: string; // React mapping
    dbId?: number;
    colorId: number;
    colorName: string;
    breakdown: LocalSizeBreakdown;
}

interface LocalProgramArticle {
    id: string; // React mapping
    dbId?: number;
    styleId: number;
    itemName: string;
    packType: number;
    oldArticleNo: string;
    newArticleNo: string;
    rows: LocalColorRow[];
}

export default function EditOrderPage() {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [invalidArticles, setInvalidArticles] = React.useState<string[]>([])
    // Master data
    const [buyers, setBuyers] = React.useState<Buyer[]>([])
    const [styles, setStyles] = React.useState<Style[]>([])
    const [colors, setColors] = React.useState<FabricColorPantone[]>([])

    const [orderDate, setOrderDate] = React.useState<Date | undefined>(new Date())

    const [header, setHeader] = React.useState({
        id: 0,
        programNumber: "",
        buyerId: 0,
        buyerName: "",
        customerName: "",
        fabricDescription: "",
        programName: "",
        factoryName: "Main Unit",
        factoryAddress: "Gazipur",
    })

    const [articles, setArticles] = React.useState<LocalProgramArticle[]>([])

    const createInitialRow = (): LocalColorRow => ({
        id: Math.random().toString(36).substring(2, 9),
        colorId: 0,
        colorName: "",
        breakdown: {
            sizeM: 0, sizeL: 0, sizeXL: 0, sizeXXL: 0, sizeXXXL: 0,
            size3XL: 0, size4XL: 0, size5XL: 0, size6XL: 0,
            rowTotal: 0, buyerPackingNumber: "",
        }
    })

    const createInitialArticle = (): LocalProgramArticle => ({
        id: Math.random().toString(36).substring(2, 9),
        styleId: 0,
        itemName: "",
        packType: 1,
        oldArticleNo: "",
        newArticleNo: "",
        rows: [createInitialRow()]
    })

    const fetchData = React.useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true)
            const orderId = parseInt(id as string)
            if (isNaN(orderId)) {
                router.replace("/merchandising/orders")
                return
            }

            const [orderData, buyerList, colorList] = await Promise.all([
                merchandisingService.getProgramOrder(orderId),
                merchandisingService.getBuyers(1),
                merchandisingService.getColors(1)
            ])

            setBuyers(buyerList)
            setColors(colorList)

            if (orderData.buyerId) {
                const styleList = await merchandisingService.getStyles(orderData.buyerId)
                setStyles(styleList)
            }

            setHeader({
                id: orderData.id,
                programNumber: orderData.programNumber,
                buyerId: orderData.buyerId || 0,
                buyerName: orderData.buyerName,
                customerName: orderData.customerName,
                fabricDescription: orderData.fabricDescription,
                programName: orderData.programName,
                factoryName: orderData.factoryName,
                factoryAddress: orderData.factoryAddress,
            })

            if (orderData.orderDate) {
                setOrderDate(new Date(orderData.orderDate))
            }

            const mappedArticles: LocalProgramArticle[] = orderData.articles.map(article => ({
                id: Math.random().toString(36).substring(2, 9),
                dbId: article.id,
                styleId: article.styleId || 0,
                itemName: article.itemName,
                packType: article.packType,
                oldArticleNo: article.oldArticleNo,
                newArticleNo: article.newArticleNo,
                rows: article.colors.flatMap(color => color.sizeBreakdowns.map(sb => ({
                    id: Math.random().toString(36).substring(2, 9),
                    dbId: color.id,
                    colorId: color.colorId || 0,
                    colorName: color.colorName,
                    breakdown: {
                        id: sb.id,
                        sizeM: sb.sizeM,
                        sizeL: sb.sizeL,
                        sizeXL: sb.sizeXL,
                        sizeXXL: sb.sizeXXL,
                        sizeXXXL: sb.sizeXXXL,
                        size3XL: sb.size3XL,
                        size4XL: sb.size4XL,
                        size5XL: sb.size5XL,
                        size6XL: sb.size6XL,
                        rowTotal: sb.rowTotal,
                        buyerPackingNumber: sb.buyerPackingNumber,
                    }
                })))
            }))

            setArticles(mappedArticles)
        } catch (error: any) {
            if (error.response?.status === 404) {
                router.replace("/merchandising/orders")
            } else {
                console.error("Fetch Error:", error)
                toast.error("Failed to load order for edit")
            }
        } finally {
            setLoading(false)
        }
    }, [id, router])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleBuyerChange = async (buyerId: number) => {
        const buyer = buyers.find(b => b.id === buyerId)
        setHeader(prev => ({
            ...prev,
            buyerId,
            buyerName: buyer?.name || "",
            customerName: buyer?.name || ""
        }))

        if (buyerId > 0) {
            try {
                const styleList = await merchandisingService.getStyles(buyerId)
                setStyles(styleList)
            } catch (error) {
                console.error(error)
            }
        } else {
            setStyles([])
        }
    }

    const handleStyleChange = (articleId: string, styleId: number) => {
        const style = styles.find(s => s.id === styleId)
        setArticles(prev => prev.map(article => {
            if (article.id === articleId) {
                return {
                    ...article,
                    styleId,
                    itemName: style?.productType || "",
                    newArticleNo: style?.styleNumber || "",
                }
            }
            return article
        }))
    }

    const handleColorSelect = (articleId: string, rowId: string, colorId: number) => {
        const color = colors.find(c => c.id === colorId)

        // Check for duplicate color in same article
        if (colorId !== 0) {
            const article = articles.find(a => a.id === articleId)
            if (article?.rows.some(r => r.id !== rowId && r.colorId === colorId)) {
                toast.warning(`Color "${color?.colorName}" is already selected for this article!`, {
                    description: "Please choose a different color or remove the duplicate row."
                })
                return
            }
        }

        setArticles(prev => prev.map(article => {
            if (article.id === articleId) {
                return {
                    ...article,
                    rows: article.rows.map(row => row.id === rowId ? {
                        ...row,
                        colorId,
                        colorName: color?.colorName || ""
                    } : row)
                }
            }
            return article
        }))
    }

    const calculateRowTotal = (b: LocalSizeBreakdown) => {
        return (b.sizeM || 0) + (b.sizeL || 0) + (b.sizeXL || 0) + (b.sizeXXL || 0) +
            (b.sizeXXXL || 0) + (b.size3XL || 0) + (b.size4XL || 0) +
            (b.size5XL || 0) + (b.size6XL || 0)
    }

    const handleCellChange = (articleId: string, rowId: string, field: keyof LocalSizeBreakdown, value: string) => {
        setArticles(prev => prev.map(article => {
            if (article.id === articleId) {
                return {
                    ...article,
                    rows: article.rows.map(row => {
                        if (row.id === rowId) {
                            const newBreakdown = {
                                ...row.breakdown,
                                [field]: field === 'buyerPackingNumber' ? value : parseInt(value) || 0
                            }
                            newBreakdown.rowTotal = calculateRowTotal(newBreakdown)
                            return { ...row, breakdown: newBreakdown }
                        }
                        return row
                    })
                }
            }
            return article
        }))
    }

    const addArticle = () => {
        setArticles(prev => [...prev, createInitialArticle()])
    }

    const removeArticle = (id: string) => {
        if (articles.length === 1) return
        setArticles(prev => prev.filter(a => a.id !== id))
    }

    const addRow = (articleId: string) => {
        setArticles(prev => prev.map(article => {
            if (article.id === articleId) {
                return { ...article, rows: [...article.rows, createInitialRow()] }
            }
            return article
        }))
    }

    const removeRow = (articleId: string, rowId: string) => {
        setArticles(prev => prev.map(article => {
            if (article.id === articleId) {
                if (article.rows.length === 1) return article
                return { ...article, rows: article.rows.filter(r => r.id !== rowId) }
            }
            return article
        }))
    }

    const calculateArticleTotal = (article: LocalProgramArticle) => {
        return article.rows.reduce((acc, curr) => acc + curr.breakdown.rowTotal, 0)
    }

    const grandTotal = articles.reduce((acc, article) => acc + calculateArticleTotal(article), 0)

    const handleSubmit = async () => {
        try {
            if (!header.programNumber || !header.buyerId) {
                toast.error("Program Number and Buyer are required")
                return
            }

            // --- Validation Logic ---
            const errors: string[] = []
            const newInvalidArticles: string[] = []

            articles.forEach((article, idx) => {
                let articleHasError = false
                const styleIds = new Set(articles.filter((_, i) => i < idx).map(it => it.styleId))

                // Style selection check
                if (!article.styleId || article.styleId === 0) {
                    errors.push(`Article ${idx + 1}: Please select a Style from the Style Library.`)
                    articleHasError = true
                } else if (styleIds.has(article.styleId)) {
                    errors.push(`Article ${idx + 1}: This style is already used in another article block. Please select a unique style.`)
                    articleHasError = true
                }

                const colorIds = new Set<number>()

                article.rows.forEach((row, rowIdx) => {
                    // Duplicate color check
                    if (row.colorId !== 0) {
                        if (colorIds.has(row.colorId)) {
                            errors.push(`Article ${idx + 1}: Duplicate color "${row.colorName}" detected.`)
                            articleHasError = true
                        }
                        colorIds.add(row.colorId)
                    }

                    // Color but no size check
                    if (row.colorId !== 0 && row.breakdown.rowTotal === 0) {
                        errors.push(`Article ${idx + 1}: Color "${row.colorName}" selected but no quantities entered.`)
                        articleHasError = true
                    }

                    // Size but no color check
                    if (row.colorId === 0 && row.breakdown.rowTotal > 0) {
                        errors.push(`Article ${idx + 1}: Row ${rowIdx + 1} has quantities but no color selected.`)
                        articleHasError = true
                    }
                })

                if (articleHasError) {
                    newInvalidArticles.push(article.id)
                }
            })

            if (errors.length > 0) {
                setInvalidArticles(newInvalidArticles)
                errors.forEach(err => toast.error(err))
                
                // Reset invalid state for animation trigger
                setTimeout(() => setInvalidArticles([]), 1000)
                return
            }
            // --- End Validation ---

            setSaving(true)

            const payload: any = {
                ...header,
                orderDate: orderDate ? orderDate.toISOString() : new Date().toISOString(),
                companyId: 1,
                branchId: 1,
                articles: articles.map(article => {
                    // Group rows by colorName to avoid duplicate color entities
                    const colorMap = new Map<string, any[]>();
                    article.rows.forEach(row => {
                        const key = row.colorName || `NONE_${row.id}`;
                        if (!colorMap.has(key)) colorMap.set(key, []);
                        colorMap.get(key)!.push(row);
                    });

                    const consolidatedColors = Array.from(colorMap.values()).map(rows => {
                        const first = rows[0];
                        return {
                            id: first.dbId || 0,
                            colorId: first.colorId,
                            colorName: first.colorName,
                            sizeBreakdowns: rows.map(r => ({ ...r.breakdown, id: r.breakdown.id || 0 }))
                        };
                    });

                    return {
                        id: article.dbId || 0,
                        styleId: article.styleId,
                        itemName: article.itemName,
                        packType: article.packType,
                        oldArticleNo: article.oldArticleNo,
                        newArticleNo: article.newArticleNo,
                        totalQty: calculateArticleTotal(article),
                        colors: consolidatedColors
                    };
                })
            }

            await merchandisingService.updateProgramOrder(header.id, payload)
            toast.success("Order Updated Successfuly")
            router.push(`/merchandising/orders/details/${id}`)
        } catch (error) {
            console.error(error)
            toast.error("Update Failed")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <IconLoader2 className="animate-spin text-primary size-8" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 w-full bg-background min-h-screen">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/merchandising/orders/details/${id}`)}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Edit Order Sheet ({header.programNumber})</h1>
                        <p className="text-xs text-muted-foreground">Modify program details and article matrix</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 no-print">
                    <Button variant="outline" onClick={() => window.print()}>
                        <IconPrinter className="size-4 mr-2" /> Print
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving} className="font-bold">
                        {saving ? <IconLoader2 className="animate-spin mr-2" /> : <IconSave className="mr-2" />}
                        Apply Changes
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <IconFileDescription className="size-4" /> Header Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Program #</Label>
                        <Input
                            value={header.programNumber}
                            onChange={e => setHeader({ ...header, programNumber: e.target.value.toUpperCase() })}
                            placeholder="Enter Program Number"
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Buyer</Label>
                        <select
                            value={header.buyerId}
                            onChange={e => handleBuyerChange(parseInt(e.target.value))}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none"
                        >
                            <option value={0}>Select Buyer</option>
                            {buyers.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Season</Label>
                        <Input
                            value={header.programName}
                            onChange={e => setHeader({ ...header, programName: e.target.value })}
                            placeholder="e.g. Summer 2025"
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Date</Label>
                        <DatePicker date={orderDate} setDate={setOrderDate} className="h-9 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold">Fabric</Label>
                        <Input
                            value={header.fabricDescription}
                            onChange={e => setHeader({ ...header, fabricDescription: e.target.value })}
                            placeholder="Material description"
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Factory Unit</Label>
                        <Input
                            value={header.factoryName}
                            onChange={e => setHeader({ ...header, factoryName: e.target.value })}
                            className="h-9 font-bold"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {articles.map((article, idx) => (
                    <Card key={article.id} className={cn(
                        "border-2 border-muted overflow-hidden transition-all duration-300",
                        invalidArticles.includes(article.id) && "border-destructive ring-2 ring-destructive/20 animate-shake"
                    )}>
                        <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b">
                            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="bg-primary text-white size-5 rounded flex items-center justify-center text-[10px]">{idx + 1}</span>
                                Article Specification
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => removeArticle(article.id)} className="h-7 text-muted-foreground hover:text-destructive no-print">
                                <IconTrash className="size-3.5 mr-1" /> Remove Article
                            </Button>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 border-b bg-muted/5">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold">Style Library</Label>
                                <select
                                    value={article.styleId}
                                    onChange={e => handleStyleChange(article.id, parseInt(e.target.value))}
                                    disabled={!header.buyerId}
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none"
                                >
                                    <option value={0}>Select Style</option>
                                    {styles.map(s => (
                                        <option key={s.id} value={s.id}>{s.styleNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold">Item Name</Label>
                                <Input
                                    value={article.itemName}
                                    readOnly
                                    className="h-8 text-xs font-bold bg-muted/50 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold">Article#</Label>
                                <Input
                                    value={article.newArticleNo}
                                    readOnly
                                    className="h-8 text-xs font-mono bg-muted/50 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold">Pack Type</Label>
                                <select
                                    value={article.packType}
                                    onChange={e => setArticles(prev => prev.map(a => a.id === article.id ? { ...a, packType: parseInt(e.target.value) } : a))}
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none"
                                >
                                    <option value={1}>Pack A</option>
                                    <option value={2}>Pack B</option>
                                    <option value={3}>Pack A+B</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-2 text-left text-[10px] font-bold uppercase pl-4 w-48 text-slate-500">Color Library</th>
                                        {['M', 'L', 'XL', '2XL', '3XL', 'P3', 'P4', 'P5', 'P6'].map(sz => (
                                            <th key={sz} className="p-2 text-center text-[10px] font-bold uppercase w-16 text-slate-500">{sz}</th>
                                        ))}
                                        <th className="p-2 text-center text-[10px] font-bold uppercase bg-muted/80 w-24 border-x">Line Total</th>
                                        <th className="p-2 text-left text-[10px] font-bold uppercase pl-2 w-32">Pack Ref</th>
                                        <th className="p-2 w-20 no-print"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {article.rows.map((row) => (
                                        <tr key={row.id} className="hover:bg-muted/5 group">
                                            <td className="p-1.5 pl-4">
                                                <select
                                                    value={row.colorId}
                                                    onChange={e => handleColorSelect(article.id, row.id, parseInt(e.target.value))}
                                                    className="w-full h-8 border rounded px-2 text-[11px] font-bold outline-none"
                                                >
                                                    <option value={0}>No Color</option>
                                                    {colors.map(c => (
                                                        <option key={c.id} value={c.id}>{c.colorName}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            {(['sizeM', 'sizeL', 'sizeXL', 'sizeXXL', 'sizeXXXL', 'size3XL', 'size4XL', 'size5XL', 'size6XL'] as Array<keyof LocalSizeBreakdown>).map(sz => (
                                                <td key={sz} className="p-1">
                                                    <input
                                                        type="text"
                                                        value={row.breakdown[sz] || ""}
                                                        onChange={e => handleCellChange(article.id, row.id, sz, e.target.value)}
                                                        className="w-full text-center h-8 border rounded outline-none text-[11px] font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-1.5 text-center font-bold bg-muted/10 text-xs border-x">
                                                {row.breakdown.rowTotal}
                                            </td>
                                            <td className="p-1.5 pl-2">
                                                <Input
                                                    value={row.breakdown.buyerPackingNumber}
                                                    onChange={e => handleCellChange(article.id, row.id, 'buyerPackingNumber', e.target.value)}
                                                    className="h-8 text-[10px] font-bold shadow-none"
                                                    placeholder="Ref#"
                                                />
                                            </td>
                                            <td className="p-1.5 pr-4 no-print text-right">
                                                <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100">
                                                    <Button variant="ghost" size="icon" onClick={() => addRow(article.id)} className="h-7 w-7"><IconPlus className="size-3.5" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => removeRow(article.id, row.id)} className="h-7 w-7 text-destructive"><IconTrash className="size-3.5" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/20 border-t-2">
                                        <td className="p-2 pl-4" colSpan={10}>
                                            <Button variant="ghost" size="sm" onClick={() => addRow(article.id)} className="text-[10px] font-bold h-7 no-print">
                                                <IconPlus className="size-3.5 mr-1" /> Add Variant
                                            </Button>
                                        </td>
                                        <td className="p-2 text-center bg-muted/50 border-x">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold opacity-70">SUBTOTAL</span>
                                                <span className="text-sm font-bold">{calculateArticleTotal(article).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex items-center justify-between bg-card border p-6 rounded-xl no-print">
                <div className="flex items-center gap-10">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Articles</p>
                        <p className="text-2xl font-bold">{articles.length}</p>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Grand Total</p>
                        <p className="text-2xl font-bold">{grandTotal.toLocaleString()} <span className="text-xs font-medium">PCS</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={addArticle}>
                        <IconPlus className="size-4 mr-1" /> New Article
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" onClick={() => router.push(`/merchandising/orders/details/${id}`)} className="text-muted-foreground hover:text-destructive">Discard</Button>
                    <Button size="lg" onClick={handleSubmit} disabled={saving} className="px-10 h-11 font-bold">
                        {saving && <IconLoader2 className="animate-spin mr-2" />}
                        Apply Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
