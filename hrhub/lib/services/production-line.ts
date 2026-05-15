import api from '../api';

export interface ProductionLine {
    id: number;
    sl: number;
    lineName: string;
    status: string;
}

export type CreateProductionLine = Omit<ProductionLine, 'id'>;

export const productionLineService = {
    getAll: async () => {
        const response = await api.get<ProductionLine[]>('/productionline');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get<ProductionLine>(`/productionline/${id}`);
        return response.data;
    },
    create: async (data: CreateProductionLine) => {
        const response = await api.post<ProductionLine>('/productionline', data);
        return response.data;
    },
    update: async (id: number, data: CreateProductionLine) => {
        const response = await api.put(`/productionline/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/productionline/${id}`);
        return response.data;
    },
};
