import api from "../api";
import { unwrapApiData } from "@/lib/api-response";
import { companyService } from "@/lib/services/company";
import {
  organogramService,
  resolveDepartmentGuid,
  resolveDesignationGuid,
  resolveSectionGuid,
  resolveShiftGuid,
} from "@/lib/services/organogram";

/** HR service `EmployeeListItemDto` (camelCase JSON). */
interface HrEmployeeListItem {
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

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

function stableIntFromGuid(guid: string): number {
  const hex = guid.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n | 0 : 0;
}

function isGuid(value: string | undefined | null): value is string {
  return (
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

async function resolveCompanyGuid(
  companyId?: number,
): Promise<string | undefined> {
  if (!companyId) return undefined;
  const companies = await companyService.getAll();
  return companies.find((c) => c.id === companyId)?.entityId;
}

async function firstCompanyGuid(): Promise<string | undefined> {
  return (await companyService.getAll())[0]?.entityId;
}

async function resolveEmployeeGuid(
  employeeIdOrGuid: string,
  companyId?: number,
): Promise<string> {
  if (isGuid(employeeIdOrGuid)) return employeeIdOrGuid;
  const page = await fetchHrEmployeesPage({
    searchTerm: employeeIdOrGuid,
    companyId,
    pageSize: 50,
  });
  const needle = String(employeeIdOrGuid).toLowerCase();
  const match =
    page.items.find((e) => e.employeeID === employeeIdOrGuid) ??
    page.items.find((e) => String(e.employeeID).toLowerCase() === needle) ??
    page.items.find((e) => String(e.punchNumber) === employeeIdOrGuid);
  if (!match) {
    throw new Error("Employee not found.");
  }
  return match.id;
}

function mapHrListItemToEmployee(row: HrEmployeeListItem): Employee {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    departmentId: 0,
    designationId: 0,
    departmentName: row.departmentName ?? undefined,
    designationName: row.designationName ?? undefined,
    status: row.status,
    joinDate: "",
    isActive: true,
    isOtEnabled: false,
    createdAt: "",
    companyId: stableIntFromGuid(row.companyId),
    companyEntityId: row.companyId,
    email: row.email ?? undefined,
  };
}

function mapHrListItemToSimple(row: HrEmployeeListItem): EmployeeSimple {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    companyId: stableIntFromGuid(row.companyId),
    companyEntityId: row.companyId,
    status: row.status,
  };
}

function mapHrListItemToMini(row: HrEmployeeListItem): EmployeeMini {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
  };
}

/** HR `ManpowerListItemDto` from GET /hr/Employees/manpower */
interface HrManpowerListItem {
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

interface HrEmployeeDetails {
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
  currentJobInfo?: {
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
  } | null;
  currentSalaryInfo?: {
    basicSalary: number;
    houseRent: number;
    medicalAllowance: number;
    conveyanceAllowance: number;
    foodAllowance: number;
    grossSalary: number;
    effectiveFrom: string;
  } | null;
}

type EmployeeAddressEntityId = string | number;

function mapHrManpowerToEmployee(row: HrManpowerListItem): Employee {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    departmentId: 0,
    designationId: 0,
    departmentName: row.departmentName ?? undefined,
    sectionName: row.sectionName ?? undefined,
    designationName: row.designationName ?? undefined,
    status: row.status,
    joinDate: row.joinDate,
    phoneNumber: row.phone ?? undefined,
    grossSalary: row.grossSalary,
    isActive: row.status === "Active",
    isOtEnabled: false,
    createdAt: "",
  };
}

function mapHrDetailsToEmployee(row: HrEmployeeDetails): Employee {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    fullNameBn: row.banglaName ?? undefined,
    nid: row.nationalId ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    gender: row.gender ?? undefined,
    email: row.email ?? undefined,
    phoneNumber: row.phone ?? undefined,
    departmentId: row.currentJobInfo?.departmentId
      ? stableIntFromGuid(row.currentJobInfo.departmentId)
      : 0,
    departmentName: row.currentJobInfo?.departmentName ?? undefined,
    sectionId: row.currentJobInfo?.sectionId
      ? stableIntFromGuid(row.currentJobInfo.sectionId)
      : undefined,
    sectionName: row.currentJobInfo?.sectionName ?? undefined,
    designationId: row.currentJobInfo?.designationId
      ? stableIntFromGuid(row.currentJobInfo.designationId)
      : 0,
    designationName: row.currentJobInfo?.designationName ?? undefined,
    status: row.status,
    joinDate: row.joinDate,
    basicSalary: row.currentSalaryInfo?.basicSalary,
    houseRent: row.currentSalaryInfo?.houseRent,
    medicalAllowance: row.currentSalaryInfo?.medicalAllowance,
    conveyance: row.currentSalaryInfo?.conveyanceAllowance,
    foodAllowance: row.currentSalaryInfo?.foodAllowance,
    grossSalary: row.currentSalaryInfo?.grossSalary,
    isActive: row.status === "Active",
    isOtEnabled: false,
    createdAt: "",
    companyId: stableIntFromGuid(row.companyId),
    companyEntityId: row.companyId,
  };
}

