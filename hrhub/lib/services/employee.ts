import api from "../api";
import { unwrapApiData } from "@/lib/api-response";
import type {
  HrEmployeeDetails,
  HrEmployeeListItem,
  HrManpowerListItem,
  HrManpowerSummary,
  HrPagedResult,
  HrStatusHistoryItem,
  HrTransferItem,
} from "@/lib/services/hr-types";
import { companyService } from "@/lib/services/company";
import {
  organogramService,
  resolveDepartmentGuid,
  resolveDesignationGuid,
  resolveSectionGuid,
} from "@/lib/services/organogram";

export type {
  HrEmployeeDetails,
  HrEmployeeAddress,
  HrEmployeeBankAccount,
  HrEmergencyContact,
  HrEmployeeDocument,
  HrStatusHistoryItem,
  HrTransferItem,
} from "@/lib/services/hr-types";

type PagedResult<T> = HrPagedResult<T>;

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

const HR_EMPLOYEE_ID_PATTERN = /^EMP-\d{4,}$/i;

/** HR API requires EMP-#### (4+ digits). Numeric-only values are normalized. */
export function normalizeHrEmployeeId(
  raw?: string | null,
): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  const upper = trimmed.toUpperCase();
  if (HR_EMPLOYEE_ID_PATTERN.test(upper)) return upper;

  if (/^\d+$/.test(trimmed)) {
    const digits = trimmed.replace(/^0+/, "") || "0";
    return digits.length < 4 ? `EMP-${digits.padStart(4, "0")}` : `EMP-${digits}`;
  }

  return trimmed;
}

export function isValidHrEmployeeId(raw?: string | null): boolean {
  const normalized = normalizeHrEmployeeId(raw);
  return !normalized || HR_EMPLOYEE_ID_PATTERN.test(normalized);
}

async function listCompaniesForResolve() {
  try {
    return await companyService.getMine();
  } catch {
    return await companyService.getAll();
  }
}

async function resolveCompanyGuid(
  companyId?: number,
): Promise<string | undefined> {
  if (!companyId) return undefined;
  const companies = await listCompaniesForResolve();
  return companies.find((c) => c.id === companyId)?.entityId;
}

async function firstCompanyGuid(): Promise<string | undefined> {
  return (await listCompaniesForResolve())[0]?.entityId;
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

type EmployeeAddressEntityId = string | number;

async function fetchHrEmployeeDetails(
  entityId: string,
): Promise<HrEmployeeDetails> {
  const response = await api.get<unknown>(
    `hr/Employees/${encodeURIComponent(entityId)}`,
  );
  const data = unwrapApiData<HrEmployeeDetails>(response.data);
  return {
    ...data,
    addresses: data.addresses ?? [],
    bankAccounts: data.bankAccounts ?? [],
    emergencyContacts: data.emergencyContacts ?? [],
    documents: data.documents ?? [],
  };
}

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
    presentAddress:
      row.addresses?.find((a) => a.addressType === "Present")?.addressLine ??
      undefined,
    permanentAddress:
      row.addresses?.find((a) => a.addressType === "Permanent")?.addressLine ??
      undefined,
    bankName: row.bankAccounts?.find((b) => b.isPrimary)?.bankName ?? undefined,
    bankBranchName:
      row.bankAccounts?.find((b) => b.isPrimary)?.branchName ?? undefined,
    bankAccountNo:
      row.bankAccounts?.find((b) => b.isPrimary)?.accountNo ?? undefined,
    bankRoutingNo:
      row.bankAccounts?.find((b) => b.isPrimary)?.routingNo ?? undefined,
    emergencyContactName: row.emergencyContacts?.[0]?.contactName,
    emergencyContactRelation: row.emergencyContacts?.[0]?.relation ?? undefined,
    emergencyContactPhone: row.emergencyContacts?.[0]?.phone,
    emergencyContactAddress: row.emergencyContacts?.[0]?.address ?? undefined,
    documents: row.documents ?? [],
  };
}

async function upsertAddress(
  employeeId: string,
  existing: HrEmployeeDetails["addresses"],
  addressType: "Present" | "Permanent",
  payload: {
    country: string;
    division?: string;
    district?: string;
    upazila?: string;
    postOffice?: string;
    postalCode?: string;
    addressLine?: string;
  },
  companyId?: number,
) {
  const hasData =
    payload.addressLine ||
    payload.division ||
    payload.district ||
    payload.upazila ||
    payload.postOffice ||
    payload.postalCode;

  const row = existing.find(
    (a) => a.addressType.toLowerCase() === addressType.toLowerCase(),
  );
  if (!hasData) {
    if (row) await employeeService.deleteAddress(row.id);
    return;
  }

  const body = { addressType, ...payload };
  if (row) {
    await employeeService.updateAddress(row.id, body);
  } else {
    await employeeService.addAddress(employeeId, { ...body, companyId });
  }
}

