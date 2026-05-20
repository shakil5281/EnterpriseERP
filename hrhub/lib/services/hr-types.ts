/** HR API DTOs (camelCase JSON from Platform.Host). */

export interface HrPagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface HrEmployeeListItem {
  id: string;
  punchNumber: number;
  employeeID: string;
  fullName: string;
  email?: string | null;
  companyId: string;
  status: string;
  designationName?: string | null;
  departmentName?: string | null;
}

export interface HrEmployeeJobInfo {
  departmentId?: string | null;
  departmentName?: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
  designationId?: string | null;
  designationName?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  supervisorId?: string | null;
  supervisorName?: string | null;
  workLocation?: string | null;
  effectiveFrom: string;
}

export interface HrEmployeeSalaryInfo {
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  foodAllowance: number;
  grossSalary: number;
  effectiveFrom: string;
}

export interface HrEmployeeAddress {
  id: string;
  addressType: string;
  country: string;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  postOffice?: string | null;
  postalCode?: string | null;
  addressLine?: string | null;
}

export interface HrEmployeeBankAccount {
  id: string;
  bankName?: string | null;
  branchName?: string | null;
  accountNo?: string | null;
  routingNo?: string | null;
  mobileBankingType?: string | null;
  mobileBankingNo?: string | null;
  isPrimary: boolean;
}

export interface HrEmergencyContact {
  id: string;
  contactName: string;
  relation?: string | null;
  phone: string;
  address?: string | null;
}

export interface HrEmployeeDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface HrEmployeeDetails {
  id: string;
  companyId: string;
  punchNumber: number;
  employeeID: string;
  fullName: string;
  banglaName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  birthCertificateNo?: string | null;
  phone?: string | null;
  email?: string | null;
  joinDate: string;
  employmentType: string;
  status: string;
  currentJobInfo?: HrEmployeeJobInfo | null;
  currentSalaryInfo?: HrEmployeeSalaryInfo | null;
  addresses: HrEmployeeAddress[];
  bankAccounts: HrEmployeeBankAccount[];
  emergencyContacts: HrEmergencyContact[];
  documents: HrEmployeeDocument[];
}

export interface HrManpowerListItem {
  id: string;
  punchNumber: number;
  employeeID: string;
  fullName: string;
  designationName?: string | null;
  departmentName?: string | null;
  sectionName?: string | null;
  joinDate: string;
  status: string;
  phone?: string | null;
  grossSalary: number;
}

export interface HrStatusHistoryItem {
  id: string;
  status: string;
  effectiveFrom: string;
  remarks?: string | null;
  createdAt: string;
}

export interface HrTransferItem {
  id: string;
  employeeId: string;
  employeeID: string;
  fullName: string;
  fromDepartmentId?: string | null;
  fromDepartmentName?: string | null;
  toDepartmentId?: string | null;
  toDepartmentName?: string | null;
  effectiveDate: string;
  reason?: string | null;
  createdAt: string;
}

export interface HrSummaryBucket {
  id?: string | null;
  name: string;
  count: number;
  percentage: number;
}

export interface HrManpowerSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
  departmentSummary: HrSummaryBucket[];
  designationSummary: HrSummaryBucket[];
  genderSummary: HrSummaryBucket[];
  statusSummary: HrSummaryBucket[];
}
