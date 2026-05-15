import api from '../api';
import { type CommonFilterParams } from './attendance';

export interface DailyOTSheet {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    section: string;
    line: string;
    designation: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    regularHours: number;
    otHours: number;
    remarks: string | null;
}

export interface OTSheetResponse {
    records: DailyOTSheet[];
    totalOTHours: number;
    totalEmployees: number;
}

export interface DailyOTSummary {
    id: number;
    name: string;
    employeeCount: number;
    totalOTHours: number;
    averageOTPerEmployee: number;
    totalRegularHours: number;
}

export interface OTSummaryResponse {
    departmentSummaries: DailyOTSummary[];
    sectionSummaries: DailyOTSummary[];
    lineSummaries: DailyOTSummary[];
    grandTotalOTHours: number;
    totalEmployees: number;
    date: string;
}

export const overtimeService = {
    getDailyOTSheet: async (params: CommonFilterParams) => {
        const response = await api.get<OTSheetResponse>('/attendance/daily-ot-sheet', { params });
        return response.data;
    },

    getDailyOTSummary: async (params: CommonFilterParams) => {
        const response = await api.get<OTSummaryResponse>('/attendance/daily-ot-summary', { params });
        return response.data;
    },

    exportDailyOTSheetExcel: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-ot-sheet/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Daily_OT_Sheet_${params.date}.xlsx`);
        document.body.appendChild(link);
        link.click();
    },

    exportDailyOTSummaryExcel: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-ot-summary/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Daily_OT_Summary_${params.date}.xlsx`);
        document.body.appendChild(link);
        link.click();
    }
};
