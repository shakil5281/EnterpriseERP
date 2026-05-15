import api from '../api';

export interface Shift {
    id: number;
    nameEn: string;
    nameBn?: string;
    inTime: string;
    outTime: string;
    actualInTime?: string;
    actualOutTime?: string;
    lateInTime?: string;
    lunchTimeStart?: string;
    lunchHour: number;
    weekends?: string; // Comma separated
    companyId?: number;
    companyName?: string;
    status: string;
    hasSpecialBreak: boolean;
    specialBreakStart?: string;
    specialBreakEnd?: string;
    specialBreakDates?: string;
}

export interface CreateShiftDto {
    nameEn: string;
    nameBn?: string;
    inTime: string;
    outTime: string;
    actualInTime?: string;
    actualOutTime?: string;
    lateInTime?: string;
    lunchTimeStart?: string;
    lunchHour: number;
    weekends?: string;
    companyId?: number;
    companyName?: string;
    status: string;
    hasSpecialBreak: boolean;
    specialBreakStart?: string;
    specialBreakEnd?: string;
    specialBreakDates?: string;
}

export const shiftService = {
    getShifts: async (params?: { companyName?: string; companyId?: number }) => {
        const response = await api.get<Shift[]>('/shift', { params });
        return response.data;
    },

    getShift: async (id: number) => {
        const response = await api.get<Shift>(`/shift/${id}`);
        return response.data;
    },

    createShift: async (shift: CreateShiftDto) => {
        const response = await api.post<Shift>('/shift', shift);
        return response.data;
    },

    updateShift: async (id: number, shift: CreateShiftDto) => {
        const response = await api.put(`/shift/${id}`, shift);
        return response.data;
    },

    deleteShift: async (id: number) => {
        const response = await api.delete(`/shift/${id}`);
        return response.data;
    },
};
