import api from "../api";
import { platformApiUrl, unwrapResponse, downloadBlob } from "./api-helpers";
import type {
  PayrollPolicyDto,
  PayrollPeriodDto,
  SalarySheetRowDto,
  PayrollSummaryDto,
  PayrollSummaryBreakdownDto,
  EmployeePayrollDto,
  PayslipDto,
  BankSheetRowDto,
  SalaryStructureDto,
  SalaryStructureComponentDto,
  EmployeeSalaryDto,
  SalaryAdvanceDto,
  SalaryAdvanceSummaryDto,
  SalaryIncrementDto,
  AllowanceBillDto,
  DeductionDto,
  FinalSettlementDto,
  DailySalarySheetRowDto,
  PayrollBonusRowDto,
  PayrollLockCheckDto,
  PayrollApprovalRequest,
  PayrollProcessRequest,
} from "./payroll-types";

export type {
  PayrollPolicyDto,
  PayrollPeriodDto,
  SalarySheetRowDto,
  PayrollSummaryDto,
  PayrollSummaryBreakdownDto,
  EmployeePayrollDto,
  PayslipDto,
  SalaryAdvanceDto,
  SalaryIncrementDto,
} from "./payroll-types";

export type { MonthlySalarySheet, DailySalarySheet, BankSheet } from "@/lib/payroll-utils";

export interface SalarySummary {
  totalGrossSalary: number;
  totalOTAmount: number;
  totalDeductions: number;
  totalNetPayable: number;
  totalEmployees: number;
  departmentSummaries: SummaryItem[];
  sectionSummaries: SummaryItem[];
  lineSummaries: SummaryItem[];
  groupSummaries: SummaryItem[];
}

export interface SummaryItem {
  name: string;
  totalGrossSalary: number;
  totalOTAmount: number;
  totalDeductions: number;
  totalNetPayable: number;
  employeeCount: number;
}

export interface Payslip {
  periodId: string;
  employeeGuid: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  year: number;
  month: number;
  grossSalary: number;
  basicSalary: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  otHours: number;
  otAmount: number;
  attendanceBonus: number;
  totalEarning: number;
  totalDeduction: number;
  netPayable: number;
  joinedDate: string;
  bankAccountNo: string;
  paymentMethod: string;
  monthName?: string;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
}

export interface AdvanceSalary {
  id: string;
  employeeId: string;
  companyId: string;
  employeeName?: string;
  amount: number;
  requestDate: string;
  repaymentMonth: number;
  repaymentYear: number;
  status: string;
  remarks?: string;
  advanceNo: string;
  balanceAmount: number;
  designation?: string;
  joiningDate?: string;
  grade?: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  foodAllowance: number;
  transportAllowance: number;
  grossSalary: number;
  presentDays: number;
  absentDays: number;
  absentDeduction: number;
  totalPayableWages: number;
  otHours: number;
  otRate: number;
  otAmount: number;
  bankAccountNo?: string;
  paymentMethod?: string;
  netPayable: number;
}

export interface AdvanceSalarySummary {
  totalCount: number;
  totalAmount: number;
  totalBalance: number;
  approvedCount: number;
  pendingCount: number;
  totalAdvanceDisbursed: number;
  totalPendingAmount: number;
  totalRepaid: number;
  totalEmployees: number;
  departmentSummaries?: SummaryItem[];
  sectionSummaries?: SummaryItem[];
  lineSummaries?: SummaryItem[];
  designationSummaries?: SummaryItem[];
}

export interface SalaryIncrement {
  id: string;
  employeeId: string;
  companyId: string;
  incrementAmount: number;
  effectiveDate: string;
  status: string;
  oldGrossSalary: number;
  newGrossSalary: number;
  employeeName?: string;
  previousGrossSalary: number;
  incrementType?: string;
}

export interface Bonus {
  id: string;
  employeeId: string;
  employeeName?: string;
  bonusType: string;
  amount: number;
  year: number;
  month: number;
  status: string;
  joiningDate?: string;
  grossSalary?: number;
  jobAge?: string;
  companyName?: string;
}

