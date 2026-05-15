import api from '../api';

export interface Shift {
    id: string; // Guid
    companyId: string; // Guid
    shiftCode: string;
    shiftName: string;
    shiftType: string;
    startTime: string; // TimeSpan e.g. "09:00:00"
    endTime: string;   // TimeSpan e.g. "18:00:00"
    isCrossDay: boolean;
    isGeneralDuty: boolean;
    isDefault: boolean;
    isActive: boolean;
}

export interface CreateShiftDto {
    companyId: string; // Guid
    shiftCode: string;
    shiftName: string;
    shiftType: string;
    startTime: string; // TimeSpan e.g. "09:00:00"
    endTime: string;   // TimeSpan e.g. "18:00:00"
    isCrossDay: boolean;
    isGeneralDuty: boolean;
    isDefault: boolean;
}

export interface UpdateShiftDto extends CreateShiftDto {
    id: string;
}

export const shiftService = {
    getShifts: async (params?: { companyId?: string }) => {
        // Backend expects companyId as Guid in GetShiftsByCompanyQuery
        // For now, if no companyId, we might need a workaround or handle it appropriately
        const url = params?.companyId ? `Shifts?companyId=${params.companyId}` : 'Shifts';
        const response = await api.get<{ data: Shift[] }>(url);
        // Assuming ApiResponse<T> format is { data: T, isSuccess: bool, ... }
        // API response format check
        return response.data?.data || response.data;
    },

    getShift: async (id: string) => {
        const response = await api.get<{ data: Shift }>(`Shifts/${id}`);
        return response.data?.data || response.data;
    },

    createShift: async (shift: CreateShiftDto) => {
        const response = await api.post<{ data: string }>('Shifts', shift);
        return response.data?.data || response.data;
    },

    updateShift: async (id: string, shift: UpdateShiftDto) => {
        const response = await api.put<{ data: boolean }>(`Shifts/${id}`, shift);
        return response.data?.data || response.data;
    },

    activateShift: async (id: string) => {
        const response = await api.patch<{ data: boolean }>(`Shifts/${id}/activate`);
        return response.data?.data || response.data;
    },

    deactivateShift: async (id: string) => {
        const response = await api.patch<{ data: boolean }>(`Shifts/${id}/deactivate`);
        return response.data?.data || response.data;
    },

    // Deleting a shift doesn't exist natively on ShiftsController in the backend API provided.
    // We will deactivate instead or just throw if delete is called.
    deleteShift: async (id: string) => {
        console.warn("Delete is not implemented on ShiftService, deactivating instead");
        return await shiftService.deactivateShift(id);
    }
};
