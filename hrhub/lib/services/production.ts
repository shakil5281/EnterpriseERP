import api from "../api";

export interface ProductionColor {
    id?: number;
    colorName: string;
    quantity: number;
}

export interface ProductionItem {
    id: number;
    programCode: string;
    buyer: string;
    orderQty: number;
    styleNo: string;
    item: string;
    unitPrice: number;
    status: string;
    colors: ProductionColor[];
}

export interface ProductionReport {
    totalOrderQty: number;
    totalComplete: number;
    totalRunning: number;
    totalPending: number;
    totalClose: number;
}

export const productionService = {
    getProductions: async () => {
        const response = await api.get<ProductionItem[]>("/production");
        return response.data;
    },

    getProduction: async (id: number) => {
        const response = await api.get<ProductionItem>(`/production/${id}`);
        return response.data;
    },

    getReport: async () => {
        const response = await api.get<ProductionReport>("/production/report");
        return response.data;
    },

    createProduction: async (data: Omit<ProductionItem, "id">) => {
        const response = await api.post<ProductionItem>("/production", data);
        return response.data;
    },

    updateProduction: async (id: number, data: Omit<ProductionItem, "id">) => {
        const response = await api.put(`/production/${id}`, data);
        return response.data;
    },

    deleteProduction: async (id: number) => {
        const response = await api.delete(`/production/${id}`);
        return response.data;
    },
};
