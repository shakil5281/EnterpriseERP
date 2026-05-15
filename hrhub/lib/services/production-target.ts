import api from '../api';

export interface ProductionTarget {
    id: number;
    assignmentId: number;
    styleNo: string;
    lineName: string;
    buyer: string;
    targetDate: string;
    dailyTarget: number;
    hourlyTarget: number;
    remarks: string;
}

export interface CreateProductionTarget {
    assignmentId: number;
    targetDate: string;
    dailyTarget: number;
    hourlyTarget: number;
    remarks: string;
}

export const productionTargetService = {
    getAll: async (date?: string) => {
        const response = await api.get<ProductionTarget[]>('/productiontarget', {
            params: { date }
        });
        return response.data;
    },
    save: async (data: CreateProductionTarget) => {
        const response = await api.post<ProductionTarget>('/productiontarget', data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/productiontarget/${id}`);
        return response.data;
    }
};