async function syncEmployeeSubResources(
  employeeId: string,
  data: CreateEmployeeDto,
) {
  if (
    data.presentAddress ||
    data.presentDivisionId ||
    data.presentDistrictId ||
    data.presentThanaId ||
    data.presentPostOfficeId ||
    data.presentPostalCode
  ) {
    await employeeService.addAddress(employeeId, {
      addressType: "Present",
      country: "Bangladesh",
      division: data.presentDivisionId
        ? String(data.presentDivisionId)
        : undefined,
      district: data.presentDistrictId
        ? String(data.presentDistrictId)
        : undefined,
      upazila: data.presentThanaId ? String(data.presentThanaId) : undefined,
      postOffice: data.presentPostOfficeId
        ? String(data.presentPostOfficeId)
        : undefined,
      postalCode: data.presentPostalCode,
      addressLine: data.presentAddress,
    });
  }

  if (
    data.permanentAddress ||
    data.permanentDivisionId ||
    data.permanentDistrictId ||
    data.permanentThanaId ||
    data.permanentPostOfficeId ||
    data.permanentPostalCode
  ) {
    await employeeService.addAddress(employeeId, {
      addressType: "Permanent",
      country: "Bangladesh",
      division: data.permanentDivisionId
        ? String(data.permanentDivisionId)
        : undefined,
      district: data.permanentDistrictId
        ? String(data.permanentDistrictId)
        : undefined,
      upazila: data.permanentThanaId
        ? String(data.permanentThanaId)
        : undefined,
      postOffice: data.permanentPostOfficeId
        ? String(data.permanentPostOfficeId)
        : undefined,
      postalCode: data.permanentPostalCode,
      addressLine: data.permanentAddress,
    });
  }

  if (
    data.bankName ||
    data.bankAccountNo ||
    data.bankBranchName ||
    data.bankRoutingNo
  ) {
    await employeeService.addBankAccount(employeeId, {
      bankName: data.bankName,
      branchName: data.bankBranchName,
      accountNo: data.bankAccountNo,
      routingNo: data.bankRoutingNo,
      mobileBankingType: data.bankAccountType,
      mobileBankingNo: undefined,
      isPrimary: true,
    });
  }

  if (data.emergencyContactName || data.emergencyContactPhone) {
    await employeeService.addEmergencyContact(employeeId, {
      contactName: data.emergencyContactName || "Emergency Contact",
      relation: data.emergencyContactRelation,
      phone: data.emergencyContactPhone || "",
      address: data.emergencyContactAddress,
    });
  }

  if (data.shiftId && data.companyId) {
    const shiftGuid = await resolveShiftGuid(data.shiftId, data.companyId);
    if (shiftGuid) {
      const companyGuid = await resolveCompanyGuid(data.companyId);
      if (companyGuid) {
        try {
          await api.post("employee-shifts/assign", {
            companyId: companyGuid,
            employeeId,
            shiftId: shiftGuid,
            effectiveFrom: data.joinDate || new Date().toISOString(),
            effectiveTo: null,
            assignedBy: null,
          });
        } catch (err) {
          console.error("Failed to assign shift:", err);
        }
      }
    }
  }
}

function needsManpowerListApi(params?: {
  sectionId?: number;
  designationId?: number;
  gender?: string;
  religion?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
}): boolean {
  if (!params) return false;
  if (params.sectionId !== undefined) return true;
  if (params.designationId !== undefined) return true;
  if (params.gender && params.gender.toLowerCase() !== "all") return true;
  if (params.joinDateFrom || params.joinDateTo) return true;
  return false;
}

