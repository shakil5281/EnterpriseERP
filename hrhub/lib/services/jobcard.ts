import { attendanceApi, type AttendanceQuery } from "./attendance-api";
import api from '../api';

export interface JobCardRecord {
    date: string;
    day: string;
    status: string;
    inTime: string | null;
    outTime: string | null;
    lateMinutes: number;
    earlyMinutes: number;
    otHours: number;
    totalHours: number;
    shift: string | null;
    shiftId: number | null;
    isOffDay: boolean;
    remarks: string | null;
}

export interface JobCardSummary {
    presentDays: number;
    absentDays: number;
    weekendDays: number;
    holidayDays: number;
    totalOTHours: number;
    totalLateMinutes: number;
    totalEarlyMinutes: number;
}

export interface EmployeeJobCard {
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    section: string;
    joiningDate: string | null;
    grade: string | null;
    shift: string | null;
}

export interface JobCardResponse {
    employee: EmployeeJobCard;
    summary: JobCardSummary;
    attendanceRecords: JobCardRecord[];
    fromDate: string;
    toDate: string;
}

export interface JobCardParams {
    companyEntityId: string;
    employeeCard?: number;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    sectionId?: string;
    designationId?: string;
    searchTerm?: string;
}

const downloadBlobFile = (data: BlobPart, fileName: string, mimeType: string) => {
    if (typeof window === "undefined") return;

    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    }
};

export const jobCardService = {
    getJobCard: async (params: JobCardParams) => {
        const q: AttendanceQuery = {
            companyId: params.companyEntityId,
            fromDate: params.startDate ?? new Date().toISOString().slice(0, 10),
            toDate: params.endDate ?? params.startDate ?? new Date().toISOString().slice(0, 10),
            departmentId: params.departmentId,
            sectionId: params.sectionId,
            designationId: params.designationId,
            searchTerm: params.searchTerm,
        };
        return attendanceApi.getJobCard(q, {
            employeeCard: params.employeeCard,
            employeeId: params.employeeId,
        });
    },

    exportJobCardExcel: async (params: JobCardParams) => {
        const response = await api.get('/attendance/job-card/export/excel', {
            params,
            responseType: 'blob'
        });
        downloadBlobFile(
            response.data,
            `JobCard_${params.searchTerm || 'Group'}_${params.startDate}.xlsx`,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
    },

    exportJobCardPdf: async (params: JobCardParams) => {
        const response = await api.get('/attendance/job-card/export/pdf', {
            params,
            responseType: 'blob'
        });
        downloadBlobFile(
            response.data,
            `JobCard_${params.searchTerm || 'Group'}_${params.startDate}.pdf`,
            "application/pdf"
        );
    }
};
