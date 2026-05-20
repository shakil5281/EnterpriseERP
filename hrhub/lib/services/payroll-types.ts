/** PayrollService API DTOs (camelCase JSON). */

export interface PayrollPolicyDto {
  id: string;
  companyId: string;
  policyName: string;
  salaryCalculationType: string;
  monthDayCalculationType: string;
  fixedMonthDays?: number | null;
  useAttendanceForSalary: boolean;
  useApprovedAttendanceOnly: boolean;
  allowOvertime: boolean;
  overtimeCalculationType?: string | null;
  overtimeMultiplier: number;
  overtimeDivisor: number;
  allowLateDeduction: boolean;
  lateDeductionType?: string | null;
  allowAbsentDeduction: boolean;
  allowTiffinBill: boolean;
  allowNightBill: boolean;
  allowAttendanceBonus: boolean;
  allowFestivalBonus: boolean;
  allowEarnLeaveEncashment: boolean;
  isActive: boolean;
}

export interface PayrollPeriodDto {
  id: string;
  companyId: string;
  yearNo: number;
  monthNo: number;
  startDate: string;
  endDate: string;
  status: string;
  isAttendanceLocked: boolean;
  isPayrollLocked: boolean;
}

export interface SalarySheetRowDto {
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  departmentName?: string | null;
  designationName?: string | null;
  grossSalary: number;
  basicSalary: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
}

export interface PayrollSummaryDto {
  payrollPeriodId: string;
  totalEmployees: number;
  grossSalary: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
}

export interface SummaryGroupDto {
  name: string;
  totalGrossSalary: number;
  totalOTAmount: number;
  totalDeductions: number;
  totalNetPayable: number;
  employeeCount: number;
}

export interface PayrollSummaryBreakdownDto {
  summary: PayrollSummaryDto;
  departmentSummaries: SummaryGroupDto[];
  sectionSummaries: SummaryGroupDto[];
  lineSummaries: SummaryGroupDto[];
  groupSummaries: SummaryGroupDto[];
}

export interface EmployeePayrollDto {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  payrollRunId: string;
  employeeId: string;
  salaryCalculationType: string;
  grossSalary: number;
  basicSalary: number;
  totalDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  leaveWithoutPayDays: number;
  lateDays: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeAmount: number;
  tiffinBillAmount: number;
  nightBillAmount: number;
  attendanceBonusAmount: number;
  festivalBonusAmount: number;
  earnLeaveEncashmentAmount: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
  earnings: PayrollEarningDto[];
  deductions: PayrollDeductionDto[];
}

export interface PayrollEarningDto {
  earningCode: string;
  earningName: string;
  amount: number;
  isManual: boolean;
  remarks?: string | null;
}

export interface PayrollDeductionDto {
  deductionCode: string;
  deductionName: string;
  amount: number;
  isManual: boolean;
  remarks?: string | null;
}

export interface PayslipDto {
  payroll: EmployeePayrollDto;
  periodSummary: PayrollSummaryDto;
}

export interface BankSheetRowDto {
  employeeId: string;
  bankAccountNo: string;
  bankName: string;
  netSalary: number;
}

export interface SalaryStructureDto {
  id: string;
  companyId: string;
  structureCode: string;
  structureName: string;
  gradeId?: string | null;
  isActive: boolean;
  components: SalaryStructureComponentDto[];
}

export interface SalaryStructureComponentDto {
  id: string;
  companyId: string;
  salaryStructureId: string;
  componentCode: string;
  componentName: string;
  componentType: string;
  calculationType: string;
  amount: number;
  percentage: number;
  basedOnComponentCode?: string | null;
  isTaxable: boolean;
  isActive: boolean;
}

export interface EmployeeSalaryDto {
  id: string;
  companyId: string;
  employeeId: string;
  salaryStructureId?: string | null;
  grossSalary: number;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  foodAllowance: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isCurrent: boolean;
}

export interface SalaryAdvanceDto {
  id: string;
  companyId: string;
  employeeId: string;
  advanceNo: string;
  advanceAmount: number;
  paidAmount: number;
  balanceAmount: number;
  advanceDate: string;
  installmentAmount: number;
  status: string;
}

export interface SalaryAdvanceSummaryDto {
  totalCount: number;
  totalAmount: number;
  totalBalance: number;
  approvedCount: number;
  pendingCount: number;
}

export interface SalaryIncrementDto {
  id: string;
  companyId: string;
  employeeId: string;
  oldGrossSalary: number;
  newGrossSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  effectiveFrom: string;
  status: string;
}

export interface AllowanceBillDto {
  id: string;
  companyId: string;
  employeeId: string;
  allowanceType: string;
  billDate: string;
  quantity: number;
  rate: number;
  amount: number;
  status: string;
  remarks?: string | null;
}

export interface DeductionDto {
  id: string;
  companyId: string;
  employeeId: string;
  deductionType: string;
  amount: number;
  yearNo: number;
  monthNo: number;
  status: string;
  remarks?: string | null;
}

export interface FinalSettlementDto {
  id: string;
  companyId: string;
  employeeId: string;
  settlementDate: string;
  lastWorkingDate: string;
  netPayable: number;
  status: string;
}

export interface DailySalarySheetRowDto {
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  departmentName?: string | null;
  designationName?: string | null;
  date: string;
  grossSalary: number;
  perDaySalary: number;
  attendanceStatus: string;
  otHours: number;
  otAmount: number;
  totalEarning: number;
  deduction: number;
  netPayable: number;
}

export interface PayrollBonusRowDto {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  bonusType: string;
  amount: number;
  yearNo: number;
  monthNo: number;
  status: string;
}

export interface PayrollLockCheckDto {
  payrollPeriodId?: string | null;
  isLocked: boolean;
  status?: string | null;
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