async function fetchHrEmployeesPage(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  companyId?: number;
  departmentId?: number;
  status?: string;
}): Promise<PagedResult<HrEmployeeListItem>> {
  const companyGuid = await resolveCompanyGuid(params?.companyId);
  const departmentGuid = params?.departmentId
    ? await resolveDepartmentGuid(params.departmentId)
    : undefined;
  const response = await api.get("hr/Employees", {
    params: {
      page: params?.page ?? 1,
      pageSize: Math.min(params?.pageSize ?? 200, 200),
      search: params?.searchTerm,
      companyId: companyGuid,
      departmentId: departmentGuid,
      status:
        params?.status && params.status.toLowerCase() !== "all"
          ? params.status
          : undefined,
    },
  });
  return unwrapApiData<PagedResult<HrEmployeeListItem>>(response.data);
}

export interface Employee {
  id: number;
  entityId?: string;
  employeeId: string;
  punchNumber?: number;
  fullNameEn: string;
  fullNameBn?: string;
  nid?: string;
  proximity?: string;
  dateOfBirth?: string;
  gender?: string;
  religion?: string;
  departmentId: number;
  departmentName?: string;
  sectionId?: number;
  sectionName?: string;
  designationId: number;
  designationName?: string;
  lineId?: number;
  lineName?: string;
  shiftId?: number;
  shiftName?: string;
  groupId?: number;
  groupName?: string;
  floorId?: number;
  floorName?: string;
  status: string;
  joinDate: string;
  profileImageUrl?: string;
  signatureImageUrl?: string;
  email?: string;
  phoneNumber?: string;
  presentAddress?: string;
  presentAddressBn?: string;
  presentDivisionId?: EmployeeAddressEntityId;
  presentDistrictId?: EmployeeAddressEntityId;
  presentThanaId?: EmployeeAddressEntityId;
  presentPostOfficeId?: EmployeeAddressEntityId;
  presentPostalCode?: string;

  permanentAddress?: string;
  permanentAddressBn?: string;
  permanentDivisionId?: EmployeeAddressEntityId;
  permanentDistrictId?: EmployeeAddressEntityId;
  permanentThanaId?: EmployeeAddressEntityId;
  permanentPostOfficeId?: EmployeeAddressEntityId;
  permanentPostalCode?: string;

  // Family Information
  fatherNameEn?: string;
  fatherNameBn?: string;
  motherNameEn?: string;
  motherNameBn?: string;
  maritalStatus?: string;
  spouseNameEn?: string;
  spouseNameBn?: string;
  spouseOccupation?: string;
  spouseContact?: string;

  // Salary Information
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyance?: number;
  foodAllowance?: number;
  otherAllowance?: number;
  grossSalary?: number;

  // Account Information
  bankName?: string;
  bankBranchName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
  bankAccountType?: string;

  // Emergency Contact Info
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  companyId?: number;
  companyEntityId?: string;
  companyName?: string;
  bloodGroup?: string;

  isActive: boolean;
  isOtEnabled: boolean;
  createdAt: string;
}

export interface CreateEmployeeDto {
  employeeId?: string;
  punchNumber?: number;
  fullNameEn: string;
  fullNameBn?: string;
  nid?: string;
  proximity?: string;
  dateOfBirth?: string;
  gender?: string;
  religion?: string;
  departmentId: number;
  sectionId?: number;
  designationId: number;
  lineId?: number;
  shiftId?: number;
  groupId?: number;
  floorId?: number;
  status: string;
  joinDate: string;
  email?: string;
  phoneNumber?: string;
  presentAddress?: string;
  presentAddressBn?: string;
  presentDivisionId?: EmployeeAddressEntityId;
  presentDistrictId?: EmployeeAddressEntityId;
  presentThanaId?: EmployeeAddressEntityId;
  presentPostOfficeId?: EmployeeAddressEntityId;
  presentPostalCode?: string;

  permanentAddress?: string;
  permanentAddressBn?: string;
  permanentDivisionId?: EmployeeAddressEntityId;
  permanentDistrictId?: EmployeeAddressEntityId;
  permanentThanaId?: EmployeeAddressEntityId;
  permanentPostOfficeId?: EmployeeAddressEntityId;
  permanentPostalCode?: string;
  profileImageUrl?: string;
  signatureImageUrl?: string;

