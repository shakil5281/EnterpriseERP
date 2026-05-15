import api from '../api';
import { type CommonFilterParams } from './attendance';

export interface AbsenteeismRecord {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    status: string;
    consecutiveDays: number;
    remarks: string | null;
}

export interface AbsenteeismSummary {
    totalAbsent: number;
    absentWithoutLeave: number;
    onLeave: number;
    criticalCases: number;
}

export interface AbsenteeismResponse {
    summary: AbsenteeismSummary;
    records: AbsenteeismRecord[];
}

export const absenteeismService = {
    getAbsenteeismRecords: async (params: CommonFilterParams) => {
        const queryParams = {
            ...params,
            fromDate: params.startDate,
            toDate: params.endDate
        };
        const response = await api.get<AbsenteeismResponse>('/attendance/absenteeism-records', { params: queryParams });
        return response.data;
    },

    exportAbsenteeismExcel: async (params: CommonFilterParams) => {
        const queryParams = {
            ...params,
            fromDate: params.startDate,
            toDate: params.endDate
        };
        const response = await api.get('/attendance/absenteeism-records/export/excel', {
            params: queryParams,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AbsenteeismRecords_${params.startDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
    },

    exportAbsenteeismPdf: async (params: CommonFilterParams) => {
        const queryParams = {
            ...params,
            fromDate: params.startDate,
            toDate: params.endDate
        };
        const response = await api.get('/attendance/absenteeism-records/export/pdf', {
            params: queryParams,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AbsenteeismRecords_${params.startDate}.pdf`);
        document.body.appendChild(link);
        link.click();
    }
};
