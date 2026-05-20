"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { IconFilter, IconLoader, IconUserExclamation } from "@tabler/icons-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { HrPageHeader } from "@/components/hr/hr-page-header";
import { StatusChangeSheet } from "@/components/hr/status-change-sheet";
import { employeeService, type Employee } from "@/lib/services/employee";
import { companyService, type Company } from "@/lib/services/company";
import { toast } from "sonner";

const STATUS_FILTER = ["all", "Active", "Inactive", "On Leave", "Resigned", "Terminated"];

export default function EmployeeStatusPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [companyId, setCompanyId] = React.useState<string>("all");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Employee | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (companyId !== "all") params.companyId = parseInt(companyId, 10);
      const data = await employeeService.getEmployees(params);
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, companyId]);

  React.useEffect(() => {
    companyService.getAll().then(setCompanies);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employeeId",
      header: "ID",
    },
    {
      accessorKey: "fullNameEn",
      header: "Name",
    },
    {
      accessorKey: "departmentName",
      header: "Department",
    },
    {
      accessorKey: "designationName",
      header: "Designation",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.status}</Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelected(row.original);
            setSheetOpen(true);
          }}
        >
          Change status
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <HrPageHeader
        title="Employee status"
        description="Manage lifecycle status using HR service (separation, inactive, leave)."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconFilter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Company</Label>
            <NativeSelect
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="all">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.companyNameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTER.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-end">
            <Button onClick={load} className="w-full sm:w-auto">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUserExclamation className="h-5 w-5" />
            Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <IconLoader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable columns={columns} data={employees} />
          )}
        </CardContent>
      </Card>

      {selected?.entityId ? (
        <StatusChangeSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          employeeId={selected.entityId}
          employeeName={selected.fullNameEn}
          companyId={selected.companyId}
          onSuccess={load}
        />
      ) : null}
    </div>
  );
}
