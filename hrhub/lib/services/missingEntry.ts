import api from '../api';

export interface MissingEntry {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    companyId?: number;
    department: string;
    designation: string;
    shift: string | null;
    date: string;
    inTime: string | null;
    outTime: string | null;
    missingType: string;
    status: string;
}

export interface MissingEntrySummary {
    totalMissing: number;
    missingInTime: number;
    missingOutTime: number;
    missingBoth: number;
    criticalCount: number;
}

export interface MissingEntryResponse {
    summary: MissingEntrySummary;
    entries: MissingEntry[];
}

export const missingEntryService = {
    getMissingEntries: async (params: {
        fromDate: string;
        toDate: string;
        departmentId?: number;
        designationId?: number;
        sectionId?: number;
        searchTerm?: string;
    }) => {
        const response = await api.get<MissingEntryResponse>('/attendance/missing-entries', { params });
        return response.data;
    }
};
