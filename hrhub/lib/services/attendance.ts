import api from '../api';
import { platformApiUrl, unwrapResponse } from './api-helpers';

export interface AttendanceRecord {
    id: number;
    employeeCard: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    department: string;
    section: string;
    designation: string;
    shift: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    status: string;
    otHours: number;
}

export interface AttendanceSummary {
    totalHeadcount: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    leaveCount: number;
    attendanceRate: number;
}

export interface DepartmentDailySummary {
    id: number;
    departmentId: number;
    departmentName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
}

export interface SectionDailySummary {
    id: number;
    sectionId: number;
    sectionName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
}

export interface DesignationDailySummary {
    id: number;
    designationId: number;
    designationName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
}

export interface LineDailySummary {
    id: number;
    lineId: number;
    lineName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
}

export interface GroupDailySummary {
    id: number;
    groupId: number;
    groupName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
}

export interface DeptSectionDailySummary {
    id: string;
    departmentId: number;
    departmentName: string;
    sectionId: number;
    sectionName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
}

export interface DailySummaryResponse {
    overallSummary: AttendanceSummary;
    departmentSummaries: DepartmentDailySummary[];
    sectionSummaries: SectionDailySummary[];
    deptSectionSummaries: DeptSectionDailySummary[];
    designationSummaries: DesignationDailySummary[];
    lineSummaries: LineDailySummary[];
    groupSummaries: GroupDailySummary[];
}

export interface CommonFilterParams {
    date?: string;
    startDate?: string;
    endDate?: string;
    companyId?: number;
    companyName?: string;
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    groupId?: number;
    shiftId?: number;
    floorId?: number;
    gender?: string;
    religion?: string;
    status?: string;
    searchTerm?: string;
    employeeCard?: number;
}

export interface BackendDailyAttendance {
    id: string;
    employeeId: string;
    attendanceDate: string;
    inTime: string | null;
    outTime: string | null;
    shiftCode: string | null;
    lateMinutes: number;
    otMinutes: number;
    workingMinutes: number;
    status: string;
    remarks: string | null;
}

export interface BackendAttendanceSummary {
    employeeId: string;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalEarlyOut: number;
    totalOTMinutes: number;
    totalWorkingMinutes: number;
    totalHolidays: number;
    totalWeeklyOffs: number;
}

export interface PunchLogUploadItem {
    id?: string;
    employeeCode: string;
    punchTime: string;
    deviceSerial?: string | null;
}

export interface BackendAttendanceQuery {
    companyId: string;
    fromDate: string;
    toDate: string;
    employeeId?: string;
}