  // Family Information
  fatherNameEn?: string;
  fatherNameBn?: string;
  motherNameEn?: string;
  motherNameBn?: string;
  maritalStatus?: string;
  spouseNameEn?: string;
  spouseNameBn?: string;
  spouseOccupation?: string;
  spouseContact?: string;

  // Salary Information
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyance?: number;
  foodAllowance?: number;
  otherAllowance?: number;
  grossSalary?: number;

  // Account Information
  bankName?: string;
  bankBranchName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
  bankAccountType?: string;

  // Emergency Contact Info
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  companyId?: number;
  companyName?: string;
  bloodGroup?: string;
  isOtEnabled?: boolean;
}

export interface ManpowerSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
  departmentSummary: SummaryItem[];
  designationSummary: SummaryItem[];
  genderSummary: SummaryItem[];
  statusSummary: SummaryItem[];
}

export interface SummaryItem {
  id: string | number;
  name: string;
  count: number;
  percentage: number;
}

export type ManpowerFilterParams = {
  departmentId?: number;
  sectionId?: number;
  designationId?: number;
  lineId?: number;
  shiftId?: number;
  groupId?: number;
  floorId?: number;
  status?: string;
  searchTerm?: string;
  companyId?: number;
  companyName?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  gender?: string;
  religion?: string;
};

interface HrSummaryBucket {
  id?: string | null;
  name: string;
  count: number;
  percentage: number;
}

interface HrManpowerSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
  departmentSummary: HrSummaryBucket[];
  designationSummary: HrSummaryBucket[];
  genderSummary: HrSummaryBucket[];
  statusSummary: HrSummaryBucket[];
}

function mapSummaryBucket(row: HrSummaryBucket): SummaryItem {
  return {
    id: row.id ?? row.name,
    name: row.name,
    count: row.count,
    percentage: Number(row.percentage),
  };
}

async function buildManpowerQueryParams(
  params?: ManpowerFilterParams,
  options?: { paging?: boolean; summary?: boolean },
): Promise<Record<string, string | number>> {
  void params?.lineId;
  void params?.shiftId;
  void params?.groupId;
  void params?.floorId;
  void params?.companyName;
  void params?.religion;

  const query: Record<string, string | number> = {};

  if (options?.paging !== false) {
    query.page = 1;
    query.pageSize = 500;
  }

  if (params?.searchTerm?.trim()) {
    query.search = params.searchTerm.trim();
  }

  if (params?.status && params.status.toLowerCase() !== "all") {
    query.status = params.status;
  }

  if (params?.companyId !== undefined) {
    const company = (await companyService.getAll()).find(
      (c) => c.id === params.companyId,
    );
    if (company?.entityId) {
      query.companyId = company.entityId;
    }
  }

  if (params?.departmentId !== undefined) {
    const departmentId = await resolveDepartmentGuid(params.departmentId);
    if (departmentId) query.departmentId = departmentId;
  }

  if (params?.sectionId !== undefined) {
    const sectionId = await resolveSectionGuid(params.sectionId);
    if (sectionId) query.sectionId = sectionId;
  }

  if (params?.designationId !== undefined) {
    const designationId = await resolveDesignationGuid(params.designationId);
    if (designationId) query.designationId = designationId;
  }

  if (options?.summary) {
    if (params?.gender && params.gender.toLowerCase() !== "all") {
      query.gender = params.gender;
    }
    if (params?.joinDateFrom) {
      query.joinDateFrom = params.joinDateFrom;
    }
    if (params?.joinDateTo) {
      query.joinDateTo = params.joinDateTo;
    }
  }

  return query;
}

export interface UpdateEmployeeDto extends CreateEmployeeDto {
  isActive: boolean;
  isOtEnabled: boolean;
}

export interface EmployeeMini {
  id: number;
  entityId?: string;
  employeeId: string;
  punchNumber?: number;
  fullNameEn: string;
  departmentName?: string;
  sectionName?: string;
  designationName?: string;
  lineName?: string;
  shiftName?: string;
  groupName?: string;
}

export interface EmployeeSimple {
  id: number;
  entityId?: string;
  employeeId: string;
  punchNumber?: number;
  fullNameEn: string;
  companyId?: number;
  companyEntityId?: string;
  companyName?: string;
  departmentName?: string;
  designationName?: string;
  sectionName?: string;
  lineName?: string;
  gender?: string;
  religion?: string;
  shiftName?: string;
  status?: string;
  groupName?: string;
  floorName?: string;
}

