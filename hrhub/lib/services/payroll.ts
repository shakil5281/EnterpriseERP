import api from "../api";
import { platformApiUrl, unwrapResponse } from "./api-helpers";
import { toast } from "sonner";

export interface MonthlySalarySheet {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    department: string;
    designation: string;
    year: number;
    month: number;
    monthName: string;
    grossSalary: number;
    basicSalary: number;
    houseRent: number;
    medicalAllowance: number;
    foodAllowance: number;
    conveyance: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidays: number;
    weekendDays: number;
    otHours: number;
    otRate: number;
    otAmount: number;
    attendanceBonus: number;
    otherAllowances: number;
    totalEarning: number;
    absentDeduction: number;
    totalDeduction: number;
    netPayable: number;
    status: string;
    companyName?: string;
    joinedDate?: string;
    bankAccountNo?: string;
}

export interface DailySalarySheet {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    grossSalary: number;
    perDaySalary: number;
    attendanceStatus: string;
    otHours: number;
    otAmount: number;
    totalEarning: number;
    deduction: number;
    netPayable: number;
    companyName?: string;
}

export interface SummaryItem {
    name: string;
    totalGrossSalary: number;
    totalOTAmount: number;
    totalDeductions: number;
    totalNetPayable: number;
    employeeCount: number;
}

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

export interface Payslip extends MonthlySalarySheet {
    joinedDate: string;
    bankAccountNo: string;
    paymentMethod: string;
    arrears: number;
    taxDeduction: number;
    pfContribution: number;
}

export interface AdvanceSalary {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    designation: string;
    joiningDate: string;
    grade?: string;
    amount: number;
    requestDate: string;
    repaymentMonth: number;
    repaymentYear: number;
    status: string;
    remarks: string;
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
    totalAdvanceDisbursed: number;
    totalPendingRequests: number;
    totalPendingAmount: number;
    totalRepaid: number;
    totalEmployees: number;
    departmentSummaries: {
        departmentName: string;
        employeeCount: number;
        basicSalary: number;
        grossSalary: number;
        absentDays: number;
        absentDeduction: number;
        totalPayableWages: number;
        otHours: number;
        otAmount: number;
        netPayable: number;
    }[];
    sectionSummaries: {
        sectionName: string;
        employeeCount: number;
        basicSalary: number;
        grossSalary: number;
        absentDays: number;
        absentDeduction: number;
        totalPayableWages: number;
        otHours: number;
        otAmount: number;
        netPayable: number;
    }[];
    lineSummaries: {
        lineName: string;
        employeeCount: number;
        basicSalary: number;
        grossSalary: number;
        absentDays: number;
        absentDeduction: number;
        totalPayableWages: number;
        otHours: number;
        otAmount: number;
        netPayable: number;
    }[];
    designationSummaries: {
        designationName: string;
        employeeCount: number;
        basicSalary: number;
        grossSalary: number;
        absentDays: number;
        absentDeduction: number;
        totalPayableWages: number;
        otHours: number;
        otAmount: number;
        netPayable: number;
    }[];
}

export interface SalaryIncrement {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    previousGrossSalary: number;
    incrementAmount: number;
    newGrossSalary: number;
    effectiveDate: string;
    incrementType: string;
    isApplied: boolean;
}

export interface Bonus {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    bonusType: string;
    amount: number;
    year: number;
    month: number;
    status: string;
    companyName?: string;
    joiningDate?: string;
    grossSalary?: number;
    jobAge?: string;
}

export interface FestivalBonusSummary {
    processedCount: number;
    skippedCount: number;
    totalAmount: number;
    message: string;
}

export interface BankSheet {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    bankName: string;
    bankAccountNo: string;
    bankBranchName: string;
    netPayable: number;
    status: string;
    department: string;
    companyName?: string;
}

export interface PayrollApiEntity {
    id: string;
    companyId?: string;
    [key: string]: unknown;
}

export interface PayrollApprovalRequest {
    userId: string;
    remarks?: string | null;
}

export interface PayrollProcessRequest {
    companyId: string;
    yearNo: number;
    monthNo: number;
    processedBy?: string | null;
    forceReprocess?: boolean;
}