export const attendanceService = {
    processDaily: async (data: { companyId: string; date: string }) => {
        const response = await api.post<unknown>(platformApiUrl('/api/Attendance/process'), data);
        return unwrapResponse<boolean>(response);
    },

    getDailyAttendance: async (params: BackendAttendanceQuery) => {
        const response = await api.get<unknown>(platformApiUrl('/api/Attendance'), { params });
        return unwrapResponse<BackendDailyAttendance[]>(response);
    },

    adjustAttendance: async (data: {
        id: string;
        inTime?: string | null;
        outTime?: string | null;
        remarks?: string | null;
        adminId: string;
    }) => {
        const response = await api.patch<unknown>(platformApiUrl('/api/Attendance/adjust'), data);
        return unwrapResponse<boolean>(response);
    },

    approveAttendance: async (id: string, adminId: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/Attendance/${encodeURIComponent(id)}/approve`), null, {
            params: { adminId }
        });
        return unwrapResponse<boolean>(response);
    },

    getAttendanceSummaryRecords: async (params: BackendAttendanceQuery) => {
        const response = await api.get<unknown>(platformApiUrl('/api/Attendance/summary'), { params });
        return unwrapResponse<BackendAttendanceSummary[]>(response);
    },

    uploadPunchLogs: async (data: { companyId: string; logs: PunchLogUploadItem[] }) => {
        const response = await api.post<unknown>(platformApiUrl('/api/PunchLogs/upload'), {
            companyId: data.companyId,
            logs: data.logs.map((log) => ({
                id: log.id ?? '00000000-0000-0000-0000-000000000000',
                employeeCode: log.employeeCode,
                punchTime: log.punchTime,
                deviceSerial: log.deviceSerial ?? null
            }))
        });
        return unwrapResponse<number>(response);
    },

    getDailyReport: async (params: CommonFilterParams) => {
        const response = await api.get<AttendanceRecord[]>('/attendance/daily-report', { params });
        return response.data;
    },

    getSummary: async (params: CommonFilterParams) => {
        const response = await api.get<AttendanceSummary>('/attendance/summary', { params });
        return response.data;
    },

    getDailySummary: async (params: CommonFilterParams) => {
        const response = await api.get<DailySummaryResponse>('/attendance/daily-summary', { params });
        return response.data;
    },

    seedMock: async (date: string) => {
        const response = await api.post('/attendance/seed-mock', null, { params: { date } });
        return response.data;
    },

    processDailyData: async (data: {
        date?: string;
        startDate?: string;
        endDate?: string;
        companyId?: number;
        employeeCode?: string;
        employeeCodes?: string[];
        departmentId?: number;
        sectionId?: number;
        designationId?: number;
        lineId?: number;
        shiftId?: number;
        groupId?: number;
    }) => {
        const response = await api.post<{ message: string }>('/attendanceSync/process-daily', data);
        return response.data;
    },

    syncData: async (params: {
        dbPath?: string;
        startDate?: string;
        endDate?: string;
        companyId?: number;
    }) => {
        const response = await api.post<{ message: string; count: number }>('/attendanceSync/sync', params);
        return response.data;
    },

    exportDailyReportExcel: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-report/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DailyAttendanceReport_${params.date || 'Export'}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    exportDailyReportPdf: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-report/export/pdf', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DailyAttendanceReport_${params.date || 'Export'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    exportDailySummaryExcel: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-summary/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DailyAttendanceSummary_${params.date || 'Export'}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    exportDailySummaryPdf: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-summary/export/pdf', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DailyAttendanceSummary_${params.date || 'Export'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    bulkManualEntry: async (data: {
        employeeIds: string[];
        companyId?: number;
        date: string | Date;
        inTime?: string;
        outTime?: string;
        reason: string;
        status: string;
    }) => {
        const response = await api.post('/attendance/bulk-manual-entry', data);
        return response.data;
    },

    createManualEntry: async (data: {
        employeeId: string;
        companyId?: number;
        date: string | Date;
        inTime?: string;
        outTime?: string;
        reason: string;
        status: string;
    }) => {
        const response = await api.post('/attendance/bulk-manual-entry', {
            employeeIds: [data.employeeId],
            companyId: data.companyId,
            date: data.date,
            inTime: data.inTime,
            outTime: data.outTime,
            reason: data.reason,
            status: data.status
        });
        return response.data;
    },

    deleteAttendance: async (data: {
        employeeCards?: number[];
        companyId?: number;
        fromDate: string;
        toDate: string;
        departmentId?: number;
        sectionId?: number;
    }) => {
        const response = await api.post('/attendance/delete-attendance', data);
        return response.data;
    },

    getAttendanceLogs: async (params: {
        startDate?: string;
        endDate?: string;
        searchTerm?: string;
        companyId?: number;
    }) => {
        const response = await api.get<any[]>('/attendanceSync/logs', { params });
        return response.data;
    },

    getDailyOTSheet: async (params: CommonFilterParams) => {
        const response = await api.get<DailyOTSheetResponse>('/attendance/daily-ot-sheet', { params });
        return response.data;
    },

    getDailyOTSummary: async (params: CommonFilterParams) => {
        const response = await api.get<DailyOTSummaryResponse>('/attendance/daily-ot-summary', { params });
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
        link.setAttribute('download', `Daily_OT_Sheet_${params.date || 'Export'}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    exportDailyOTSummaryExcel: async (params: CommonFilterParams) => {
        const response = await api.get('/attendance/daily-ot-summary/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Daily_OT_Summary_${params.date || 'Export'}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};

export interface DailyOTSheetRecord {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    regularHours: number;
    otHours: number;
    remarks: string | null;
}

export interface DailyOTSheetResponse {
    records: DailyOTSheetRecord[];
    totalOTHours: number;
    totalEmployees: number;
}

export interface DailyOTSummaryRecord {
    id: number;
    department: string;
    employeeCount: number;
    totalOTHours: number;
    averageOTPerEmployee: number;
    totalRegularHours: number;
}

export interface DailyOTSummaryResponse {
    departmentSummaries: DailyOTSummaryRecord[];
    grandTotalOTHours: number;
    totalEmployees: number;
    date: string;
}
