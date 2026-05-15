import api from '../api';
import { unwrapApiData } from '@/lib/api-response';

/** HR service `EmployeeListItemDto` (camelCase JSON). */
interface HrEmployeeListItem {
    id: string;
    employeeCode: string;
    fullName: string;
    email?: string | null;
    companyId: number;
    status: string;
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
    return Number.isFinite(n) ? (n | 0) : 0;
}

function mapHrListItemToEmployee(row: HrEmployeeListItem): Employee {
    return {
        id: stableIntFromGuid(row.id),
        employeeId: row.employeeCode,
        fullNameEn: row.fullName,
        departmentId: 0,
        designationId: 0,
        status: row.status,
        joinDate: "",
        isActive: true,
        isOtEnabled: false,
        createdAt: "",
        companyId: row.companyId,
        email: row.email ?? undefined,
    };
}

function mapHrListItemToSimple(row: HrEmployeeListItem): EmployeeSimple {
    return {
        id: stableIntFromGuid(row.id),
        employeeId: row.employeeCode,
        fullNameEn: row.fullName,
        companyId: row.companyId,
        status: row.status,
    };
}

function mapHrListItemToMini(row: HrEmployeeListItem): EmployeeMini {
    return {
        id: stableIntFromGuid(row.id),
        employeeId: row.employeeCode,
        fullNameEn: row.fullName,
    };
}

async function fetchHrEmployeesPage(params?: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    companyId?: number;
    status?: string;
}): Promise<PagedResult<HrEmployeeListItem>> {
    const response = await api.get("hr/Employees", {
        params: {
            page: params?.page ?? 1,
            pageSize: Math.min(params?.pageSize ?? 200, 200),
            search: params?.searchTerm,
            companyId: params?.companyId,
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
    employeeId: string;
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
    presentDivisionId?: number;
    presentDistrictId?: number;
    presentThanaId?: number;
    presentPostOfficeId?: number;
    presentPostalCode?: string;

    permanentAddress?: string;
    permanentAddressBn?: string;
    permanentDivisionId?: number;
    permanentDistrictId?: number;
    permanentThanaId?: number;
    permanentPostOfficeId?: number;
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
    companyName?: string;
    bloodGroup?: string;

    isActive: boolean;
    isOtEnabled: boolean;
    createdAt: string;
}

export interface CreateEmployeeDto {
    employeeId?: string;
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
    presentDivisionId?: number;
    presentDistrictId?: number;
    presentThanaId?: number;
    presentPostOfficeId?: number;
    presentPostalCode?: string;

    permanentAddress?: string;
    permanentAddressBn?: string;
    permanentDivisionId?: number;
    permanentDistrictId?: number;
    permanentThanaId?: number;
    permanentPostOfficeId?: number;
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

export interface UpdateEmployeeDto extends CreateEmployeeDto {
    isActive: boolean;
    isOtEnabled: boolean;
}

export interface EmployeeMini {
    id: number;
    employeeId: string;
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
    employeeId: string;
    fullNameEn: string;
    companyId?: number;
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
        const page = await fetchHrEmployeesPage({
            searchTerm: params?.searchTerm ?? params?.employeeId,
            companyId: params?.companyId,
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
        const response = await api.get<Employee>(`/employee/${employeeId}`, {
            params: { companyId }
        });
        return response.data;
    },

    getEmployeeById: async (id: number) => {
        const response = await api.get<Employee>(`/employee/by-id/${id}`);
        return response.data;
    },

    createEmployee: async (data: CreateEmployeeDto) => {
        const response = await api.post<Employee>('/employee', data);
        return response.data;
    },

    updateEmployee: async (employeeId: string, data: UpdateEmployeeDto, companyId: number) => {
        const response = await api.put(`/employee/${employeeId}`, data, {
            params: { companyId }
        });
        return response.data;
    },

    deleteEmployee: async (employeeId: string, companyId: number) => {
        const response = await api.delete(`/employee/${employeeId}`, {
            params: { companyId }
        });
        return response.data;
    },

    searchEmployees: async (query: string) => {
        const response = await api.get<Employee[]>('/employee/search', {
            params: { query }
        });
        return response.data;
    },

    exportTemplate: async () => {
        const response = await api.get('/employee/export-template', {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Employee_Template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    exportDemo: async () => {
        const response = await api.get('/employee/export-demo', {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Employee_Demo_Data.xlsx');
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
        const response = await api.get('/employee/export', {
            params,
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Employee_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    importExcel: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/employee/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    uploadImage: async (file: File, type: 'profile' | 'signature' = 'profile') => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ url: string }>(`/employee/upload-image?type=${type}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getManpower: async (params?: {
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
    }) => {
        const response = await api.get<Employee[]>('/manpower', { params });
        return response.data;
    },

    getManpowerSummary: async (params?: {
        departmentId?: number;
        sectionId?: number;
        designationId?: number;
        lineId?: number;
        shiftId?: number;
        groupId?: number;
        floorId?: number;
        status?: string;
        companyId?: number;
        companyName?: string;
        joinDateFrom?: string;
        joinDateTo?: string;
        gender?: string;
        religion?: string;
    }) => {
        const response = await api.get<ManpowerSummary>('/manpower/summary', { params });
        return response.data;
    },
};

