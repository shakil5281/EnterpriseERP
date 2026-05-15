"use client"

import * as React from "react"
import { merchandisingService, ProgramOrder, ProgramSizeBreakdown, ProgramArticle, ProgramColor } from "@/lib/services/merchandising"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconLoader2,
    IconTableAlias,
    IconSearch,
    IconPlus,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Import jsuites CSS
import "jsuites/dist/jsuites.css"
import "jspreadsheet-ce/dist/jspreadsheet.css"

// Import jspreadsheet
import jspreadsheet from "jspreadsheet-ce"

export default function OrderWorksheetPage() {
    const router = useRouter()
    const jRef = React.useRef<any>(null)
    const spreadsheetRef = React.useRef<HTMLDivElement>(null)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [orders, setOrders] = React.useState<ProgramOrder[]>([])

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const ordersData = await merchandisingService.getAllProgramOrders(1)
            
            const fullOrders = await Promise.all(
                ordersData.map(async (o: ProgramOrder) => {
                    try {
                        return await merchandisingService.getProgramOrder(o.id);
                    } catch (e) {
                        return null;
                    }
                })
            )
            const validOrders = fullOrders.filter((o): o is ProgramOrder => o !== null);
            setOrders(validOrders)

            const spreadsheetData: any[] = []
            validOrders.forEach((order: ProgramOrder) => {
                const articles = order.articles || order.items || [];
                articles.forEach((item: ProgramArticle) => {
                    item.colors?.forEach((color: ProgramColor) => {
                        color.sizeBreakdowns?.forEach((sb: ProgramSizeBreakdown) => {
                            spreadsheetData.push([
                                order.id,
                                order.programNumber,
                                item.newArticleNo,
                                item.itemName,
                                color.colorName,
                                sb.sizeM,
                                sb.sizeL,
                                sb.sizeXL,
                                sb.sizeXXL,
                                sb.sizeXXXL,
                                sb.size3XL,
                                sb.size4XL,
                                sb.size5XL,
                                sb.size6XL,
                                sb.rowTotal,
                                sb.buyerPackingNumber,
                                sb.id, // Column 16: SB ID
                                color.id // Column 17: Color ID
                            ])
                        })
                    })
                })
            })

            if (spreadsheetRef.current && !jRef.current) {
                jRef.current = jspreadsheet(spreadsheetRef.current, {
                    worksheets: [{
                        data: spreadsheetData,
                        columns: [
                            { type: 'text', title: 'Order ID', width: 60, readOnly: true },
                            { type: 'text', title: 'Prog. #', width: 120, readOnly: true },
                            { type: 'text', title: 'Style No', width: 120, readOnly: true },
                            { type: 'text', title: 'Item Name', width: 150, readOnly: true },
                            { type: 'text', title: 'Color', width: 120, readOnly: true },
                            { type: 'numeric', title: 'M', width: 60 },
                            { type: 'numeric', title: 'L', width: 60 },
                            { type: 'numeric', title: 'XL', width: 60 },
                            { type: 'numeric', title: 'XXL', width: 60 },
                            { type: 'numeric', title: 'XXXL', width: 60 },
                            { type: 'numeric', title: '3XL', width: 60 },
                            { type: 'numeric', title: '4XL', width: 60 },
                            { type: 'numeric', title: '5XL', width: 60 },
                            { type: 'numeric', title: '6XL', width: 60 },
                            { type: 'numeric', title: 'Total', width: 100, readOnly: true },
                            { type: 'text', title: 'Packing #', width: 150 },
                            { type: 'hidden', title: 'SB ID' },
                            { type: 'hidden', title: 'Color ID' }
                        ],
                        allowInsertRow: true,
                        allowDeleteRow: true,
                        columnSorting: true,
                        search: true,
                    }],
                    onchange: (instance: any, cell: any, col: string|number, row: string|number, value: any) => {
                        const colIdx = typeof col === 'string' ? parseInt(col) : col;
                        if (colIdx >= 5 && colIdx <= 13) {
                            const rowIdx = typeof row === 'string' ? parseInt(row) : row;
                            let total = 0;
                            for (let i = 5; i <= 13; i++) {
                                total += Number(instance.getValueFromCoords(i, rowIdx)) || 0;
                            }
                            instance.setValueFromCoords(14, rowIdx, total);
                        }
                    },
                    contextMenu: (instance: any, x: any, y: any, e: any) => {
                        const rowIndex = parseInt(y);
                        if (isNaN(rowIndex)) return []; // Right clicked on header or non-row area

                        return [
                            {
                                title: 'Duplicate this row',
                                onclick: () => {
                                    const rowData = [...instance.getRowData(rowIndex)];
                                    rowData[16] = null; // Clear SB ID
                                    instance.insertRow(rowData, rowIndex + 1);
                                    toast.info("Row duplicated. Remember to click Save.");
                                }
                            },
                            {
                                title: 'Delete Row',
                                onclick: () => {
                                    if (confirm("Delete this breakdown?")) {
                                        // Ensure instance is focused and valid before deletion
                                        setTimeout(() => {
                                            instance.deleteRow(rowIndex, 1);
                                        }, 0);
                                    }
                                }
                            }
                        ];
                    }
                });
            } else if (jRef.current) {
                const sheet = Array.isArray(jRef.current) ? jRef.current[0] : (jRef.current.worksheets?.[0] || jRef.current);
                if (sheet && typeof sheet.setData === 'function') {
                    sheet.setData(spreadsheetData);
                }
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load spreadsheet data")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSave = async () => {
        try {
            setSaving(true)
            const sheet = Array.isArray(jRef.current) ? jRef.current[0] : (jRef.current.worksheets?.[0] || jRef.current);
            if (!sheet || typeof sheet.getData !== 'function') throw new Error("Sheet not ready");

            const data = sheet.getData();
            const orderGroups: Record<number, any[]> = {};
            data.forEach((row: any) => {
                const orderId = Number(row[0]);
                if (!orderId) return; // Skip completely blank rows
                if (!orderGroups[orderId]) orderGroups[orderId] = [];
                orderGroups[orderId].push(row);
            });

            for (const orderId in orderGroups) {
                const order = await merchandisingService.getProgramOrder(parseInt(orderId));
                const rows = orderGroups[orderId];
                const articles = order.articles || order.items || [];
                
                articles.forEach((item: ProgramArticle) => {
                    item.colors.forEach((color: ProgramColor) => {
                        const matchingRows = rows.filter((r: any[]) => Number(r[17]) === color.id);
                        
                        // Handle updates and additions
                        matchingRows.forEach((row: any[]) => {
                            const sbId = row[16];
                            if (sbId) {
                                // Existing row: Update
                                const sb = color.sizeBreakdowns.find((s: ProgramSizeBreakdown) => s.id === sbId);
                                if (sb) {
                                    sb.sizeM = Number(row[5]);
                                    sb.sizeL = Number(row[6]);
                                    sb.sizeXL = Number(row[7]);
                                    sb.sizeXXL = Number(row[8]);
                                    sb.sizeXXXL = Number(row[9]);
                                    sb.size3XL = Number(row[10]);
                                    sb.size4XL = Number(row[11]);
                                    sb.size5XL = Number(row[12]);
                                    sb.size6XL = Number(row[13]);
                                    sb.rowTotal = Number(row[14]);
                                    sb.buyerPackingNumber = row[15];
                                }
                            } else {
                                // New row: Add
                                const newSb: ProgramSizeBreakdown = {
                                    sizeM: Number(row[5]),
                                    sizeL: Number(row[6]),
                                    sizeXL: Number(row[7]),
                                    sizeXXL: Number(row[8]),
                                    sizeXXXL: Number(row[9]),
                                    size3XL: Number(row[10]),
                                    size4XL: Number(row[11]),
                                    size5XL: Number(row[12]),
                                    size6XL: Number(row[13]),
                                    rowTotal: Number(row[14]),
                                    buyerPackingNumber: row[15]
                                };
                                color.sizeBreakdowns.push(newSb);
                            }
                        });

                        // Handle deletions: Remove breakdowns from color that are NOT in matchingRows
                        const remainingSbIds = matchingRows.map((r: any[]) => r[16]).filter((id: any) => id !== null);
                        color.sizeBreakdowns = color.sizeBreakdowns.filter((sb: ProgramSizeBreakdown) => 
                            !sb.id || remainingSbIds.includes(sb.id)
                        );
                    });
                });

                await merchandisingService.updateProgramOrder(parseInt(orderId), order);
            }

            toast.success("All changes, including new rows, saved successfully")
            // Refresh data to get new IDs from server
            fetchData();
        } catch (error) {
            console.error(error)
            toast.error("Failed to save worksheet")
        } finally {
            setSaving(false)
        }
    }

    const addNewRow = () => {
        const sheet = Array.isArray(jRef.current) ? jRef.current[0] : (jRef.current.worksheets?.[0] || jRef.current);
        if (sheet) {
            // Adds a row at the end. Note: User must fill Order ID manually or use Duplicate.
            sheet.insertRow();
            toast.info("Blank row added. Better to use Right-Click > Duplicate on an existing row.");
        }
    }

    const handleSearch = (val: string) => {
        setSearchTerm(val);
        const sheet = Array.isArray(jRef.current) ? jRef.current[0] : (jRef.current.worksheets?.[0] || jRef.current);
        if (sheet && typeof sheet.search === 'function') {
            sheet.search(val);
        }
    }

    return (
        <div className="flex flex-col h-screen bg-[#f3f3f3] overflow-hidden">
            <header className="flex items-center justify-between px-4 py-2 bg-[#217346] text-white shadow-md z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/merchandising/orders">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-[#185535] rounded-full h-8 w-8">
                            <IconArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <IconTableAlias className="size-5" />
                        <div>
                            <h1 className="text-sm font-bold tracking-tight leading-none">Order Worksheet</h1>
                            <p className="text-[10px] text-green-100 mt-0.5 opacity-80 uppercase tracking-tighter">Excel Pro Integration</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={addNewRow}
                        className="h-8 px-4 bg-[#185535] text-white hover:bg-[#124128] font-bold text-xs rounded border border-white/20"
                    >
                        <IconPlus className="mr-2 size-3" />
                        Add Blank Row
                    </Button>

                    <div className="relative">
                        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-green-200" />
                        <Input 
                            placeholder="Search content..." 
                            className="w-48 bg-[#185535] border-none text-white pl-8 h-8 text-xs font-medium rounded focus-visible:ring-1 focus-visible:ring-white/20"
                            value={searchTerm}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="h-8 px-4 bg-white text-[#217346] hover:bg-green-50 font-bold text-xs rounded shadow-sm border-none"
                    >
                        {saving ? <IconLoader2 className="mr-2 size-3 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-3" />}
                        {saving ? "Save Changes" : "Save Changes"}
                    </Button>
                </div>
            </header>

            <div className="flex items-center gap-2 px-4 py-1 bg-[#f3f3f3] border-b border-gray-300 shrink-0 select-none overflow-x-auto">
                {["File", "Home", "Insert", "Page Layout", "Formulas", "Data", "Review", "View"].map(tab => (
                    <div key={tab} className={cn(
                        "text-[11px] font-medium px-4 py-1.5 cursor-pointer whitespace-nowrap",
                        tab === "Home" ? "bg-white border border-gray-300 border-b-white rounded-t -mb-[1.5px]" : "hover:bg-gray-200 rounded-t"
                    )}>
                        {tab}
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-auto bg-white p-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <IconLoader2 className="size-8 animate-spin text-[#217346]" />
                        <span className="text-xs font-medium text-gray-500">Initializing Worksheet Engine...</span>
                    </div>
                )}
                <div ref={spreadsheetRef} className="excel-container" />
            </div>

            <footer className="h-6 bg-[#217346] text-white flex items-center px-4 text-[10px] font-medium shrink-0 justify-between">
                <div className="flex items-center gap-4">
                    <span>READY</span>
                    <div className="h-3 w-px bg-white/20" />
                    <span>Displaying {orders.length} Orders</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>100%</span>
                    <div className="h-3 w-px bg-white/20" />
                    <span>CAPS LOCK</span>
                </div>
            </footer>

            <style jsx global>{`
                .excel-container .jexcel_container { padding: 0; }
                .excel-container .jexcel { border: 1px solid #ccc; border-collapse: separate; border-spacing: 0; }
                .excel-container .jexcel > thead > tr > td { background-color: #f3f3f3; border: 1px solid #ccc; padding: 8px; font-size: 11px; font-weight: 600; color: #444; }
                .excel-container .jexcel > tbody > tr > td { border: 1px solid #e0e0e0; padding: 4px 8px; font-size: 11px; color: #333; }
                .excel-container .jexcel_search { display: none; }
                .excel-container .jexcel_contextmenu { z-index: 1000; }
            `}</style>
        </div>
    )
}