export const payrollService = {
    createPayrollPolicy: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/payroll-policies"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getPayrollPolicies: async (companyId?: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/payroll-policies"), { params: { companyId } });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    getPayrollPolicyById: async (id: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll-policies/${encodeURIComponent(id)}`));
        return unwrapResponse<PayrollApiEntity>(response);
    },
    updatePayrollPolicy: async (id: string, data: Record<string, unknown>) => {
        const response = await api.put<unknown>(platformApiUrl(`/api/payroll-policies/${encodeURIComponent(id)}`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    activatePayrollPolicy: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll-policies/${encodeURIComponent(id)}/activate`));
        return unwrapResponse<PayrollApiEntity>(response);
    },
    deactivatePayrollPolicy: async (id: string) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll-policies/${encodeURIComponent(id)}/deactivate`));
        return unwrapResponse<PayrollApiEntity>(response);
    },

    createSalaryStructure: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/salary-structures"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getSalaryStructures: async (companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/salary-structures"), { params: { companyId } });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    addSalaryStructureComponent: async (id: string, data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl(`/api/salary-structures/${encodeURIComponent(id)}/components`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getSalaryStructureComponents: async (id: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/salary-structures/${encodeURIComponent(id)}/components`));
        return unwrapResponse<PayrollApiEntity[]>(response);
    },

    assignEmployeeSalary: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/employee-salaries"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getCurrentEmployeeSalary: async (employeeId: string, companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/employee-salaries/${encodeURIComponent(employeeId)}/current`), { params: { companyId } });
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getEmployeeSalaryHistory: async (employeeId: string, companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/employee-salaries/${encodeURIComponent(employeeId)}/history`), { params: { companyId } });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },

    createPayrollPeriod: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/payroll-periods"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getPayrollPeriods: async (companyId?: string) => {
        const response = await api.get<unknown>(platformApiUrl("/api/payroll-periods"), { params: { companyId } });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    closePayrollPeriod: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll-periods/${encodeURIComponent(id)}/close`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    lockPayrollPeriod: async (id: string, data: { lockedBy: string; remarks?: string | null }) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll-periods/${encodeURIComponent(id)}/lock`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    unlockPayrollPeriod: async (id: string, data: { unlockedBy: string; unlockReason: string }) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll-periods/${encodeURIComponent(id)}/unlock`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },

    processPayroll: async (data: PayrollProcessRequest) => {
        const response = await api.post<unknown>(platformApiUrl("/api/payroll/process"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    reprocessPayroll: async (data: PayrollProcessRequest) => {
        const response = await api.post<unknown>(platformApiUrl("/api/payroll/reprocess"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getPayrollByPeriod: async (periodId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}`));
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    getEmployeePayroll: async (periodId: string, employeeId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/employees/${encodeURIComponent(employeeId)}`));
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getSalarySheetByPeriod: async (periodId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/salary-sheet`));
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    getBankSheetByPeriod: async (periodId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/bank-sheet`));
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    getPayslipsByPeriod: async (periodId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/payslips`));
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    getPayslipByPeriod: async (periodId: string, employeeId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/payslips/${encodeURIComponent(employeeId)}`));
        return unwrapResponse<PayrollApiEntity>(response);
    },
    submitPayroll: async (periodId: string, data: PayrollApprovalRequest) => {
        const response = await api.post<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/submit`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    approvePayroll: async (periodId: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/approve`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    rejectPayroll: async (periodId: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/payroll/${encodeURIComponent(periodId)}/reject`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    checkPayrollLock: async (params: { companyId: string; year: number; month: number }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/payroll-locks/check"), { params });
        return unwrapResponse<PayrollApiEntity>(response);
    },

    createSalaryAdvance: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/salary-advances"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getSalaryAdvance: async (params: { companyId: string; employeeId: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/salary-advances"), { params });
        return unwrapResponse<PayrollApiEntity>(response);
    },
    approveSalaryAdvance: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/salary-advances/${encodeURIComponent(id)}/approve`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    rejectSalaryAdvance: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/salary-advances/${encodeURIComponent(id)}/reject`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getSalaryAdvanceBalance: async (employeeId: string, companyId: string) => {
        const response = await api.get<unknown>(platformApiUrl(`/api/salary-advances/${encodeURIComponent(employeeId)}/balance`), { params: { companyId } });
        return unwrapResponse<PayrollApiEntity>(response);
    },

    createSalaryIncrement: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/salary-increments"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getSalaryIncrements: async (params: { companyId: string; employeeId?: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/salary-increments"), { params });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    approveSalaryIncrement: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/salary-increments/${encodeURIComponent(id)}/approve`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    rejectSalaryIncrement: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/salary-increments/${encodeURIComponent(id)}/reject`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },

    createAllowanceBill: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/allowance-bills"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getAllowanceBills: async (params: { companyId: string; employeeId?: string; fromDate?: string; toDate?: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/allowance-bills"), { params });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    approveAllowanceBill: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/allowance-bills/${encodeURIComponent(id)}/approve`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    rejectAllowanceBill: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/allowance-bills/${encodeURIComponent(id)}/reject`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },

    createDeduction: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/deductions"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getDeductions: async (params: { companyId: string; employeeId?: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/deductions"), { params });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },

    createFinalSettlement: async (data: Record<string, unknown>) => {
        const response = await api.post<unknown>(platformApiUrl("/api/final-settlements"), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },
    getFinalSettlements: async (params: { companyId: string; employeeId?: string }) => {
        const response = await api.get<unknown>(platformApiUrl("/api/final-settlements"), { params });
        return unwrapResponse<PayrollApiEntity[]>(response);
    },
    approveFinalSettlement: async (id: string, data: PayrollApprovalRequest) => {
        const response = await api.patch<unknown>(platformApiUrl(`/api/final-settlements/${encodeURIComponent(id)}/approve`), data);
        return unwrapResponse<PayrollApiEntity>(response);
    },

    getMonthlySheet: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        sectionId?: number;
        designationId?: number;
        lineId?: number;
        status?: string;
        searchTerm?: string
    }) => {
        const response = await api.get<MonthlySalarySheet[]>("/Payroll/monthly-sheet", { params });
        return response.data;
    },
    getDailySheet: async (params: {
        date: string;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string
    }) => {
        const response = await api.get<DailySalarySheet[]>("/Payroll/daily-sheet", { params });
        return response.data;
    },
    getSummary: async (year: number, month: number, companyId?: number) => {
        const response = await api.get<SalarySummary>("/Payroll/summary", { params: { year, month, companyId } });
        return response.data;
    },
    getPayslip: async (id: number) => {
        const response = await api.get<Payslip>(`/Payroll/payslip/${id}`);
        return response.data;
    },
    processSalary: async (data: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        employeeId?: string
    }) => {
        const response = await api.post("/Payroll/process", data);
        return response.data;
    },
    getAdvanceSalaries: async (params: { month?: number; year?: number; companyId?: number }) => {
        const response = await api.get<AdvanceSalary[]>("/Payroll/advance-salary", { params });
        return response.data;
    },
    createAdvanceSalary: async (data: {
        employeeId: string;
        companyId: number;
        amount: number;
        requestDate: string;
        repaymentMonth: number;
        repaymentYear: number;
        remarks?: string;
    }) => {
        const response = await api.post("/Payroll/advance-salary", data);
        return response.data;
    },
    batchAdvanceSalary: async (data: {
        employeeIds: string[];
        companyId: number;
        amount: number;
        isDateRange?: boolean;
        fromDate?: string;
        toDate?: string;
        requestDate: string;
        repaymentMonth: number;
        repaymentYear: number;
        remarks?: string;
    }) => {
        const response = await api.post("/Payroll/batch-advance-salary", data);
        return response.data;
    },
    batchDeleteAdvanceSalary: async (ids: number[]) => {
        const response = await api.post("/Payroll/batch-delete-advance-salary", ids);
        return response.data;
    },
    getAdvanceSalarySummary: async (params: { month?: number; year?: number; companyId?: number }) => {
        const response = await api.get<AdvanceSalarySummary>("/Payroll/advance-salary-summary", { params });
        return response.data;
    },
    exportAdvanceSalarySummary: async (params: { month: number; year: number; companyId?: number }) => {
        const response = await api.get("/Payroll/export-advance-salary-summary", {
            params,
            responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const monthName = new Date(params.year, params.month - 1).toLocaleString('default', { month: 'long' });
        link.setAttribute('download', `Advance_Salary_Summary_${monthName}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    exportAdvanceBankSheet: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string
    }) => {
        const response = await api.get("/Payroll/export-advance-salary-bank-sheet", {
            params,
            responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const monthName = new Date(params.year, params.month - 1).toLocaleString('default', { month: 'long' });
        link.setAttribute('download', `Advance_Salary_Bank_Payment_${monthName}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    exportAdvanceSalarySheet: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string
    }) => {
        const response = await api.get("/Payroll/export-advance-salary-sheet", {
            params,
            responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const monthName = new Date(params.year, params.month - 1).toLocaleString('default', { month: 'long' });
        link.setAttribute('download', `Advance_Salary_Sheet_${monthName}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    getIncrements: async (params?: { companyId?: number }) => {
        const response = await api.get<SalaryIncrement[]>("/Payroll/increments", { params });
        return response.data;
    },
    createIncrement: async (data: {
        employeeId: string;
        companyId: number;
        incrementAmount: number;
        effectiveDate: string;
        incrementType: string;
        remarks?: string;
    }) => {
        const response = await api.post("/Payroll/increment", data);
        return response.data;
    },
    exportPaySlips: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        sectionId?: number;
        designationId?: number;
        lineId?: number;
        status?: string;
        searchTerm?: string;
        exportType?: "master" | "salary";
    }) => {
        const response = await api.get("/Payroll/export-monthly-sheet", {
            params,
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const filePrefix = params.exportType === "salary" ? "Salary_Sheet_By_Line" : "Master_Salary_Sheet";
        link.setAttribute("download", `${filePrefix}_${params.month}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    exportIndividualPayslipsExcel: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        sectionId?: number;
        designationId?: number;
        lineId?: number;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get("/Payroll/export-payslips-excel", {
            params,
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Individual_Payslips_${params.month}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    getBankSheet: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string
    }) => {
        const response = await api.get<BankSheet[]>("/Payroll/bank-sheet", { params });
        return response.data;
    },
    exportBankSheet: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string
    }) => {
        const response = await api.get("/Payroll/export-bank-sheet", {
            params,
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Bank_Payment_${params.month}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    getBonuses: async (params: { year: number; month?: number; companyId?: number }) => {
        const response = await api.get<Bonus[]>("/Payroll/bonuses", { params });
        return response.data;
    },
    createBonus: async (data: {
        employeeId: string;
        companyId: number;
        bonusType: string;
        amount: number;
        year: number;
        month: number;
    }) => {
        const response = await api.post("/Payroll/bonus", data);
        return response.data;
    },
    processFestivalBonus: async (data: {
        bonusType: string;
        year: number;
        month: number;
        percentage: number;
        baseOn: string;
        companyId?: number;
    }) => {
        const response = await api.post<FestivalBonusSummary>("/Payroll/process-festival-bonus", data);
        return response.data;
    },
    deleteBonus: async (id: number) => {
        await api.delete(`/Payroll/bonus/${id}`);
    },
    exportFestivalBonus: async (params: { year?: number; month?: number; companyId?: number }) => {
        const response = await api.get("/Payroll/export-bonuses", {
            params,
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Festival_Bonus_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    exportFestivalBonusBankSheet: async (params: {
        year: number;
        month: number;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string
    }) => {
        const response = await api.get("/Payroll/export-festival-bonus-bank-sheet", {
            params,
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Festival_Bonus_Bank_Payment_${params.month}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    processDailySheet: async (data: {
        date: string;
        companyId?: number;
        departmentId?: number;
        employeeId?: string;
    }) => {
        const response = await api.post<{ processedCount: number; skippedCount: number; message: string }>(
            "/Payroll/process-daily",
            { ...data, date: new Date(data.date).toISOString() }
        );
        return response.data;
    },
    exportDailySheet: async (params: {
        date: string;
        companyId?: number;
        departmentId?: number;
        searchTerm?: string;
    }) => {
        const response = await api.get("/Payroll/export-daily-sheet", {
            params: { ...params, date: new Date(params.date).toISOString() },
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Daily_Salary_${params.date}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    exportSummaryExcel: async (params: { year: number; month: number; companyId?: number }) => {
        const response = await api.get("/Payroll/export-summary-excel", {
            params,
            responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const monthName = new Date(params.year, params.month - 1).toLocaleString('default', { month: 'long' });
        link.setAttribute("download", `Salary_Summary_${monthName}_${params.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    exportSummaryPdf: async (params: { year: number; month: number; companyId?: number }) => {
        const response = await api.get("/Payroll/export-summary-pdf", {
            params,
            responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const monthName = new Date(params.year, params.month - 1).toLocaleString('default', { month: 'long' });
        link.setAttribute("download", `Salary_Summary_${monthName}_${params.year}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