export interface FestivalBonusSummary {
  processedCount: number;
  skippedCount: number;
  totalAmount: number;
  message: string;
}

function mapSummaryItem(s: {
  name: string;
  totalGrossSalary: number;
  totalOTAmount: number;
  totalDeductions: number;
  totalNetPayable: number;
  employeeCount: number;
}): SummaryItem {
  return {
    name: s.name,
    totalGrossSalary: s.totalGrossSalary,
    totalOTAmount: s.totalOTAmount,
    totalDeductions: s.totalDeductions,
    totalNetPayable: s.totalNetPayable,
    employeeCount: s.employeeCount,
  };
}

async function downloadExport(path: string, params: Record<string, unknown>, fileName: string) {
  const response = await api.get(platformApiUrl(path), { params, responseType: "blob" });
  downloadBlob(response.data, fileName, "text/csv");
}

export const payrollService = {
  // Policies
  createPayrollPolicy: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/payroll-policies"), data).then((r) => unwrapResponse<PayrollPolicyDto>(r)),
  getPayrollPolicies: (companyId?: string) =>
    api.get(platformApiUrl("/api/v1/payroll-policies"), { params: { companyId } }).then((r) => unwrapResponse<PayrollPolicyDto[]>(r)),
  getPayrollPolicyById: (id: string) =>
    api.get(platformApiUrl(`/api/v1/payroll-policies/${encodeURIComponent(id)}`)).then((r) => unwrapResponse<PayrollPolicyDto>(r)),
  updatePayrollPolicy: (id: string, data: Record<string, unknown>) =>
    api.put(platformApiUrl(`/api/v1/payroll-policies/${encodeURIComponent(id)}`), data).then((r) => unwrapResponse<PayrollPolicyDto>(r)),
  activatePayrollPolicy: (id: string) =>
    api.patch(platformApiUrl(`/api/v1/payroll-policies/${encodeURIComponent(id)}/activate`)).then((r) => unwrapResponse<PayrollPolicyDto>(r)),
  deactivatePayrollPolicy: (id: string) =>
    api.patch(platformApiUrl(`/api/v1/payroll-policies/${encodeURIComponent(id)}/deactivate`)).then((r) => unwrapResponse<PayrollPolicyDto>(r)),

  // Structures
  createSalaryStructure: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/salary-structures"), data).then((r) => unwrapResponse<SalaryStructureDto>(r)),
  getSalaryStructures: (companyId: string) =>
    api.get(platformApiUrl("/api/v1/salary-structures"), { params: { companyId } }).then((r) => unwrapResponse<SalaryStructureDto[]>(r)),
  addSalaryStructureComponent: (id: string, data: Record<string, unknown>) =>
    api.post(platformApiUrl(`/api/v1/salary-structures/${encodeURIComponent(id)}/components`), data).then((r) => unwrapResponse<SalaryStructureComponentDto>(r)),
  getSalaryStructureComponents: (id: string) =>
    api.get(platformApiUrl(`/api/v1/salary-structures/${encodeURIComponent(id)}/components`)).then((r) => unwrapResponse<SalaryStructureComponentDto[]>(r)),

  // Employee salaries
  assignEmployeeSalary: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/employee-salaries"), data).then((r) => unwrapResponse<EmployeeSalaryDto>(r)),
  getCurrentEmployeeSalary: (employeeId: string, companyId: string) =>
    api.get(platformApiUrl(`/api/v1/employee-salaries/${encodeURIComponent(employeeId)}/current`), { params: { companyId } }).then((r) => unwrapResponse<EmployeeSalaryDto>(r)),
  getEmployeeSalaryHistory: (employeeId: string, companyId: string) =>
    api.get(platformApiUrl(`/api/v1/employee-salaries/${encodeURIComponent(employeeId)}/history`), { params: { companyId } }).then((r) => unwrapResponse<EmployeeSalaryDto[]>(r)),

  // Periods
  createPayrollPeriod: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/payroll-periods"), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),
  getPayrollPeriods: (companyId?: string) =>
    api.get(platformApiUrl("/api/v1/payroll-periods"), { params: { companyId } }).then((r) => unwrapResponse<PayrollPeriodDto[]>(r)),
  closePayrollPeriod: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/payroll-periods/${encodeURIComponent(id)}/close`), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),
  lockPayrollPeriod: (id: string, data: { lockedBy: string; remarks?: string | null }) =>
    api.patch(platformApiUrl(`/api/v1/payroll-periods/${encodeURIComponent(id)}/lock`), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),
  unlockPayrollPeriod: (id: string, data: { unlockedBy: string; unlockReason: string }) =>
    api.patch(platformApiUrl(`/api/v1/payroll-periods/${encodeURIComponent(id)}/unlock`), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),

  // Process
  processPayroll: (data: PayrollProcessRequest) =>
    api.post(platformApiUrl("/api/v1/payroll/process"), data).then((r) => unwrapResponse<PayrollSummaryDto>(r)),
  reprocessPayroll: (data: PayrollProcessRequest) =>
    api.post(platformApiUrl("/api/v1/payroll/reprocess"), data).then((r) => unwrapResponse<PayrollSummaryDto>(r)),
  getPayrollByPeriod: (periodId: string, params?: Record<string, unknown>) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}`), { params }).then((r) => unwrapResponse<EmployeePayrollDto[]>(r)),
  getEmployeePayroll: (periodId: string, employeeId: string) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/employees/${encodeURIComponent(employeeId)}`)).then((r) => unwrapResponse<EmployeePayrollDto>(r)),
  getSalarySheetByPeriod: (periodId: string, params?: Record<string, unknown>) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/salary-sheet`), { params }).then((r) => unwrapResponse<SalarySheetRowDto[]>(r)),
  getBankSheetByPeriod: (periodId: string) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/bank-sheet`)).then((r) => unwrapResponse<BankSheetRowDto[]>(r)),
  getPayslipsByPeriod: (periodId: string) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/payslips`)).then((r) => unwrapResponse<EmployeePayrollDto[]>(r)),
  getPayslipByPeriod: (periodId: string, employeeId: string) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/payslips/${encodeURIComponent(employeeId)}`)).then((r) => unwrapResponse<PayslipDto>(r)),
  getPayrollSummary: (periodId: string) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/summary`)).then((r) => unwrapResponse<PayrollSummaryDto>(r)),
  getPayrollSummaryBreakdown: (periodId: string) =>
    api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/summary/breakdown`)).then((r) => unwrapResponse<PayrollSummaryBreakdownDto>(r)),
  submitPayroll: (periodId: string, data: PayrollApprovalRequest) =>
    api.post(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/submit`), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),
  approvePayroll: (periodId: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/approve`), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),
  rejectPayroll: (periodId: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(periodId)}/reject`), data).then((r) => unwrapResponse<PayrollPeriodDto>(r)),
  checkPayrollLock: (params: { companyId: string; year: number; month: number }) =>
    api.get(platformApiUrl("/api/v1/payroll-locks/check"), { params }).then((r) => unwrapResponse<PayrollLockCheckDto>(r)),

  // Advances
  createSalaryAdvance: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/salary-advances"), data).then((r) => unwrapResponse<SalaryAdvanceDto>(r)),
  listSalaryAdvances: (params: { companyId: string; status?: string; year?: number; month?: number }) =>
    api.get(platformApiUrl("/api/v1/salary-advances/list"), { params }).then((r) => unwrapResponse<SalaryAdvanceDto[]>(r)),
  getSalaryAdvanceSummary: (params: { companyId: string; year?: number; month?: number }) =>
    api.get(platformApiUrl("/api/v1/salary-advances/summary"), { params }).then((r) => unwrapResponse<SalaryAdvanceSummaryDto>(r)),
  batchCreateSalaryAdvance: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/salary-advances/batch"), data).then((r) => unwrapResponse<SalaryAdvanceDto[]>(r)),
  batchDeleteSalaryAdvance: (ids: string[]) =>
    api.post(platformApiUrl("/api/v1/salary-advances/batch-delete"), { ids }).then((r) => unwrapResponse<number>(r)),
  approveSalaryAdvance: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/salary-advances/${encodeURIComponent(id)}/approve`), data).then((r) => unwrapResponse<SalaryAdvanceDto>(r)),
  rejectSalaryAdvance: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/salary-advances/${encodeURIComponent(id)}/reject`), data).then((r) => unwrapResponse<SalaryAdvanceDto>(r)),
  getSalaryAdvanceBalance: (employeeId: string, companyId: string) =>
    api.get(platformApiUrl(`/api/v1/salary-advances/${encodeURIComponent(employeeId)}/balance`), { params: { companyId } }).then((r) => unwrapResponse<{ employeeId: string; approvedBalance: number; runningBalance: number; totalBalance: number }>(r)),

  // Increments
  createSalaryIncrement: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/salary-increments"), data).then((r) => unwrapResponse<SalaryIncrementDto>(r)),
  getSalaryIncrements: (params: { companyId: string; employeeId?: string }) =>
    api.get(platformApiUrl("/api/v1/salary-increments"), { params }).then((r) => unwrapResponse<SalaryIncrementDto[]>(r)),
  approveSalaryIncrement: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/salary-increments/${encodeURIComponent(id)}/approve`), data).then((r) => unwrapResponse<SalaryIncrementDto>(r)),
  rejectSalaryIncrement: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/salary-increments/${encodeURIComponent(id)}/reject`), data).then((r) => unwrapResponse<SalaryIncrementDto>(r)),

  // Allowances & deductions
  createAllowanceBill: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/allowance-bills"), data).then((r) => unwrapResponse<AllowanceBillDto>(r)),
  getAllowanceBills: (params: { companyId: string; employeeId?: string; fromDate?: string; toDate?: string }) =>
    api.get(platformApiUrl("/api/v1/allowance-bills"), { params }).then((r) => unwrapResponse<AllowanceBillDto[]>(r)),
  approveAllowanceBill: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/allowance-bills/${encodeURIComponent(id)}/approve`), data).then((r) => unwrapResponse<AllowanceBillDto>(r)),
  rejectAllowanceBill: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/allowance-bills/${encodeURIComponent(id)}/reject`), data).then((r) => unwrapResponse<AllowanceBillDto>(r)),
  createDeduction: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/deductions"), data).then((r) => unwrapResponse<DeductionDto>(r)),
  getDeductions: (params: { companyId: string; employeeId?: string }) =>
    api.get(platformApiUrl("/api/v1/deductions"), { params }).then((r) => unwrapResponse<DeductionDto[]>(r)),

  // Final settlement
  createFinalSettlement: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/final-settlements"), data).then((r) => unwrapResponse<FinalSettlementDto>(r)),
  getFinalSettlements: (params: { companyId: string; employeeId?: string }) =>
    api.get(platformApiUrl("/api/v1/final-settlements"), { params }).then((r) => unwrapResponse<FinalSettlementDto[]>(r)),
  approveFinalSettlement: (id: string, data: PayrollApprovalRequest) =>
    api.patch(platformApiUrl(`/api/v1/final-settlements/${encodeURIComponent(id)}/approve`), data).then((r) => unwrapResponse<FinalSettlementDto>(r)),

  // Daily sheet
  getDailySheetApi: (params: { companyId: string; date: string; departmentId?: number; searchTerm?: string }) =>
    api.get(platformApiUrl("/api/v1/payroll/daily-sheet"), { params }).then((r) => unwrapResponse<DailySalarySheetRowDto[]>(r)),

  getDailySheet: async (params: {
    date: string;
    companyId?: number;
    companyGuid?: string;
    departmentId?: number;
    searchTerm?: string;
  }) => {
    const { mapDailyRow, companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params.companyGuid;
    if (!guid && params.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) return [];
    const response = await api.get(platformApiUrl("/api/v1/payroll/daily-sheet"), {
      params: {
        companyId: guid,
        date: params.date.slice(0, 10),
        departmentId: params.departmentId,
        searchTerm: params.searchTerm,
      },
    });
    const rows = unwrapResponse<DailySalarySheetRowDto[]>(response);
    return rows.map(mapDailyRow);
  },

  processDailySheet: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/payroll/daily-sheet/process"), data).then((r) => unwrapResponse<{ processedCount: number; skippedCount: number; message: string }>(r)),

  // Bonuses
  getPayrollBonuses: (params: { companyId: string; year: number; month?: number; bonusType?: string }) =>
    api.get(platformApiUrl("/api/v1/payroll/bonuses"), { params }).then((r) => unwrapResponse<PayrollBonusRowDto[]>(r)),

  getBonuses: async (params: { year: number; month?: number; companyId?: number; companyGuid?: string }) => {
    const { companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params.companyGuid;
    if (!guid && params.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) return [];
    const response = await api.get(platformApiUrl("/api/v1/payroll/bonuses"), {
      params: { companyId: guid, year: params.year, month: params.month },
    });
    const rows = unwrapResponse<PayrollBonusRowDto[]>(response);
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName ?? undefined,
      bonusType: r.bonusType,
      amount: r.amount,
      year: r.yearNo,
      month: r.monthNo,
      status: r.status,
    }));
  },
  createBonus: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/payroll/bonuses"), data).then((r) => unwrapResponse<PayrollBonusRowDto>(r)),
  processFestivalBonus: (data: Record<string, unknown>) =>
    api.post(platformApiUrl("/api/v1/payroll/bonuses/process-festival"), data).then((r) => unwrapResponse<FestivalBonusSummary>(r)),
  deleteBonus: (employeePayrollId: string) =>
    api.delete(platformApiUrl(`/api/v1/payroll/bonuses/${encodeURIComponent(employeePayrollId)}`)).then((r) => unwrapResponse<boolean>(r)),
  getFestivalBonusBankSheet: (periodId: string) =>
    api.get(platformApiUrl("/api/v1/payroll/bonuses/bank-sheet"), { params: { periodId } }).then((r) => unwrapResponse<{ employeeId: string; employeeName?: string; bankAccountNo?: string; bankName?: string; netPayable: number }[]>(r)),

  // Legacy-compatible helpers for existing pages
  getMonthlySheet: async (params: {
    year: number;
    month: number;
    companyId?: number;
    companyGuid?: string;
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    searchTerm?: string;
    status?: string;
  }) => {
    const { findOrCreatePayrollPeriod, mapSalarySheetRow, companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params.companyGuid;
    if (!guid && params.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) return [];
    const period = await findOrCreatePayrollPeriod(guid, params.year, params.month);
    const response = await api.get(platformApiUrl(`/api/v1/payroll/${encodeURIComponent(period.id)}/salary-sheet`), {
      params: {
        departmentId: params.departmentId,
        sectionId: params.sectionId,
        designationId: params.designationId,
        lineId: params.lineId,
        searchTerm: params.searchTerm,
        status: params.status,
      },
    });
    const rows = unwrapResponse<SalarySheetRowDto[]>(response);
    return rows.map((r) => mapSalarySheetRow(r, period.id, params.year, params.month));
  },

  processSalary: async (data: {
    year: number;
    month: number;
    companyId?: number;
    companyGuid?: string;
    processedBy?: string;
    departmentId?: number;
  }): Promise<PayrollSummaryDto & { message?: string }> => {
    const { findOrCreatePayrollPeriod, companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = data.companyGuid;
    if (!guid && data.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(data.companyId));
    }
    if (!guid) throw new Error("Company is required");
    await findOrCreatePayrollPeriod(guid, data.year, data.month);
    const result = await payrollService.processPayroll({
      companyId: guid,
      yearNo: data.year,
      monthNo: data.month,
      processedBy: data.processedBy ?? null,
    });
    return { ...result, message: "Payroll processed successfully." };
  },

  getSummary: async (year: number, month: number, companyId?: number, companyGuid?: string): Promise<SalarySummary> => {
    const { findOrCreatePayrollPeriod, companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = companyGuid;
    if (!guid && companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(companyId));
    }
    if (!guid) {
      return { totalGrossSalary: 0, totalOTAmount: 0, totalDeductions: 0, totalNetPayable: 0, totalEmployees: 0, departmentSummaries: [], sectionSummaries: [], lineSummaries: [], groupSummaries: [] };
    }
    const period = await findOrCreatePayrollPeriod(guid, year, month);
    const breakdown = await payrollService.getPayrollSummaryBreakdown(period.id);
    return {
      totalGrossSalary: breakdown.summary.grossSalary,
      totalOTAmount: breakdown.departmentSummaries.reduce((s, x) => s + x.totalOTAmount, 0),
      totalDeductions: breakdown.summary.totalDeduction,
      totalNetPayable: breakdown.summary.netSalary,
      totalEmployees: breakdown.summary.totalEmployees,
      departmentSummaries: breakdown.departmentSummaries.map(mapSummaryItem),
      sectionSummaries: breakdown.sectionSummaries.map(mapSummaryItem),
      lineSummaries: breakdown.lineSummaries.map(mapSummaryItem),
      groupSummaries: breakdown.groupSummaries.map(mapSummaryItem),
    };
  },

  getPayslip: async (periodId: string, employeeId: string): Promise<Payslip> => {
    const dto = await payrollService.getPayslipByPeriod(periodId, employeeId);
    const p = dto.payroll;
    return {
      periodId,
      employeeGuid: p.employeeId,
      employeeId: p.employeeId,
      employeeName: "",
      department: "",
      designation: "",
      year: 0,
      month: 0,
      grossSalary: p.grossSalary,
      basicSalary: p.basicSalary,
      totalDays: p.totalDays,
      presentDays: p.presentDays,
      absentDays: p.absentDays,
      leaveDays: p.leaveDays,
      otHours: p.overtimeHours,
      otAmount: p.overtimeAmount,
      attendanceBonus: p.attendanceBonusAmount,
      totalEarning: p.totalEarnings,
      totalDeduction: p.totalDeduction,
      netPayable: p.netSalary,
      joinedDate: "",
      bankAccountNo: "",
      paymentMethod: "Bank",
      earnings: p.earnings.map((e) => ({ name: e.earningName, amount: e.amount })),
      deductions: p.deductions.map((d) => ({ name: d.deductionName, amount: d.amount })),
    };
  },

  getAdvanceSalaries: async (params: { month?: number; year?: number; companyId?: number; companyGuid?: string }) => {
    const { companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params.companyGuid;
    if (!guid && params.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) return [];
    const rows = await payrollService.listSalaryAdvances({ companyId: guid, year: params.year, month: params.month });
    return rows.map(mapAdvance);
  },

  createAdvanceSalary: (data: Record<string, unknown>) => payrollService.createSalaryAdvance(data),

  batchAdvanceSalary: (data: {
    employeeIds: string[];
    companyId: number | string;
    companyGuid?: string;
    amount: number;
    requestDate: string;
    repaymentMonth: number;
    repaymentYear: number;
    remarks?: string;
    isDateRange?: boolean;
    fromDate?: string;
    toDate?: string;
  }) => {
    const companyId = data.companyGuid ?? String(data.companyId);
    return payrollService.batchCreateSalaryAdvance({
      companyId,
      employeeIds: data.employeeIds,
      advanceAmount: data.amount,
      advanceDate: data.requestDate.slice(0, 10),
      deductionStartMonth: data.repaymentMonth,
      deductionStartYear: data.repaymentYear,
      installmentAmount: data.amount,
    });
  },

  batchDeleteAdvanceSalary: (ids: string[]) => payrollService.batchDeleteSalaryAdvance(ids.map(String)),

  getAdvanceSalarySummary: async (params: { month?: number; year?: number; companyId?: number; companyGuid?: string }): Promise<AdvanceSalarySummary> => {
    const { companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params.companyGuid;
    if (!guid && params.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) {
      return {
        totalCount: 0,
        totalAmount: 0,
        totalBalance: 0,
        approvedCount: 0,
        pendingCount: 0,
        totalAdvanceDisbursed: 0,
        totalPendingAmount: 0,
        totalRepaid: 0,
        totalEmployees: 0,
        departmentSummaries: [],
        sectionSummaries: [],
        lineSummaries: [],
        designationSummaries: [],
      };
    }
    const s = await payrollService.getSalaryAdvanceSummary({ companyId: guid, year: params.year, month: params.month });
    return {
      totalCount: s.totalCount,
      totalAmount: s.totalAmount,
      totalBalance: s.totalBalance,
      approvedCount: s.approvedCount,
      pendingCount: s.pendingCount,
      totalAdvanceDisbursed: s.totalAmount ?? 0,
      totalPendingAmount: s.totalBalance ?? 0,
      totalRepaid: (s.totalAmount ?? 0) - (s.totalBalance ?? 0),
      totalEmployees: s.totalCount ?? 0,
      departmentSummaries: [],
      sectionSummaries: [],
      lineSummaries: [],
      designationSummaries: [],
    };
  },

  getIncrements: async (params?: { companyId?: number; companyGuid?: string }) => {
    const { companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params?.companyGuid;
    if (!guid && params?.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) return [];
    const rows = await payrollService.getSalaryIncrements({ companyId: guid });
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      companyId: r.companyId,
      incrementAmount: r.incrementAmount,
      effectiveDate: r.effectiveFrom,
      status: r.status,
      oldGrossSalary: r.oldGrossSalary,
      newGrossSalary: r.newGrossSalary,
      employeeName: r.employeeId,
      previousGrossSalary: r.oldGrossSalary ?? 0,
      incrementType: "Annual",
    }));
  },

  createIncrement: (data: Record<string, unknown>) => payrollService.createSalaryIncrement(data),

  getBankSheet: async (params: { year: number; month: number; companyId?: number; companyGuid?: string; departmentId?: number; searchTerm?: string }) => {
    const { findOrCreatePayrollPeriod, mapBankSheetRow, companyGuidFromSelection } = await import("@/lib/payroll-utils");
    const { companyService } = await import("@/lib/services/company");
    let guid = params.companyGuid;
    if (!guid && params.companyId) {
      const companies = await companyService.getAll();
      guid = companyGuidFromSelection(companies, String(params.companyId));
    }
    if (!guid) return [];
    const period = await findOrCreatePayrollPeriod(guid, params.year, params.month);
    const rows = await payrollService.getBankSheetByPeriod(period.id);
    return rows.map((r) => mapBankSheetRow(r));
  },

  exportPaySlips: async (params: { year: number; month: number; companyId?: number; companyGuid?: string; departmentId?: number; sectionId?: number; designationId?: number; lineId?: number; searchTerm?: string; exportType?: string; status?: string }) => {
    const p = await resolvePeriodExportParams(params);
    await downloadExport("/api/v1/payroll/export/salary-sheet", p, `salary-sheet-${params.month}-${params.year}.csv`);
  },

  exportIndividualPayslipsExcel: async (params: { year: number; month: number; companyId?: number; companyGuid?: string; departmentId?: number; sectionId?: number; designationId?: number; lineId?: number; searchTerm?: string; status?: string }) => {
    const p = await resolvePeriodExportParams(params);
    await downloadExport("/api/v1/payroll/export/salary-sheet", p, `payslips-${params.month}-${params.year}.csv`);
  },

  exportBankSheet: async (params: { year: number; month: number; companyId?: number; companyGuid?: string; departmentId?: number; searchTerm?: string }) => {
    const p = await resolvePeriodExportParams(params);
    await downloadExport("/api/v1/payroll/export/bank-sheet", p, `bank-sheet-${params.month}-${params.year}.csv`);
  },

  exportAdvanceSalarySheet: async (params: { year: number; month: number; companyId?: number; companyGuid?: string; departmentId?: number; searchTerm?: string }) => {
    await downloadExport("/api/v1/payroll/export/advance-sheet", await resolveCompanyExportParamsAsync(params), `advance-sheet-${params.month}-${params.year}.csv`);
  },

  exportAdvanceSalarySummary: async (params: { year: number; month: number; companyId?: number; companyGuid?: string }) => {
    await downloadExport("/api/v1/payroll/export/advance-sheet", await resolveCompanyExportParamsAsync(params), `advance-summary-${params.month}-${params.year}.csv`);
  },

  exportAdvanceBankSheet: async (params: { year: number; month: number; companyId?: number; companyGuid?: string }) => {
    await downloadExport("/api/v1/payroll/export/advance-sheet", await resolveCompanyExportParamsAsync(params), `advance-bank-${params.month}-${params.year}.csv`);
  },

  exportFestivalBonus: async (params: { year?: number; month?: number; companyId?: number; companyGuid?: string }) => {
    await downloadExport("/api/v1/payroll/export/bonuses", await resolveCompanyExportParamsAsync({ year: params.year ?? new Date().getFullYear(), month: params.month, companyId: params.companyId, companyGuid: params.companyGuid }), "bonuses.csv");
  },

  exportFestivalBonusBankSheet: async (params: { year: number; month: number; companyId?: number; companyGuid?: string; departmentId?: number; searchTerm?: string }) => {
    await downloadExport("/api/v1/payroll/export/bonuses", await resolveCompanyExportParamsAsync(params), `festival-bonus-bank-${params.month}-${params.year}.csv`);
  },

  exportDailySheet: async (params: { date: string; companyId?: number; companyGuid?: string; departmentId?: number; searchTerm?: string }) => {
    const companyId = params.companyGuid ?? (params.companyId ? await resolveCompanyGuid(params.companyId) : undefined);
    await downloadExport("/api/v1/payroll/export/daily-sheet", { companyId, date: params.date.slice(0, 10) }, `daily-sheet-${params.date.slice(0, 10)}.csv`);
  },

  exportSummaryExcel: async (params: { year: number; month: number; companyId?: number; companyGuid?: string }) => {
    const p = await resolvePeriodExportParams(params);
    await downloadExport("/api/v1/payroll/export/summary", p, `summary-${params.month}-${params.year}.csv`);
  },

  exportSummaryPdf: async (params: { year: number; month: number; companyId?: number; companyGuid?: string }) => {
    const p = await resolvePeriodExportParams(params);
    await downloadExport("/api/v1/payroll/export/summary", { ...p, format: "pdf" }, `summary-${params.month}-${params.year}.csv`);
  },
};

