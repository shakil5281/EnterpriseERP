import api from "../api";
import { platformApiUrl, unwrapResponse } from "./api-helpers";
import { companyService } from "./company";

export interface Holiday {
    id: number;
    entityIds?: string[];
    name: string;
    startDate: string;
    endDate: string;
    type: "Public" | "Company" | "Religious";
    description?: string;
    isActive: boolean;
    companyId?: number;
}

export interface BackendHolidayDto {
    id: string;
    companyId: string;
    holidayDate: string;
    holidayName: string;
    holidayType: string;
    isPaid: boolean;
    isActive: boolean;
    createdAt: string;
}

function stableIntFromGuid(guid: string): number {
    const hex = guid.replace(/-/g, "").slice(0, 8);
    const n = parseInt(hex, 16);
    return Number.isFinite(n) ? (n | 0) : 0;
}

export const holidayService = {
    getHolidays: async () => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) return [];
        
        const response = await api.get<unknown>(platformApiUrl("/api/v1/holidays"), {
            params: {
                companyId: companyGuid,
                year: new Date().getFullYear()
            }
        });
        const list = unwrapResponse<BackendHolidayDto[]>(response);
        
        // Sort list by date ascending
        list.sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime());
        
        // Group consecutive dates with the same name and type
        const grouped: Holiday[] = [];
        
        for (const item of list) {
            const last = grouped[grouped.length - 1];
            const itemDate = new Date(item.holidayDate);
            
            if (last) {
                const lastEnd = new Date(last.endDate);
                const diffTime = itemDate.getTime() - lastEnd.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                
                if (diffDays === 1 && last.name === item.holidayName && last.type === item.holidayType) {
                    last.endDate = item.holidayDate;
                    if (!last.entityIds) last.entityIds = [];
                    last.entityIds.push(item.id);
                    continue;
                }
            }
            
            grouped.push({
                id: stableIntFromGuid(item.id),
                entityIds: [item.id],
                name: item.holidayName,
                startDate: item.holidayDate,
                endDate: item.holidayDate,
                type: (item.holidayType === "Public" || item.holidayType === "Company" || item.holidayType === "Religious") ? item.holidayType : "Public",
                description: "",
                isActive: item.isActive,
                companyId: stableIntFromGuid(companyGuid)
            });
        }
        
        return grouped;
    },
    getHoliday: async (id: number) => {
        const list = await holidayService.getHolidays();
        const match = list.find(h => h.id === id);
        if (!match) throw new Error("Holiday not found");
        return match;
    },
    createHoliday: async (data: any) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        
        const promises = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            promises.push(api.post(platformApiUrl("/api/v1/holidays"), {
                companyId: companyGuid,
                holidayDate: dateStr,
                holidayName: data.name,
                holidayType: data.type,
                isPaid: true,
                isActive: true
            }));
        }
        await Promise.all(promises);
    },
    updateHoliday: async (id: number, data: any) => {
        // Delete old holiday dates
        await holidayService.deleteHoliday(id);
        // Create new ones
        await holidayService.createHoliday(data);
    },
    deleteHoliday: async (id: number) => {
        const grouped = await holidayService.getHolidays();
        const match = grouped.find(h => h.id === id);
        if (!match || !match.entityIds) throw new Error("Holiday not found");
        
        const promises = match.entityIds.map(entityId => api.delete(platformApiUrl(`/api/v1/holidays/${entityId}`)));
        await Promise.all(promises);
    }
};