async function syncEmployeeSubResources(
  employeeId: string,
  data: CreateEmployeeDto,
  existing?: HrEmployeeDetails,
) {
  const details = existing ?? (await fetchHrEmployeeDetails(employeeId));

  await upsertAddress(
    employeeId,
    details.addresses,
    "Present",
    {
      country: "Bangladesh",
      postalCode: data.presentPostalCode,
      addressLine: data.presentAddress,
    },
    data.companyId,
  );

  await upsertAddress(
    employeeId,
    details.addresses,
    "Permanent",
    {
      country: "Bangladesh",
      postalCode: data.permanentPostalCode,
      addressLine: data.permanentAddress,
    },
    data.companyId,
  );

  const hasBank =
    data.bankName ||
    data.bankAccountNo ||
    data.bankBranchName ||
    data.bankRoutingNo;
  const primary =
    details.bankAccounts.find((b) => b.isPrimary) ?? details.bankAccounts[0];
  if (!hasBank) {
    if (primary) await employeeService.deleteBankAccount(primary.id);
  } else {
    const bankBody = {
      bankName: data.bankName,
      branchName: data.bankBranchName,
      accountNo: data.bankAccountNo,
      routingNo: data.bankRoutingNo,
      mobileBankingType: data.bankAccountType,
      mobileBankingNo: undefined as string | undefined,
      isPrimary: true,
    };
    if (primary) {
      await employeeService.updateBankAccount(primary.id, bankBody);
    } else {
      await employeeService.addBankAccount(employeeId, {
        ...bankBody,
        companyId: data.companyId,
      });
    }
  }

  const hasEmergency = data.emergencyContactName || data.emergencyContactPhone;
  const contact = details.emergencyContacts[0];
  if (!hasEmergency) {
    if (contact) await employeeService.deleteEmergencyContact(contact.id);
  } else {
    const contactBody = {
      contactName: data.emergencyContactName || "Emergency Contact",
      relation: data.emergencyContactRelation,
      phone: data.emergencyContactPhone || "",
      address: data.emergencyContactAddress,
    };
    if (contact) {
      await employeeService.updateEmergencyContact(contact.id, contactBody);
    } else {
      await employeeService.addEmergencyContact(employeeId, {
        ...contactBody,
        companyId: data.companyId,
      });
    }
  }
}

function needsManpowerListApi(params?: {
  sectionId?: number;
  designationId?: number;
  gender?: string;
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
  documents?: import("@/lib/services/hr-types").HrEmployeeDocument[];
}

/** Fields aligned with HR Service create + sub-resource APIs. */
export interface CreateEmployeeDto {
  employeeId?: string;
  punchNumber?: number;
  fullNameEn: string;
  fullNameBn?: string;
  nid?: string;
  dateOfBirth?: string;
  gender?: string;
  departmentId: number;
  sectionId?: number;
  designationId: number;
  status: string;
  joinDate: string;
  email?: string;
  phoneNumber?: string;
  presentAddress?: string;
  presentPostalCode?: string;
  permanentAddress?: string;
  permanentPostalCode?: string;
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyance?: number;
  foodAllowance?: number;
  bankName?: string;
  bankBranchName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
  bankAccountType?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  companyId?: number;
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
  status?: string;
  searchTerm?: string;
  companyId?: number;
  joinDateFrom?: string;
  joinDateTo?: string;
  gender?: string;
};

function mapSummaryBucket(row: HrManpowerSummary["departmentSummary"][number]): SummaryItem {
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
  isOtEnabled?: boolean;
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

  getEmployeeDetails: async (employeeId: string, companyId?: number) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    return fetchHrEmployeeDetails(id);
  },

  getEmployee: async (employeeId: string, companyId: number) => {
    const details = await employeeService.getEmployeeDetails(employeeId, companyId);
    return mapHrDetailsToEmployee(details);
  },

  getEmployeeById: async (id: number) => {
    const page = await fetchHrEmployeesPage({ pageSize: 200 });
    const row = page.items.find(
      (employee) => stableIntFromGuid(employee.id) === id,
    );
    if (!row) throw new Error("Employee not found.");
    return mapHrDetailsToEmployee(await fetchHrEmployeeDetails(row.id));
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
    const employeeID = normalizeHrEmployeeId(data.employeeId);
    if (employeeID && !HR_EMPLOYEE_ID_PATTERN.test(employeeID)) {
      throw new Error(
        "Employee ID must match EMP-#### (e.g. EMP-0001) or leave empty to auto-generate.",
      );
    }
    const response = await api.post<unknown>("hr/Employees", {
      companyId,
      punchNumber: data.punchNumber,
      employeeID: employeeID ?? null,
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

    const existing = await fetchHrEmployeeDetails(id);
    await syncEmployeeSubResources(id, data, existing);

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

  transferEmployee: async (
    employeeId: string,
    data: {
      departmentId?: number;
      sectionId?: number;
      designationId?: number;
      gradeId?: string;
      supervisorId?: string;
      workLocation?: string;
      reason?: string;
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
      reason: data.reason || null,
      effectiveFrom: data.effectiveFrom,
    });
    return { success: true };
  },

  getStatusHistory: async (employeeId: string, companyId?: number) => {
    const id = await resolveEmployeeGuid(employeeId, companyId);
    const response = await api.get<unknown>(
      `hr/Employees/${encodeURIComponent(id)}/status-history`,
    );
    return unwrapApiData<HrStatusHistoryItem[]>(response.data) ?? [];
  },

  getEmployeeTransfers: async (employeeId: string, companyId?: number) => {
    const id = await resolveEmployeeGuid(employeeId, companyId);
    const response = await api.get<unknown>(
      `hr/Employees/${encodeURIComponent(id)}/transfers`,
    );
    return unwrapApiData<HrTransferItem[]>(response.data) ?? [];
  },

  listTransfers: async (params?: {
    companyId?: number;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const companyGuid = params?.companyId
      ? (await companyService.getAll()).find((c) => c.id === params.companyId)
          ?.entityId
      : undefined;
    const response = await api.get<unknown>("hr/Employees/transfers", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 200,
        companyId: companyGuid,
        employeeId: params?.employeeId,
        fromDate: params?.fromDate,
        toDate: params?.toDate,
      },
    });
    return unwrapApiData<PagedResult<HrTransferItem>>(response.data);
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
    const data = unwrapApiData<HrManpowerSummary>(response.data) as HrManpowerSummary;
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
