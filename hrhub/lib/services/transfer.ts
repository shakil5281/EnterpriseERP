import { employeeService } from "@/lib/services/employee";
import { organogramService } from "@/lib/services/organogram";

const TRANSFER_CACHE_KEY = "hr-transfer-history";

export interface Transfer {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  fromDepartmentId?: number;
  fromDepartmentName?: string;
  fromDesignationId?: number;
  fromDesignationName?: string;
  toDepartmentId: number;
  toDepartmentName?: string;
  toDesignationId: number;
  toDesignationName?: string;
  transferDate: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface CreateTransferDto {
  employeeId: number;
  toDepartmentId: number;
  toDesignationId: number;
  transferDate: string;
  reason: string;
}

function readTransferCache(): Transfer[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(TRANSFER_CACHE_KEY) || "[]",
    ) as Transfer[];
  } catch {
    return [];
  }
}

function writeTransferCache(rows: Transfer[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TRANSFER_CACHE_KEY, JSON.stringify(rows));
  }
}

export const transferService = {
  getTransfers: async () => {
    return readTransferCache();
  },

  createTransfer: async (data: CreateTransferDto) => {
    const employees = await employeeService.getEmployees({ status: "Active" });
    const employee = employees.find((e) => e.id === data.employeeId);
    if (!employee) throw new Error("Employee not found.");

    const companyId = employee.companyId ?? 0;
    const profile = companyId
      ? await employeeService.getEmployee(employee.employeeId, companyId)
      : employee;

    await employeeService.transferEmployee(employee.employeeId, {
      departmentId: data.toDepartmentId,
      designationId: data.toDesignationId,
      effectiveFrom: data.transferDate,
      workLocation: data.reason || undefined,
      companyId: employee.companyId,
    });

    const [departments, designations] = await Promise.all([
      organogramService.getDepartments(),
      organogramService.getDesignations({ departmentId: data.toDepartmentId }),
    ]);
    const toDepartment = departments.find((d) => d.id === data.toDepartmentId);
    const toDesignation = designations.find(
      (d) => d.id === data.toDesignationId,
    );
    const row: Transfer = {
      id: Date.now(),
      employeeId: data.employeeId,
      employeeName: profile.fullNameEn,
      employeeCode: profile.employeeId,
      fromDepartmentId: profile.departmentId,
      fromDepartmentName: profile.departmentName,
      fromDesignationId: profile.designationId,
      fromDesignationName: profile.designationName,
      toDepartmentId: data.toDepartmentId,
      toDepartmentName: toDepartment?.nameEn,
      toDesignationId: data.toDesignationId,
      toDesignationName: toDesignation?.nameEn,
      transferDate: data.transferDate,
      reason: data.reason,
      status: "Approved",
      createdAt: new Date().toISOString(),
    };
    writeTransferCache([row, ...readTransferCache()]);
    return row;
  },

  updateStatus: async (id: number, status: string, adminRemark?: string) => {
    void adminRemark;
    const rows = readTransferCache().map((row) =>
      row.id === id ? { ...row, status } : row,
    );
    writeTransferCache(rows);
    return { success: true };
  },

  deleteTransfer: async (id: number) => {
    writeTransferCache(readTransferCache().filter((row) => row.id !== id));
  },
};