function mapAdvance(r: SalaryAdvanceDto): AdvanceSalary {
  return {
    id: r.id,
    employeeId: r.employeeId,
    companyId: r.companyId,
    amount: r.advanceAmount,
    requestDate: r.advanceDate,
    repaymentMonth: 0,
    repaymentYear: 0,
    status: r.status,
    advanceNo: r.advanceNo,
    balanceAmount: r.balanceAmount,
    basicSalary: 0,
    houseRent: 0,
    medicalAllowance: 0,
    foodAllowance: 0,
    transportAllowance: 0,
    grossSalary: r.advanceAmount,
    presentDays: 0,
    absentDays: 0,
    absentDeduction: 0,
    totalPayableWages: r.advanceAmount,
    otHours: 0,
    otRate: 0,
    otAmount: 0,
    netPayable: r.advanceAmount,
  };
}

async function resolvePeriodExportParams(params: {
  year: number;
  month: number;
  companyId?: number;
  companyGuid?: string;
}): Promise<Record<string, unknown>> {
  const { findOrCreatePayrollPeriod, companyGuidFromSelection } = await import("@/lib/payroll-utils");
  const { companyService } = await import("@/lib/services/company");
  let guid = params.companyGuid;
  if (!guid && params.companyId) {
    const companies = await companyService.getAll();
    guid = companyGuidFromSelection(companies, String(params.companyId));
  }
  if (!guid) return {};
  const period = await findOrCreatePayrollPeriod(guid, params.year, params.month);
  return { periodId: period.id };
}

async function resolveCompanyGuid(companyId: number): Promise<string | undefined> {
  const { companyGuidFromSelection } = await import("@/lib/payroll-utils");
  const { companyService } = await import("@/lib/services/company");
  const companies = await companyService.getAll();
  return companyGuidFromSelection(companies, String(companyId));
}

async function resolveCompanyExportParamsAsync(params: {
  year: number;
  month?: number;
  companyId?: number;
  companyGuid?: string;
}): Promise<Record<string, unknown>> {
  let companyId = params.companyGuid;
  if (!companyId && params.companyId) {
    companyId = await resolveCompanyGuid(params.companyId);
  }
  return { companyId, year: params.year, month: params.month };
}
