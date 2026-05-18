import api from "../api";
import { platformApiUrl, unwrapResponse } from "./api-helpers";
import { toast } from "sonner";
import { companyService } from "./company";
import { employeeService } from "./employee";

function stableIntFromGuid(guid: string): number {
    const hex = guid.replace(/-/g, "").slice(0, 8);
    const n = parseInt(hex, 16);
    return Number.isFinite(n) ? (n | 0) : 0;
}


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
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leave-types"), data);
        return unwrapResponse<BackendLeaveType>(response);
    },
    listLeaveTypes: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leave-types"), { params: { companyId } });
        return unwrapResponse<BackendLeaveType[]>(response);
    },
    getLeaveTypeById: async (id: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}`));
        return unwrapResponse<BackendLeaveType>(response);
    },
    updateLeaveType: async (id: string, data: {
        leaveName: string;
        isPaid: boolean;
        isCarryForward: boolean;
        maxCarryForwardDays: number;
        isEncashable: boolean;
    }) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}`), data);
        return unwrapResponse<BackendLeaveType>(response);
    },
    activateLeaveType: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}/activate`));
        return unwrapResponse<BackendLeaveType>(response);
    },
    deactivateLeaveType: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}/deactivate`));
        return unwrapResponse<BackendLeaveType>(response);
    },

    createLeavePolicy: async (data: Omit<BackendLeavePolicy, "id" | "leaveCode" | "isActive">) => {
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leave-policies"), data);
        return unwrapResponse<BackendLeavePolicy>(response);
    },
    listLeavePolicies: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leave-policies"), { params: { companyId } });
        return unwrapResponse<BackendLeavePolicy[]>(response);
    },
    updateLeavePolicy: async (id: string, data: Omit<BackendLeavePolicy, "id" | "companyId" | "leaveTypeId" | "leaveCode">) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/v1/leave-policies/${encodeURIComponent(id)}`), data);
        return unwrapResponse<BackendLeavePolicy>(response);
    },

    generateYearlyBalances: async (data: { companyId: string; yearNo: number; triggeredBy?: string | null }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leave-balances/generate-yearly"), data);
        return unwrapResponse<number>(response);
    },
    accrueMonthlyBalances: async (data: { companyId: string; yearNo: number; month: number; triggeredBy?: string | null }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leave-balances/accrue-monthly"), data);
        return unwrapResponse<number>(response);
    },
    getEmployeeBalances: async (employeeId: string, params: { companyId: string; year: number }) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/v1/leave-balances/${encodeURIComponent(employeeId)}`), { params });
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
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leave-balances/adjust"), data);
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
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leaves/apply"), data);
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    listLeaveApplications: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId } });
        return unwrapResponse<BackendLeaveApplication[]>(response);
    },
    getLeaveApplicationById: async (id: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}`));
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    approveLeaveApplication: async (id: string, data: { approvedBy: string; approverUserId?: string | null }) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}/approve`), {
            leaveApplicationId: id,
            ...data
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    rejectLeaveApplication: async (id: string, data: { rejectedBy: string; remarks: string; approverUserId?: string | null }) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}/reject`), {
            leaveApplicationId: id,
            ...data
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    cancelLeaveApplication: async (id: string, cancelledBy: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}/cancel`), {
            leaveApplicationId: id,
            cancelledBy
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },

    createHoliday: async (data: Omit<Holiday, "id" | "createdAt">) => {
        const response = await api.post<unknown>(platformApiUrl("/api/v1/holidays"), data);
        return unwrapResponse<Holiday>(response);
    },
    listHolidays: async (params: { companyId: string; year: number }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/holidays"), { params });
        return unwrapResponse<Holiday[]>(response);
    },
    updateHoliday: async (id: string, data: Omit<Holiday, "id" | "createdAt">) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/v1/holidays/${encodeURIComponent(id)}`), data);
        return unwrapResponse<Holiday>(response);
    },
    deleteHoliday: async (id: string) => {
        const response = await api.delete<unknown>(platformApiUrl(`/api/v1/holidays/${encodeURIComponent(id)}`));
        return unwrapResponse<unknown>(response);
    },

    createWeeklyOff: async (data: { companyId: string; dayOfWeekName: string }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/v1/weekly-offs"), data);
        return unwrapResponse<WeeklyOff>(response);
    },
    listWeeklyOffs: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/weekly-offs"), { params: { companyId } });
        return unwrapResponse<WeeklyOff[]>(response);
    },
    deleteWeeklyOff: async (id: string) => {
        const response = await api.delete<unknown>(platformApiUrl(`/api/v1/weekly-offs/${encodeURIComponent(id)}`));
        return unwrapResponse<unknown>(response);
    },

    generateEarnLeave: async (data: { companyId: string; employeeId: string; leaveTypeId: string; yearNo: number; month: number }) => {
        const response = await api.post<unknown>(platformApiUrl("/api/v1/earn-leaves/generate"), data);
        return unwrapResponse<{ employeeId: string; yearNo: number; month: number; earnedDays: number; newAccruedTotal: number }>(response);
    },
    getEarnLeaveSummary: async (employeeId: string, params: { companyId: string; year: number }) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/v1/earn-leaves/${encodeURIComponent(employeeId)}`), { params });
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
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leave-encashments"), data);
        return unwrapResponse<LeaveEncashment>(response);
    },
    listLeaveEncashments: async (params: { companyId: string; year?: number }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leave-encashments"), { params });
        return unwrapResponse<LeaveEncashment[]>(response);
    },
    approveLeaveEncashment: async (id: string, approvedBy: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leave-encashments/${encodeURIComponent(id)}/approve`), null, { params: { approvedBy } });
        return unwrapResponse<LeaveEncashment>(response);
    },
    rejectLeaveEncashment: async (id: string, rejectedBy: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leave-encashments/${encodeURIComponent(id)}/reject`), null, { params: { rejectedBy } });
        return unwrapResponse<LeaveEncashment>(response);
    },
    markLeaveEncashmentPaid: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leave-encashments/${encodeURIComponent(id)}/paid`));
        return unwrapResponse<LeaveEncashment>(response);
    },

    getDayType: async (params: { companyId: string; employeeId: string; date: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/v1/day-types"), { params });
        return unwrapResponse<DayTypeResponse>(response);
    },

    getLeaveTypes: async () => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) return [];
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leave-types"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveType[]>(response);
        
        const mapped = list.map(t => ({
            id: stableIntFromGuid(t.id),
            name: t.leaveName,
            code: t.leaveCode,
            yearlyLimit: 0,
            isCarryForward: t.isCarryForward,
            description: t.leaveName
        }));

        try {
            const policies = await leaveService.listLeavePolicies(companyGuid);
            mapped.forEach(t => {
                const policy = policies.find(p => p.leaveTypeId === list.find(l => stableIntFromGuid(l.id) === t.id)?.id);
                if (policy) {
                    t.yearlyLimit = policy.yearlyEntitlement;
                }
            });
        } catch (e) {
            console.error("Failed to load policies inside getLeaveTypes", e);
        }

        return mapped;
    },
    getApplications: async (params: { employeeCard?: number; status?: string } = {}) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) return [];
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(response);
        
        const employees = await employeeService.getEmployees({ companyId: stableIntFromGuid(companyGuid) });
        const leaveTypes = await api.get<unknown>(platformApiUrl("/api/v1/leave-types"), { params: { companyId: companyGuid } }).then(res => unwrapResponse<BackendLeaveType[]>(res));
        
        let result = list.map(app => {
            const emp = employees.find(e => e.entityId === app.employeeId);
            const lt = leaveTypes.find(t => t.id === app.leaveTypeId);
            return {
                id: stableIntFromGuid(app.id),
                employeeCard: emp ? emp.id : 0,
                employeeId: emp ? emp.employeeId : "UNKNOWN",
                employeeName: emp ? emp.fullNameEn : "Unknown Employee",
                department: emp ? emp.departmentName || "" : "",
                designation: emp ? emp.designationName || "" : "",
                leaveTypeId: stableIntFromGuid(app.leaveTypeId),
                leaveTypeName: lt ? lt.leaveName : app.leaveCode || "Leave",
                startDate: app.fromDate,
                endDate: app.toDate,
                totalDays: app.totalDays,
                reason: app.reason || "",
                status: app.status,
                appliedDate: app.appliedAt,
                remarks: app.steps?.[0]?.remarks || undefined
            };
        });

        if (params.employeeCard) {
            result = result.filter(r => r.employeeCard === params.employeeCard);
        }
        if (params.status && params.status !== "All") {
            result = result.filter(r => r.status.toLowerCase() === params.status?.toLowerCase());
        }

        return result;
    },
    getApplication: async (id: number) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const responseList = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(responseList);
        const match = list.find(app => stableIntFromGuid(app.id) === id);
        if (!match) throw new Error("Leave application not found");
        
        const response = await api.get<unknown>(platformApiUrl(`/api/v1/leaves/applications/${match.id}`));
        const app = unwrapResponse<BackendLeaveApplication>(response);
        
        const emp = await employeeService.getEmployee(app.employeeId, stableIntFromGuid(companyGuid));
        const leaveTypes = await api.get<unknown>(platformApiUrl("/api/v1/leave-types"), { params: { companyId: companyGuid } }).then(res => unwrapResponse<BackendLeaveType[]>(res));
        const lt = leaveTypes.find(t => t.id === app.leaveTypeId);
        
        return {
            id: stableIntFromGuid(app.id),
            employeeCard: emp ? emp.id : 0,
            employeeId: emp ? emp.employeeId : "UNKNOWN",
            employeeName: emp ? emp.fullNameEn : "Unknown Employee",
            department: emp ? emp.departmentName || "" : "",
            designation: emp ? emp.designationName || "" : "",
            leaveTypeId: stableIntFromGuid(app.leaveTypeId),
            leaveTypeName: lt ? lt.leaveName : app.leaveCode || "Leave",
            startDate: app.fromDate,
            endDate: app.toDate,
            totalDays: app.totalDays,
            reason: app.reason || "",
            status: app.status,
            appliedDate: app.appliedAt,
            remarks: app.steps?.[0]?.remarks || undefined
        };
    },
    applyLeave: async (data: any) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const emp = await employeeService.getEmployeeById(data.employeeCard);
        if (!emp || !emp.entityId) throw new Error("Employee not found");
        
        const leaveTypes = await api.get<unknown>(platformApiUrl("/api/v1/leave-types"), { params: { companyId: companyGuid } }).then(res => unwrapResponse<BackendLeaveType[]>(res));
        const lt = leaveTypes.find(t => stableIntFromGuid(t.id) === data.leaveTypeId);
        if (!lt) throw new Error("Leave type not found");
        
        const payload = {
            companyId: companyGuid,
            employeeId: emp.entityId,
            leaveTypeId: lt.id,
            fromDate: data.startDate.split('T')[0],
            toDate: data.endDate.split('T')[0],
            isHalfDay: false,
            halfDayType: null,
            reason: data.reason,
            attachmentUrl: null,
            appliedBy: emp.entityId,
            approvalSteps: null
        };
        
        const response = await api.post<unknown>(platformApiUrl("/api/v1/leaves/apply"), payload);
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    updateLeave: async (id: number, data: any) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const responseList = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(responseList);
        const match = list.find(app => stableIntFromGuid(app.id) === id);
        if (!match) throw new Error("Leave application not found");
        
        const emp = await employeeService.getEmployee(match.employeeId, stableIntFromGuid(companyGuid));
        await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${match.id}/cancel`), {
            leaveApplicationId: match.id,
            cancelledBy: emp.entityId
        });
        
        return leaveService.applyLeave(data);
    },
    deleteLeave: async (id: number) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const responseList = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(responseList);
        const match = list.find(app => stableIntFromGuid(app.id) === id);
        if (!match) throw new Error("Leave application not found");
        
        const emp = await employeeService.getEmployee(match.employeeId, stableIntFromGuid(companyGuid));
        const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${match.id}/cancel`), {
            leaveApplicationId: match.id,
            cancelledBy: emp.entityId
        });
        return unwrapResponse<BackendLeaveApplication>(response);
    },
    actionLeave: async (data: { id: number; status: string; remarks?: string }) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const responseList = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(responseList);
        const match = list.find(app => stableIntFromGuid(app.id) === data.id);
        if (!match) throw new Error("Leave application not found");
        
        const emp = await employeeService.getEmployee(match.employeeId, stableIntFromGuid(companyGuid));
        
        if (data.status === "Approved") {
            const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${match.id}/approve`), {
                leaveApplicationId: match.id,
                approvedBy: emp.entityId,
                approverUserId: null
            });
            return unwrapResponse<BackendLeaveApplication>(response);
        } else {
            const response = await api.patch<unknown>(platformApiUrl(`/api/v1/leaves/applications/${match.id}/reject`), {
                leaveApplicationId: match.id,
                rejectedBy: emp.entityId,
                remarks: data.remarks || "Rejected via UI",
                approverUserId: null
            });
            return unwrapResponse<BackendLeaveApplication>(response);
        }
    },
    getBalance: async (employeeCard: number) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) throw new Error("No company found");
        
        const emp = await employeeService.getEmployeeById(employeeCard);
        if (!emp || !emp.entityId) throw new Error("Employee not found");
        
        const response = await api.get<unknown>(platformApiUrl(`/api/v1/leave-balances/${encodeURIComponent(emp.entityId)}`), {
            params: {
                companyId: companyGuid,
                year: new Date().getFullYear()
            }
        });
        const list = unwrapResponse<BackendLeaveBalance[]>(response);
        return list.map(b => ({
            leaveTypeId: stableIntFromGuid(b.leaveTypeId),
            leaveTypeName: b.leaveName || b.leaveCode || "Leave",
            totalAllocated: b.entitledDays,
            totalTaken: b.usedDays,
            balance: b.balanceDays
        }));
    },
    getMonthlyReport: async (params: { year: number; month: number }) => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) return [];
        
        const responseList = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(responseList);
        const employees = await employeeService.getEmployees({ companyId: stableIntFromGuid(companyGuid) });
        const leaveTypes = await api.get<unknown>(platformApiUrl("/api/v1/leave-types"), { params: { companyId: companyGuid } }).then(res => unwrapResponse<BackendLeaveType[]>(res));
        
        const agg: Record<string, any> = {};
        
        for (const app of list) {
            if (app.status !== "Approved") continue;
            
            const start = new Date(app.fromDate);
            const startYear = start.getFullYear();
            const startMonth = start.getMonth() + 1;
            
            if (startYear !== params.year || startMonth !== params.month) continue;
            
            const emp = employees.find(e => e.entityId === app.employeeId);
            if (!emp) continue;
            
            if (!agg[app.employeeId]) {
                agg[app.employeeId] = {
                    employeeId: emp.employeeId,
                    employeeName: emp.fullNameEn,
                    department: emp.departmentName || "",
                    sickLeave: 0,
                    casualLeave: 0,
                    earnedLeave: 0,
                    paternityLeave: 0,
                    maternityLeave: 0,
                    lwp: 0,
                    otherLeave: 0,
                    totalDays: 0
                };
            }
            
            const item = agg[app.employeeId];
            const lt = leaveTypes.find(t => t.id === app.leaveTypeId);
            const code = lt ? lt.leaveCode.toUpperCase() : (app.leaveCode ? app.leaveCode.toUpperCase() : "");
            
            if (code === "SL" || code === "SICK") {
                item.sickLeave += app.totalDays;
            } else if (code === "CL" || code === "CASUAL") {
                item.casualLeave += app.totalDays;
            } else if (code === "EL" || code === "AL" || code === "EARNED" || code === "ANNUAL") {
                item.earnedLeave += app.totalDays;
            } else if (code === "PL" || code === "PATERNITY") {
                item.paternityLeave += app.totalDays;
            } else if (code === "ML" || code === "MATERNITY") {
                item.maternityLeave += app.totalDays;
            } else if (code === "LWP") {
                item.lwp += app.totalDays;
            } else {
                item.otherLeave += app.totalDays;
            }
            item.totalDays += app.totalDays;
        }
        
        return Object.values(agg);
    },
    exportExcel: async () => {
        const companies = await companyService.getAll();
        const companyGuid = companies[0]?.entityId;
        if (!companyGuid) return;
        
        const response = await api.get<unknown>(platformApiUrl("/api/v1/leaves/applications"), { params: { companyId: companyGuid } });
        const list = unwrapResponse<BackendLeaveApplication[]>(response);
        
        const headers = ["Application ID", "Employee ID", "Leave Type", "Start Date", "End Date", "Total Days", "Status", "Applied At"];
        const rows = list.map(app => [
            app.id,
            app.employeeId,
            app.leaveCode || "Leave",
            app.fromDate,
            app.toDate,
            app.totalDays,
            app.status,
            app.appliedAt
        ]);
        
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Leave_Applications.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    downloadPdf: async (id: number) => {
        window.location.href = `/management/leave/application/${id}/export`;
    },
};
