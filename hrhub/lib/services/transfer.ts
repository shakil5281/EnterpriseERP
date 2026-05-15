import api from '../api';

export interface Transfer {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    fromDepartmentId?: number;
    fromDepartmentName?: string;
    fromDesignationId?: number;
    fromDesignationName?: string;
    toDepartmentId: number;
    toDepartmentName?: string;
    toDesignationId: number;
    toDesignationName?: string;
    transferDate: string;
    reason: string;
    status: string;
    createdAt: string;
}

export interface CreateTransferDto {
    employeeId: number;
    toDepartmentId: number;
    toDesignationId: number;
    transferDate: string;
    reason: string;
}

export const transferService = {
    getTransfers: async () => {
        const response = await api.get<Transfer[]>('/transfer');
        return response.data;
    },

    createTransfer: async (data: CreateTransferDto) => {
        const response = await api.post('/transfer', data);
        return response.data;
    },

    updateStatus: async (id: number, status: string, adminRemark?: string) => {
        const response = await api.put(`/transfer/${id}/status`, { status, adminRemark });
        return response.data;
    },

    deleteTransfer: async (id: number) => {
        await api.delete(`/transfer/${id}`);
    }
};
