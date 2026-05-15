import api from "../api";
import { platformApiUrl, unwrapResponse } from "./api-helpers";
import { toast } from "sonner";

export interface LeaveType {
    id: number;
    name: string;
    code: string;
    yearlyLimit: number;
    isCarryForward: boolean;
    description?: string;
}

export interface LeaveApplication {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    leaveTypeId: number;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
    appliedDate: string;
    remarks?: string;
    attachmentUrl?: string;
}

export interface LeaveBalance {
    leaveTypeId: number;
    leaveTypeName: string;
    totalAllocated: number;
    totalTaken: number;
    balance: number;
}

export interface BackendLeaveType {
    id: string;
    companyId: string;
    leaveCode: string;
    leaveName: string;
    isPaid: boolean;
    isCarryForward: boolean;
    maxCarryForwardDays: number;
    isEncashable: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface BackendLeavePolicy {
    id: string;
    companyId: string;
    leaveTypeId: string;
    leaveCode?: string | null;
    yearlyEntitlement: number;
    monthlyAccrual: number;
    minServiceMonths: number;
    maxConsecutiveDays?: number | null;
    requiresApproval: boolean;
    allowHalfDay: boolean;
    allowNegativeBalance: boolean;
    excludeHolidaysFromLeaveDays: boolean;
    excludeWeeklyOffFromLeaveDays: boolean;
    approvalLevelCount: number;
    isActive: boolean;
}

export interface BackendLeaveApplication {
    id: string;
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    leaveCode?: string | null;
    fromDate: string;
    toDate: string;
    totalDays: number;
    isHalfDay: boolean;
    halfDayType?: string | null;
    reason?: string | null;
    status: string;
    appliedBy: string;
    appliedAt: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    cancelledAt?: string | null;
    steps: LeaveApprovalStep[];
}

export interface LeaveApprovalStep {
    id: string;
    approvalLevel: number;
    approverUserId?: string | null;
    approverEmployeeId?: string | null;
    status: string;
    remarks?: string | null;
    actionAt?: string | null;
}

export interface BackendLeaveBalance {
    id: string;
    leaveTypeId: string;
    leaveCode?: string | null;
    leaveName?: string | null;
    yearNo: number;
    openingBalance: number;
    entitledDays: number;
    accruedDays: number;
    usedDays: number;
    pendingDays: number;
    encashDays: number;
    carryForwardDays: number;
    balanceDays: number;
}

export interface Holiday {
    id: string;
    companyId: string;
    holidayDate: string;
    holidayName: string;
    holidayType: string;
    isPaid: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface WeeklyOff {
    id: string;
    companyId: string;
    dayOfWeekName: string;
    isActive: boolean;
}

export interface LeaveEncashment {
    id: string;
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    yearNo: number;
    encashDays: number;
    ratePerDay: number;
    totalAmount: number;
    status: string;
    requestedBy?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    createdAt: string;
}

export interface DayTypeResponse {
    dayType: number | string;
    leaveTypeId?: string | null;
    leaveCode?: string | null;
    isPaidLeave: boolean;
}

export const leaveService = {
    createLeaveType: async (data: {
        companyId: string;
        leaveCode: string;
        leaveName: string;
        isPaid: boolean;
        isCarryForward: boolean;
        maxCarryForwardDays: number;
        isEncashable: boolean;
    }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leave-types"), data);
        return unwrapResponse<BackendLeaveType>(response);
    },
    listLeaveTypes: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/leave-types"), { params: { companyId } });
        return unwrapResponse<BackendLeaveType[]>(response);
    },
    getLeaveTypeById: async (id: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/leave-types/${encodeURIComponent(id)}`));
        return unwrapResponse<BackendLeaveType>(response);
    },
    updateLeaveType: async (id: string, data: {
        leaveName: string;
        isPaid: boolean;
        isCarryForward: boolean;
        maxCarryForwardDays: number;
        isEncashable: boolean;
    }) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/leave-types/${encodeURIComponent(id)}`), data);
        return unwrapResponse<BackendLeaveType>(response);
    },
    activateLeaveType: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leave-types/${encodeURIComponent(id)}/activate`));
        return unwrapResponse<BackendLeaveType>(response);
    },
    deactivateLeaveType: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leave-types/${encodeURIComponent(id)}/deactivate`));
        return unwrapResponse<BackendLeaveType>(response);
    },

    createLeavePolicy: async (data: Omit<BackendLeavePolicy, "id" | "leaveCode" | "isActive">) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leave-policies"), data);
        return unwrapResponse<BackendLeavePolicy>(response);
    },
    listLeavePolicies: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/leave-policies"), { params: { companyId } });
        return unwrapResponse<BackendLeavePolicy[]>(response);
    },
    updateLeavePolicy: async (id: string, data: Omit<BackendLeavePolicy, "id" | "companyId" | "leaveTypeId" | "leaveCode">) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/leave-policies/${encodeURIComponent(id)}`), data);
        return unwrapResponse<BackendLeavePolicy>(response);
    },

    generateYearlyBalances: async (data: { companyId: string; yearNo: number; triggeredBy?: string | null }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leave-balances/generate-yearly"), data);
        return unwrapResponse<number>(response);
    },
    accrueMonthlyBalances: async (data: { companyId: string; yearNo: number; month: number; triggeredBy?: string | null }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leave-balances/accrue-monthly"), data);
        return unwrapResponse<number>(response);
    },
    getEmployeeBalances: async (employeeId: string, params: { companyId: string; year: number }) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/leave-balances/${encodeURIComponent(employeeId)}`), { params });
        return unwrapResponse<BackendLeaveBalance[]>(response);
    },
    adjustLeaveBalance: async (data: {
        companyId: string;
        employeeId: string;
        leaveTypeId: string;
        yearNo: number;
        adjustmentDays: number;
        remarks: string;
    }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leave-balances/adjust"), data);
        return unwrapResponse<BackendLeaveBalance>(response);
    },

    applyLeaveApplication: async (data: {
        companyId: string;
        employeeId: string;
        leaveTypeId: string;
        fromDate: string;
        toDate: string;
        isHalfDay: boolean;
        halfDayType?: string | null;
        reason?: string | null;
        attachmentUrl?: string | null;
        appliedBy: string;
        approvalSteps?: { approvalLevel: number; approverUserId?: string | null; approverEmployeeId?: string | null }[] | null;
    }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leaves/apply"), data);
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    listLeaveApplications: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/leaves/applications"), { params: { companyId } });
        return unwrapResponse<BackendLeaveApplication[]>(response);
    },
    getLeaveApplicationById: async (id: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/leaves/applications/${encodeURIComponent(id)}`));
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    approveLeaveApplication: async (id: string, data: { approvedBy: string; approverUserId?: string | null }) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leaves/applications/${encodeURIComponent(id)}/approve`), {
            leaveApplicationId: id,
            ...data
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    rejectLeaveApplication: async (id: string, data: { rejectedBy: string; remarks: string; approverUserId?: string | null }) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leaves/applications/${encodeURIComponent(id)}/reject`), {
            leaveApplicationId: id,
            ...data
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    cancelLeaveApplication: async (id: string, cancelledBy: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leaves/applications/${encodeURIComponent(id)}/cancel`), {
            leaveApplicationId: id,
            cancelledBy
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },

    createHoliday: async (data: Omit<Holiday, "id" | "createdAt">) => {
        const response = await api.post<unknown>(platformApiUrl("/api/holidays"), data);
        return unwrapResponse<Holiday>(response);
    },
    listHolidays: async (params: { companyId: string; year: number }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/holidays"), { params });
        return unwrapResponse<Holiday[]>(response);
    },
    updateHoliday: async (id: string, data: Omit<Holiday, "id" | "createdAt">) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/holidays/${encodeURIComponent(id)}`), data);
        return unwrapResponse<Holiday>(response);
    },
    deleteHoliday: async (id: string) => {
        const response = await api.delete<unknown>(platformApiUrl(`/api/holidays/${encodeURIComponent(id)}`));
        return unwrapResponse<unknown>(response);
    },

    createWeeklyOff: async (data: { companyId: string; dayOfWeekName: string }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/weekly-offs"), data);
        return unwrapResponse<WeeklyOff>(response);
    },
    listWeeklyOffs: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/weekly-offs"), { params: { companyId } });
        return unwrapResponse<WeeklyOff[]>(response);
    },
    deleteWeeklyOff: async (id: string) => {
        const response = await api.delete<unknown>(platformApiUrl(`/api/weekly-offs/${encodeURIComponent(id)}`));
        return unwrapResponse<unknown>(response);
    },

    generateEarnLeave: async (data: { companyId: string; employeeId: string; leaveTypeId: string; yearNo: number; month: number }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/earn-leaves/generate"), data);
        return unwrapResponse<{ employeeId: string; yearNo: number; month: number; earnedDays: number; newAccruedTotal: number }>(response);
    },
    getEarnLeaveSummary: async (employeeId: string, params: { companyId: string; year: number }) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/earn-leaves/${encodeURIComponent(employeeId)}`), { params });
        return unwrapResponse<BackendLeaveBalance[]>(response);
    },

    createLeaveEncashment: async (data: {
        companyId: string;
        employeeId: string;
        leaveTypeId: string;
        yearNo: number;
        encashDays: number;
        ratePerDay: number;
        requestedBy?: string | null;
    }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/leave-encashments"), data);
        return unwrapResponse<LeaveEncashment>(response);
    },
    listLeaveEncashments: async (params: { companyId: string; year?: number }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/leave-encashments"), { params });
        return unwrapResponse<LeaveEncashment[]>(response);
    },
    approveLeaveEncashment: async (id: string, approvedBy: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leave-encashments/${encodeURIComponent(id)}/approve`), null, { params: { approvedBy } });
        return unwrapResponse<LeaveEncashment>(response);
    },
    rejectLeaveEncashment: async (id: string, rejectedBy: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leave-encashments/${encodeURIComponent(id)}/reject`), null, { params: { rejectedBy } });
        return unwrapResponse<LeaveEncashment>(response);
    },
    markLeaveEncashmentPaid: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/leave-encashments/${encodeURIComponent(id)}/paid`));
        return unwrapResponse<LeaveEncashment>(response);
    },

    getDayType: async (params: { companyId: string; employeeId: string; date: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/day-types"), { params });
        return unwrapResponse<DayTypeResponse>(response);
    },

    getLeaveTypes: async () => {
        const response = await api.get<LeaveType[]>("/Leave/types");
        return response.data;
    },
    getApplications: async (params: { employeeCard?: number; status?: string } = {}) => {
        const response = await api.get<LeaveApplication[]>("/Leave/applications", { params });
        return response.data;
    },
    getApplication: async (id: number) => {
        const response = await api.get<LeaveApplication>(`/Leave/applications/${id}`);
        return response.data;
    },
    applyLeave: async (data: any) => {
        const response = await api.post("/Leave/apply", data);
        return response.data;
    },
    updateLeave: async (id: number, data: any) => {
        const response = await api.put(`/Leave/${id}`, data);
        return response.data;
    },
    deleteLeave: async (id: number) => {
        const response = await api.delete(`/Leave/${id}`);
        return response.data;
    },
    actionLeave: async (data: { id: number; status: string; remarks?: string }) => {
        const response = await api.post("/Leave/action", data);
        return response.data;
    },
    getBalance: async (employeeCard: number) => {
        const response = await api.get<LeaveBalance[]>(`/Leave/balance/${employeeCard}`);
        return response.data;
    },
    getMonthlyReport: async (params: { year: number; month: number }) => {
        const response = await api.get<any[]>("/Leave/monthly-report", { params });
        return response.data;
    },
    exportExcel: async () => {
        const response = await api.get("/Leave/export/excel", {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Leave_Applications.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    downloadPdf: async (id: number) => {
        try {
            console.log(`Starting PDF download for ID: ${id}`);
            const response = await api.get(`/Leave/export/pdf/${id}`, {
                responseType: 'arraybuffer',
                headers: {
                    'Accept': 'application/pdf'
                }
            });

            console.log("PDF data received, processing blob...");
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Leave_Application_${id}.pdf`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error: any) {
            console.error("PDF Download Detailed Error:", error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Server Response Data:", error.response.data);
                toast.error(`Server error: ${error.response.status}. Check backend logs.`);
            } else if (error.request) {
                // The request was made but no response was received
                toast.error("Network error: Server is unreachable. Check if API is running on port 5011.");
            } else {
                toast.error(`Error: ${error.message}`);
            }
            throw error;
        }
    },
};
