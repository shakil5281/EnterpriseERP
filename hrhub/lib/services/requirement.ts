import api from '../api';

export interface ManpowerRequirement {
    id: number;
    departmentId: number;
    departmentName: string;
    designationId: number;
    designationName: string;
    requiredCount: number;
    currentCount: number;
    gap: number;
    note?: string;
    createdAt: string;
}

export interface CreateManpowerRequirementDto {
    departmentId: number;
    designationId: number;
    requiredCount: number;
    note?: string;
}

export const requirementService = {
    getRequirements: async () => {
        const response = await api.get<ManpowerRequirement[]>('/manpowerrequirement');
        return response.data;
    },

    createRequirement: async (data: CreateManpowerRequirementDto) => {
        const response = await api.post('/manpowerrequirement', data);
        return response.data;
    },

    updateRequirement: async (id: number, data: CreateManpowerRequirementDto) => {
        const response = await api.put(`/manpowerrequirement/${id}`, data);
        return response.data;
    },

    deleteRequirement: async (id: number) => {
        const response = await api.delete(`/manpowerrequirement/${id}`);
        return response.data;
    },
};
