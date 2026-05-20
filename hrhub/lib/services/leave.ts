import api from "../api";
import { platformApiUrl, unwrapResponse } from "./api-helpers";

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

export interface HolidayRequest {
  companyId: string;
  holidayDate: string;
  holidayName: string;
  holidayType: string;
  isPaid: boolean;
  isActive: boolean;
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
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leave-types"),
      data
    );
    return unwrapResponse<BackendLeaveType>(response);
  },
  listLeaveTypes: async (companyId: string) => {
    const response = await api.get<unknown>(
      platformApiUrl("/api/v1/leave-types"),
      { params: { companyId } }
    );
    return unwrapResponse<BackendLeaveType[]>(response);
  },
  getLeaveTypeById: async (id: string) => {
    const response = await api.get<unknown>(
      platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}`)
    );
    return unwrapResponse<BackendLeaveType>(response);
  },
  updateLeaveType: async (
    id: string,
    data: {
      leaveName: string;
      isPaid: boolean;
      isCarryForward: boolean;
      maxCarryForwardDays: number;
      isEncashable: boolean;
    }
  ) => {
    const response = await api.put<unknown>(
      platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}`),
      data
    );
    return unwrapResponse<BackendLeaveType>(response);
  },
  activateLeaveType: async (id: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}/activate`)
    );
    return unwrapResponse<BackendLeaveType>(response);
  },
  deactivateLeaveType: async (id: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leave-types/${encodeURIComponent(id)}/deactivate`)
    );
    return unwrapResponse<BackendLeaveType>(response);
  },

  createLeavePolicy: async (
    data: Omit<BackendLeavePolicy, "id" | "leaveCode" | "isActive">
  ) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leave-policies"),
      data
    );
    return unwrapResponse<BackendLeavePolicy>(response);
  },
  listLeavePolicies: async (companyId: string) => {
    const response = await api.get<unknown>(
      platformApiUrl("/api/v1/leave-policies"),
      { params: { companyId } }
    );
    return unwrapResponse<BackendLeavePolicy[]>(response);
  },
  updateLeavePolicy: async (
    id: string,
    data: Omit<BackendLeavePolicy, "id" | "companyId" | "leaveTypeId" | "leaveCode">
  ) => {
    const response = await api.put<unknown>(
      platformApiUrl(`/api/v1/leave-policies/${encodeURIComponent(id)}`),
      data
    );
    return unwrapResponse<BackendLeavePolicy>(response);
  },

  generateYearlyBalances: async (data: {
    companyId: string;
    yearNo: number;
    triggeredBy?: string | null;
  }) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leave-balances/generate-yearly"),
      data
    );
    return unwrapResponse<number>(response);
  },
  accrueMonthlyBalances: async (data: {
    companyId: string;
    yearNo: number;
    month: number;
    triggeredBy?: string | null;
  }) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leave-balances/accrue-monthly"),
      data
    );
    return unwrapResponse<number>(response);
  },
  getEmployeeBalances: async (
    employeeId: string,
    params: { companyId: string; year: number }
  ) => {
    const response = await api.get<unknown>(
      platformApiUrl(`/api/v1/leave-balances/${encodeURIComponent(employeeId)}`),
      { params }
    );
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
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leave-balances/adjust"),
      data
    );
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
    approvalSteps?: {
      approvalLevel: number;
      approverUserId?: string | null;
      approverEmployeeId?: string | null;
    }[] | null;
  }) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leaves/apply"),
      data
    );
    return unwrapResponse<BackendLeaveApplication>(response);
  },
  listLeaveApplications: async (companyId: string) => {
    const response = await api.get<unknown>(
      platformApiUrl("/api/v1/leaves/applications"),
      { params: { companyId } }
    );
    return unwrapResponse<BackendLeaveApplication[]>(response);
  },
  getLeaveApplicationById: async (id: string) => {
    const response = await api.get<unknown>(
      platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}`)
    );
    return unwrapResponse<BackendLeaveApplication>(response);
  },
  approveLeaveApplication: async (
    id: string,
    data: { approvedBy: string; approverUserId?: string | null }
  ) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}/approve`),
      { leaveApplicationId: id, ...data }
    );
    return unwrapResponse<BackendLeaveApplication>(response);
  },
  rejectLeaveApplication: async (
    id: string,
    data: { rejectedBy: string; remarks: string; approverUserId?: string | null }
  ) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}/reject`),
      { leaveApplicationId: id, ...data }
    );
    return unwrapResponse<BackendLeaveApplication>(response);
  },
  cancelLeaveApplication: async (id: string, cancelledBy: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leaves/applications/${encodeURIComponent(id)}/cancel`),
      { leaveApplicationId: id, cancelledBy }
    );
    return unwrapResponse<BackendLeaveApplication>(response);
  },

  createHoliday: async (data: HolidayRequest) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/holidays"),
      data
    );
    return unwrapResponse<Holiday>(response);
  },
  listHolidays: async (params: { companyId: string; year: number }) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/holidays"), {
      params,
    });
    return unwrapResponse<Holiday[]>(response);
  },
  updateHoliday: async (id: string, data: HolidayRequest) => {
    const response = await api.put<unknown>(
      platformApiUrl(`/api/v1/holidays/${encodeURIComponent(id)}`),
      data
    );
    return unwrapResponse<Holiday>(response);
  },
  deleteHoliday: async (id: string) => {
    const response = await api.delete<unknown>(
      platformApiUrl(`/api/v1/holidays/${encodeURIComponent(id)}`)
    );
    return unwrapResponse<unknown>(response);
  },

  createWeeklyOff: async (data: { companyId: string; dayOfWeekName: string }) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/weekly-offs"),
      data
    );
    return unwrapResponse<WeeklyOff>(response);
  },
  listWeeklyOffs: async (companyId: string) => {
    const response = await api.get<unknown>(
      platformApiUrl("/api/v1/weekly-offs"),
      { params: { companyId } }
    );
    return unwrapResponse<WeeklyOff[]>(response);
  },
  deleteWeeklyOff: async (id: string) => {
    const response = await api.delete<unknown>(
      platformApiUrl(`/api/v1/weekly-offs/${encodeURIComponent(id)}`)
    );
    return unwrapResponse<unknown>(response);
  },

  generateEarnLeave: async (data: {
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    yearNo: number;
    month: number;
  }) => {
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/earn-leaves/generate"),
      data
    );
    return unwrapResponse<{
      employeeId: string;
      yearNo: number;
      month: number;
      earnedDays: number;
      newAccruedTotal: number;
    }>(response);
  },
  getEarnLeaveSummary: async (
    employeeId: string,
    params: { companyId: string; year: number }
  ) => {
    const response = await api.get<unknown>(
      platformApiUrl(`/api/v1/earn-leaves/${encodeURIComponent(employeeId)}`),
      { params }
    );
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
    const response = await api.post<unknown>(
      platformApiUrl("/api/v1/leave-encashments"),
      data
    );
    return unwrapResponse<LeaveEncashment>(response);
  },
  listLeaveEncashments: async (params: { companyId: string; year?: number }) => {
    const response = await api.get<unknown>(
      platformApiUrl("/api/v1/leave-encashments"),
      { params }
    );
    return unwrapResponse<LeaveEncashment[]>(response);
  },
  approveLeaveEncashment: async (id: string, approvedBy: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leave-encashments/${encodeURIComponent(id)}/approve`),
      null,
      { params: { approvedBy } }
    );
    return unwrapResponse<LeaveEncashment>(response);
  },
  rejectLeaveEncashment: async (id: string, rejectedBy: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leave-encashments/${encodeURIComponent(id)}/reject`),
      null,
      { params: { rejectedBy } }
    );
    return unwrapResponse<LeaveEncashment>(response);
  },
  markLeaveEncashmentPaid: async (id: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/leave-encashments/${encodeURIComponent(id)}/paid`)
    );
    return unwrapResponse<LeaveEncashment>(response);
  },

  getDayType: async (params: {
    companyId: string;
    employeeId: string;
    date: string;
  }) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/day-types"), {
      params,
    });
    return unwrapResponse<DayTypeResponse>(response);
  },
};