export const employeeService = {
  getEmployeesSimple: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyName?: string;
  }) => {
    const page = await fetchHrEmployeesPage({
      searchTerm: params?.searchTerm,
      companyId: params?.companyId,
      status: params?.status,
      pageSize: 200,
    });
    return page.items.map(mapHrListItemToSimple);
  },

  getEmployees: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyName?: string;
    joinDateFrom?: string;
    joinDateTo?: string;
    gender?: string;
    religion?: string;
    employeeId?: string;
  }) => {
    if (needsManpowerListApi(params)) {
      return employeeService.getManpower({
        departmentId: params?.departmentId,
        sectionId: params?.sectionId,
        designationId: params?.designationId,
        status: params?.status,
        searchTerm: params?.searchTerm ?? params?.employeeId,
        companyId: params?.companyId,
        joinDateFrom: params?.joinDateFrom,
        joinDateTo: params?.joinDateTo,
        gender: params?.gender,
      });
    }

    const page = await fetchHrEmployeesPage({
      searchTerm: params?.searchTerm ?? params?.employeeId,
      companyId: params?.companyId,
      departmentId: params?.departmentId,
      status: params?.status,
      pageSize: 200,
    });
    return page.items.map(mapHrListItemToEmployee);
  },

  getEmployeesMini: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    searchTerm?: string;
  }) => {
    const page = await fetchHrEmployeesPage({
      searchTerm: params?.searchTerm,
      pageSize: 200,
    });
    return page.items.map(mapHrListItemToMini);
  },

  getEmployee: async (employeeId: string, companyId: number) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    const response = await api.get<unknown>(
      `hr/Employees/${encodeURIComponent(id)}`,
    );
    return mapHrDetailsToEmployee(
      unwrapApiData<HrEmployeeDetails>(response.data),
    );
  },

  getEmployeeById: async (id: number) => {
    const page = await fetchHrEmployeesPage({ pageSize: 200 });
    const row = page.items.find(
      (employee) => stableIntFromGuid(employee.id) === id,
    );
    if (!row) throw new Error("Employee not found.");
    const response = await api.get<unknown>(
      `hr/Employees/${encodeURIComponent(row.id)}`,
    );
    return mapHrDetailsToEmployee(
      unwrapApiData<HrEmployeeDetails>(response.data),
    );
  },

  createEmployee: async (data: CreateEmployeeDto) => {
    const companyId =
      (await resolveCompanyGuid(data.companyId)) ?? (await firstCompanyGuid());
    if (!companyId)
      throw new Error("Please select a company before creating an employee.");
    const departmentId = await resolveDepartmentGuid(data.departmentId);
    const sectionId = data.sectionId
      ? await resolveSectionGuid(data.sectionId)
      : undefined;
    const designationId = await resolveDesignationGuid(data.designationId);
    if (!departmentId || !designationId) {
      throw new Error("Department and designation are required.");
    }
    if (!data.punchNumber || data.punchNumber <= 0) {
      throw new Error("Punch number (device badge) is required and must be a positive integer.");
    }
    const response = await api.post<unknown>("hr/Employees", {
      companyId,
      punchNumber: data.punchNumber,
      employeeID: data.employeeId || null,
      fullName: data.fullNameEn,
      banglaName: data.fullNameBn || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth || null,
      nationalId: data.nid || null,
      birthCertificateNo: null,
      phone: data.phoneNumber || null,
      email: data.email || null,
      joinDate: data.joinDate,
      employmentType: data.status === "Probation" ? "Probation" : "Permanent",
      departmentId,
      sectionId: sectionId || null,
      designationId,
      gradeId: null,
      basicSalary: data.basicSalary ?? 0,
      houseRent: data.houseRent ?? 0,
      medicalAllowance: data.medicalAllowance ?? 0,
      conveyanceAllowance: data.conveyance ?? 0,
      foodAllowance: data.foodAllowance ?? 0,
    });
    const createdId = unwrapApiData<string>(response.data);
    await syncEmployeeSubResources(createdId, data);
    return createdId;
  },

  updateEmployee: async (
    employeeId: string,
    data: UpdateEmployeeDto,
    companyId: number,
  ) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    await api.put(`hr/Employees/${encodeURIComponent(id)}`, {
      fullName: data.fullNameEn,
      banglaName: data.fullNameBn || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth || null,
      nationalId: data.nid || null,
      birthCertificateNo: null,
      phone: data.phoneNumber || null,
      email: data.email || null,
      joinDate: data.joinDate,
      employmentType: data.status === "Probation" ? "Probation" : "Permanent",
      status: data.status || (data.isActive ? "Active" : "Inactive"),
    });

    if (
      data.basicSalary !== undefined ||
      data.houseRent !== undefined ||
      data.medicalAllowance !== undefined ||
      data.conveyance !== undefined ||
      data.foodAllowance !== undefined
    ) {
      await employeeService.updateSalary(id, {
        basicSalary: data.basicSalary ?? 0,
        houseRent: data.houseRent ?? 0,
        medicalAllowance: data.medicalAllowance ?? 0,
        conveyanceAllowance: data.conveyance ?? 0,
        foodAllowance: data.foodAllowance ?? 0,
        effectiveFrom: new Date().toISOString(),
      });
    }

    await syncEmployeeSubResources(id, data);

    return { success: true };
  },

  deleteEmployee: async (employeeId: string, companyId: number) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    const response = await api.delete(`hr/Employees/${encodeURIComponent(id)}`);
    return unwrapApiData<string>(response.data);
  },

  searchEmployees: async (query: string) => {
    return employeeService.getEmployees({ searchTerm: query });
  },

  exportTemplate: async () => {
    const headers = [
      "Employee ID",
      "Full Name",
      "Email",
      "Phone",
      "Join Date",
      "Status",
    ];
    const url = window.URL.createObjectURL(
      new Blob([headers.join(",")], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Employee_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportDemo: async () => {
    const rows = [
      ["Employee ID", "Full Name", "Email", "Phone", "Join Date", "Status"],
      [
        "EMP-0001",
        "Sample Employee",
        "sample@erp.local",
        "",
        new Date().toISOString().slice(0, 10),
        "Active",
      ],
    ];
    const url = window.URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Employee_Demo_Data.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportEmployees: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyName?: string;
    joinDateFrom?: string;
    joinDateTo?: string;
    gender?: string;
    religion?: string;
    employeeId?: string;
  }) => {
    const rows = await employeeService.getEmployees(params);
    const header = [
      "Employee ID",
      "Full Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Join Date",
      "Status",
    ];
    const body = rows.map((e) =>
      [
        e.employeeId,
        e.fullNameEn,
        e.email ?? "",
        e.phoneNumber ?? "",
        e.departmentName ?? "",
        e.designationName ?? "",
        e.joinDate ? new Date(e.joinDate).toISOString().slice(0, 10) : "",
        e.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    const url = window.URL.createObjectURL(
      new Blob([[header.join(","), ...body].join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Employee_List_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  importExcel: async (
    file: File,
  ): Promise<{
    totalRows: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
    createdCount: number;
    updatedCount: number;
    errors: Array<{ rowNumber: number; field: string; message: string }>;
    warnings: Array<{ rowNumber: number; field: string; message: string }>;
  }> => {
    const { read, utils } = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      return {
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        warningCount: 0,
        createdCount: 0,
        updatedCount: 0,
        errors: [
          {
            rowNumber: 0,
            field: "file",
            message: "No worksheet found in file.",
          },
        ],
        warnings: [],
      };
    }

    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    const errors: Array<{ rowNumber: number; field: string; message: string }> =
      [];
    const warnings: Array<{
      rowNumber: number;
      field: string;
      message: string;
    }> = [];
    let createdCount = 0;

    const [companies, departments, designations] = await Promise.all([
      companyService.getAll(),
      organogramService.getDepartments(),
      organogramService.getDesignations(),
    ]);

    const pick = (row: Record<string, unknown>, keys: string[]) => {
      const normalized = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]),
      );
      for (const key of keys) {
        const val = normalized[key.toLowerCase()];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim();
        }
      }
      return "";
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = rows[i];
      const fullName = pick(row, [
        "full name",
        "fullname",
        "employee name",
        "name",
      ]);
      const employeeID = pick(row, [
        "employee id",
        "employeeid",
        "emp id",
      ]);
      const punchRaw = pick(row, ["punch number", "punchnumber", "badge", "card"]);
      const punchNumber = punchRaw ? parseInt(punchRaw, 10) : NaN;
      const departmentName = pick(row, ["department", "department name"]);
      const designationName = pick(row, ["designation", "designation name"]);
      const joinDateRaw = pick(row, ["join date", "joining date", "joindate"]);
      const statusRaw = pick(row, ["status", "employment status"]) || "Active";

      if (!fullName) {
        errors.push({
          rowNumber,
          field: "Full Name",
          message: "Full name is required.",
        });
        continue;
      }

      const department = departments.find(
        (d) => d.nameEn.toLowerCase() === departmentName.toLowerCase(),
      );
      const designation = designations.find(
        (d) => d.nameEn.toLowerCase() === designationName.toLowerCase(),
      );

      if (!department || !designation) {
        errors.push({
          rowNumber,
          field: "Department/Designation",
          message:
            "Department and designation must match organogram names exactly.",
        });
        continue;
      }

      const company =
        companies.find((c) => c.entityId === department.companyId) ??
        companies[0];
      if (!company?.entityId) {
        errors.push({
          rowNumber,
          field: "Company",
          message: "No company available for import.",
        });
        continue;
      }

      const joinDate = joinDateRaw
        ? new Date(joinDateRaw).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      if (Number.isNaN(Date.parse(joinDate))) {
        errors.push({
          rowNumber,
          field: "Join Date",
          message: "Invalid join date.",
        });
        continue;
      }

      try {
        if (!Number.isFinite(punchNumber) || punchNumber <= 0) {
          errors.push({
            rowNumber,
            field: "Punch Number",
            message: "Punch number (device badge) is required and must be a positive integer.",
          });
          continue;
        }

        await employeeService.createEmployee({
          employeeId: employeeID || undefined,
          punchNumber,
          fullNameEn: fullName,
          email: pick(row, ["email"]) || undefined,
          phoneNumber:
            pick(row, ["phone", "phone number", "mobile"]) || undefined,
          departmentId: department.id,
          designationId: designation.id,
          status: statusRaw,
          joinDate,
          companyId: company.id,
        });
        createdCount += 1;
      } catch (err) {
        errors.push({
          rowNumber,
          field: "Create",
          message:
            err instanceof Error ? err.message : "Failed to create employee.",
        });
      }
    }

    const successCount = createdCount;
    return {
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      warningCount: warnings.length,
      createdCount,
      updatedCount: 0,
      errors,
      warnings,
    };
  },

  uploadImage: async (
    file: File,
    type: "profile" | "signature" = "profile",
  ) => {
    const url = URL.createObjectURL(file);
    return { url, type };
  },

  transferEmployee: async (
    employeeId: string,
    data: {
      departmentId?: number;
      sectionId?: number;
      designationId?: number;
      gradeId?: string;
      supervisorId?: string;
      workLocation?: string;
      effectiveFrom: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/transfer`, {
      departmentId: data.departmentId
        ? await resolveDepartmentGuid(data.departmentId)
        : null,
      sectionId: data.sectionId
        ? await resolveSectionGuid(data.sectionId)
        : null,
      designationId: data.designationId
        ? await resolveDesignationGuid(data.designationId)
        : null,
      gradeId: data.gradeId || null,
      supervisorId: data.supervisorId || null,
      workLocation: data.workLocation || null,
      effectiveFrom: data.effectiveFrom,
    });
    return { success: true };
  },

  changeStatus: async (
    employeeId: string,
    data: {
      status: string;
      effectiveFrom: string;
      remarks?: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/status`, {
      status: data.status,
      effectiveFrom: data.effectiveFrom,
      remarks: data.remarks || null,
    });
    return { success: true };
  },

  updateSalary: async (
    employeeId: string,
    data: {
      basicSalary: number;
      houseRent: number;
      medicalAllowance: number;
      conveyanceAllowance: number;
      foodAllowance: number;
      effectiveFrom: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/salary`, {
      basicSalary: data.basicSalary,
      houseRent: data.houseRent,
      medicalAllowance: data.medicalAllowance,
      conveyanceAllowance: data.conveyanceAllowance,
      foodAllowance: data.foodAllowance,
      effectiveFrom: data.effectiveFrom,
    });
    return { success: true };
  },

  addAddress: async (
    employeeId: string,
    data: {
      addressType: string;
      country: string;
      division?: string;
      district?: string;
      upazila?: string;
      postOffice?: string;
      postalCode?: string;
      addressLine?: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/addresses`, data);
    return { success: true };
  },

  updateAddress: async (
    addressId: string,
    data: {
      addressType: string;
      country: string;
      division?: string;
      district?: string;
      upazila?: string;
      postOffice?: string;
      postalCode?: string;
      addressLine?: string;
    },
  ) => {
    await api.put(
      `hr/Employees/addresses/${encodeURIComponent(addressId)}`,
      data,
    );
    return { success: true };
  },

  deleteAddress: async (addressId: string) => {
    await api.delete(`hr/Employees/addresses/${encodeURIComponent(addressId)}`);
    return { success: true };
  },

  addBankAccount: async (
    employeeId: string,
    data: {
      bankName?: string;
      branchName?: string;
      accountNo?: string;
      routingNo?: string;
      mobileBankingType?: string;
      mobileBankingNo?: string;
      isPrimary: boolean;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/bank-accounts`, {
      bankName: data.bankName || null,
      branchName: data.branchName || null,
      accountNo: data.accountNo || null,
      routingNo: data.routingNo || null,
      mobileBankingType: data.mobileBankingType || null,
      mobileBankingNo: data.mobileBankingNo || null,
      isPrimary: data.isPrimary,
    });
    return { success: true };
  },

  updateBankAccount: async (
    accountId: string,
    data: {
      bankName?: string;
      branchName?: string;
      accountNo?: string;
      routingNo?: string;
      mobileBankingType?: string;
      mobileBankingNo?: string;
      isPrimary: boolean;
    },
  ) => {
    await api.put(
      `hr/Employees/bank-accounts/${encodeURIComponent(accountId)}`,
      data,
    );
    return { success: true };
  },

  deleteBankAccount: async (accountId: string) => {
    await api.delete(
      `hr/Employees/bank-accounts/${encodeURIComponent(accountId)}`,
    );
    return { success: true };
  },

  addEmergencyContact: async (
    employeeId: string,
    data: {
      contactName: string;
      relation?: string;
      phone: string;
      address?: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(
      `hr/Employees/${encodeURIComponent(id)}/emergency-contacts`,
      {
        contactName: data.contactName,
        relation: data.relation || null,
        phone: data.phone,
        address: data.address || null,
      },
    );
    return { success: true };
  },

  updateEmergencyContact: async (
    contactId: string,
    data: {
      contactName: string;
      relation?: string;
      phone: string;
      address?: string;
    },
  ) => {
    await api.put(
      `hr/Employees/emergency-contacts/${encodeURIComponent(contactId)}`,
      data,
    );
    return { success: true };
  },

  deleteEmergencyContact: async (contactId: string) => {
    await api.delete(
      `hr/Employees/emergency-contacts/${encodeURIComponent(contactId)}`,
    );
    return { success: true };
  },

  addDocument: async (
    employeeId: string,
    data: { documentType: string; fileUrl: string; companyId?: number },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/documents`, {
      documentType: data.documentType,
      fileUrl: data.fileUrl,
    });
    return { success: true };
  },

  deleteDocument: async (documentId: string) => {
    await api.delete(
      `hr/Employees/documents/${encodeURIComponent(documentId)}`,
    );
    return { success: true };
  },

  getManpower: async (params?: ManpowerFilterParams) => {
    const query = await buildManpowerQueryParams(params, { paging: true });
    const response = await api.get<unknown>("hr/Employees/manpower", {
      params: query,
    });
    const page = unwrapApiData<PagedResult<HrManpowerListItem>>(response.data);
    return (page.items ?? []).map(mapHrManpowerToEmployee);
  },

  getManpowerSummary: async (params?: ManpowerFilterParams) => {
    const query = await buildManpowerQueryParams(params, {
      paging: false,
      summary: true,
    });
    const response = await api.get<unknown>("hr/Employees/manpower/summary", {
      params: query,
    });
    const data = unwrapApiData<HrManpowerSummary>(response.data);
    return {
      totalEmployees: data.totalEmployees,
      activeEmployees: data.activeEmployees,
      onLeaveEmployees: data.onLeaveEmployees,
      inactiveEmployees: data.inactiveEmployees,
      departmentSummary: (data.departmentSummary ?? []).map(mapSummaryBucket),
      designationSummary: (data.designationSummary ?? []).map(mapSummaryBucket),
      genderSummary: (data.genderSummary ?? []).map(mapSummaryBucket),
      statusSummary: (data.statusSummary ?? []).map(mapSummaryBucket),
    };
  },
};
