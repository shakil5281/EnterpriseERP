import api from "../api";

export interface Holiday {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    type: "Public" | "Company" | "Religious";
    description?: string;
    isActive: boolean;
    companyId?: number;
}

export const holidayService = {
    getHolidays: async () => {
        const response = await api.get<Holiday[]>("/Holiday");
        return response.data;
    },
    getHoliday: async (id: number) => {
        const response = await api.get<Holiday>(`/Holiday/${id}`);
        return response.data;
    },
    createHoliday: async (data: any) => {
        const response = await api.post("/Holiday", data);
        return response.data;
    },
    updateHoliday: async (id: number, data: any) => {
        const response = await api.put(`/Holiday/${id}`, data);
        return response.data;
    },
    deleteHoliday: async (id: number) => {
        const response = await api.delete(`/Holiday/${id}`);
        return response.data;
    }
};
