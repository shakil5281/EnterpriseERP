"use client";

import * as React from "react";
import { format, eachDayOfInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  IconCalendarStats,
  IconEdit,
  IconFilter,
  IconLoader2,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { companyService, Company } from "@/lib/services/company";
import { employeeService, type Employee, type EmployeeSimple } from "@/lib/services/employee";
import {
  organogramService,
  type Department,
  type Designation,
  type Group,
  type Line,
  type Section,
} from "@/lib/services/organogram";
import { shiftService, Shift, TemporaryShiftAssignment } from "@/lib/services/shift";

type EmployeeRow = Omit<EmployeeSimple, "id"> & { id: string };
type OrganogramFilter = "All" | number;

function employeeToRow(e: Employee): EmployeeRow | null {
  if (!e.entityId) return null;
  return {
    id: e.entityId,
    entityId: e.entityId,
    employeeId: e.employeeId,
    fullNameEn: e.fullNameEn,
    punchNumber: e.punchNumber,
    departmentName: e.departmentName,
    sectionName: e.sectionName,
    designationName: e.designationName,
    lineName: e.lineName,
    groupName: e.groupName,
    companyId: e.companyId,
    status: e.status,
  };
}

function defaultRange(): DateRange {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function rangeToIso(range?: DateRange): { from: string; to: string } {
  const from = range?.from ?? new Date();
  const to = range?.to ?? range?.from ?? new Date();
  return { from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") };
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export default function TemporaryShiftPage() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = React.useState("");
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [filterRange, setFilterRange] = React.useState<DateRange | undefined>(defaultRange);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [employeeIdFilter, setEmployeeIdFilter] = React.useState("");
  const [filterShiftId, setFilterShiftId] = React.useState("");
  const [applyReason, setApplyReason] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState<OrganogramFilter>("All");
  const [sectionFilter, setSectionFilter] = React.useState<OrganogramFilter>("All");
  const [designationFilter, setDesignationFilter] = React.useState<OrganogramFilter>("All");
  const [lineFilter, setLineFilter] = React.useState<OrganogramFilter>("All");
  const [groupFilter, setGroupFilter] = React.useState<OrganogramFilter>("All");

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [designations, setDesignations] = React.useState<Designation[]>([]);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);

  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [selectedEmployees, setSelectedEmployees] = React.useState<EmployeeRow[]>([]);
  const [assignments, setAssignments] = React.useState<TemporaryShiftAssignment[]>([]);

  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [loadingAssignments, setLoadingAssignments] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const canSeeAllCompanies = hasRole("SuperAdmin") || hasRole("Admin");

  const selectedCompanyRow = React.useMemo(
    () => companies.find((c) => c.entityId === selectedCompany),
    [companies, selectedCompany],
  );

  const { from: fromDate, to: toDate } = rangeToIso(filterRange);

  React.useEffect(() => {
    if (authLoading || !user) return;
    companyService.getAll().then((list) => {
      const allowed = canSeeAllCompanies
        ? list
        : list.filter((c) => user.assignedCompanyIds?.includes(c.entityId));
      setCompanies(allowed);
      setSelectedCompany((current) => current || allowed[0]?.entityId || "");
    });
  }, [authLoading, canSeeAllCompanies, user]);

  const loadShifts = React.useCallback(async () => {
    if (!selectedCompany) {
      setShifts([]);
      return;
    }
    const list = await shiftService.getShifts({ companyId: selectedCompany });
    setShifts(list);
    setFilterShiftId((current) => current || list[0]?.id || "");
  }, [selectedCompany]);

  React.useEffect(() => {
    loadShifts().catch(() => toast.error("Failed to load shifts"));
  }, [loadShifts]);

  const resetOrganogramFilters = React.useCallback(() => {
    setDeptFilter("All");
    setSectionFilter("All");
    setDesignationFilter("All");
    setLineFilter("All");
    setGroupFilter("All");
  }, []);

  React.useEffect(() => {
    if (!selectedCompanyRow?.id) {
      setDepartments([]);
      resetOrganogramFilters();
      return;
    }
    organogramService
      .getDepartments({ companyId: selectedCompanyRow.id })
      .then(setDepartments)
      .catch(() => setDepartments([]));
    organogramService
      .getGroups({ companyId: selectedCompanyRow.id })
      .then(setGroups)
      .catch(() => setGroups([]));
    resetOrganogramFilters();
  }, [selectedCompanyRow?.id, resetOrganogramFilters]);

  React.useEffect(() => {
    if (deptFilter === "All") {
      setSections([]);
      setSectionFilter("All");
      return;
    }
    organogramService.getSections({ departmentId: deptFilter }).then(setSections).catch(() => setSections([]));
    setSectionFilter("All");
    setDesignationFilter("All");
    setLineFilter("All");
  }, [deptFilter]);

  React.useEffect(() => {
    if (sectionFilter === "All") {
      setDesignations([]);
      setLines([]);
      setDesignationFilter("All");
      setLineFilter("All");
      return;
    }
    organogramService
      .getDesignations({ sectionId: sectionFilter })
      .then(setDesignations)
      .catch(() => setDesignations([]));
    organogramService
      .getLines({ sectionId: sectionFilter })
      .then(setLines)
      .catch(() => setLines([]));
    setDesignationFilter("All");
    setLineFilter("All");
  }, [sectionFilter]);

  const loadAssignments = React.useCallback(async () => {
    if (!selectedCompany) {
      setAssignments([]);
      return;
    }
    try {
      setLoadingAssignments(true);
      const list = await shiftService.listTemporaryShifts({
        companyId: selectedCompany,
        fromDate,
        toDate,
      });
      setAssignments(list);
    } catch {
      toast.error("Failed to load temporary shift records");
    } finally {
      setLoadingAssignments(false);
    }
  }, [selectedCompany, fromDate, toDate]);

  const applyFilter = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!selectedCompany) {
        if (!opts?.silent) toast.error("Select a company");
        return;
      }
      const combinedSearch = [employeeIdFilter.trim(), searchTerm.trim()]
        .filter(Boolean)
        .join(" ")
        .trim();

      try {
        setLoadingEmployees(true);
        const list = await employeeService.getEmployees({
          searchTerm: combinedSearch || undefined,
          companyId: selectedCompanyRow?.id,
          status: "Active",
          departmentId: deptFilter === "All" ? undefined : deptFilter,
          sectionId: sectionFilter === "All" ? undefined : sectionFilter,
          designationId: designationFilter === "All" ? undefined : designationFilter,
        });

        let rows = list.map(employeeToRow).filter((r): r is EmployeeRow => r !== null);

        if (lineFilter !== "All") {
          rows = rows.filter((e) => {
            const emp = list.find((x) => x.entityId === e.entityId);
            return emp?.lineId === lineFilter;
          });
        }
        if (groupFilter !== "All") {
          rows = rows.filter((e) => {
            const emp = list.find((x) => x.entityId === e.entityId);
            return emp?.groupId === groupFilter;
          });
        }

        if (employeeIdFilter.trim()) {
          const needle = employeeIdFilter.trim().toLowerCase();
          const narrowed = rows.filter(
            (e) =>
              e.employeeId.toLowerCase().includes(needle) ||
              String(e.punchNumber ?? "").includes(needle),
          );
          setEmployees(narrowed.length > 0 ? narrowed : rows);
        } else {
          setEmployees(rows);
        }

        await loadAssignments();
        if (!opts?.silent) {
          toast.success(
            combinedSearch
              ? `Found ${rows.length} employee(s)`
              : `Showing ${rows.length} active employee(s)`,
          );
        }
      } catch {
        if (!opts?.silent) toast.error("Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    },
    [
      deptFilter,
      designationFilter,
      employeeIdFilter,
      groupFilter,
      lineFilter,
      loadAssignments,
      searchTerm,
      sectionFilter,
      selectedCompany,
      selectedCompanyRow?.id,
    ],
  );

  React.useEffect(() => {
    if (!selectedCompany || authLoading) return;
    void applyFilter({ silent: true });
    // Only reload employee list when company changes, not when filter fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [selectedCompany, authLoading]);

  const applyShiftToSelected = async () => {
    if (!selectedCompany || !filterShiftId) {
      toast.error("Select company and shift");
      return;
    }
    if (!filterRange?.from) {
      toast.error("Select from and to dates");
      return;
    }
    if (selectedEmployees.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    const start = filterRange.from;
    const end = filterRange.to ?? filterRange.from;
    const days = eachDayOfInterval({ start, end });

    setApplying(true);
    let ok = 0;
    let fail = 0;

    try {
      for (const day of days) {
        const shiftDate = format(day, "yyyy-MM-dd");
        for (const emp of selectedEmployees) {
          if (!emp.entityId) continue;
          try {
            await shiftService.assignTemporaryShift({
              companyId: selectedCompany,
              employeeId: emp.entityId,
              shiftId: filterShiftId,
              shiftDate,
              reason: applyReason.trim() || null,
            });
            ok++;
          } catch {
            fail++;
          }
        }
      }

      if (fail === 0) {
        toast.success(`Temporary shift applied (${ok} assignment(s))`);
      } else {
        toast.warning(`Completed with ${ok} success, ${fail} failed`);
      }
      await loadAssignments();
    } finally {
      setApplying(false);
    }
  };

  const editRow = (row: TemporaryShiftAssignment) => {
    setEditingId(row.id);
    setFilterShiftId(row.shiftId);
    setApplyReason(row.reason || "");
    setEmployeeIdFilter(row.employeeId);
    toast.info("Update single row from the list below or re-apply via bulk apply");
  };

  const updateAssignment = async (row: TemporaryShiftAssignment) => {
    if (!selectedCompany) return;
    try {
      await shiftService.updateTemporaryShift(row.id, {
        id: row.id,
        companyId: selectedCompany,
        employeeId: row.employeeId,
        shiftId: filterShiftId || row.shiftId,
        shiftDate: toDateInput(row.shiftDate),
        reason: applyReason || null,
      });
      toast.success("Temporary shift updated");
      setEditingId(null);
      loadAssignments();
    } catch {
      toast.error("Failed to update");
    }
  };

  const remove = async (id: string) => {
    try {
      await shiftService.deleteTemporaryShift(id);
      toast.success("Temporary shift removed");
      loadAssignments();
    } catch {
      toast.error("Failed to remove");
    }
  };

  const employeeColumns: ColumnDef<EmployeeRow>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">{row.original.employeeId}</span>
      ),
    },
    {
      accessorKey: "fullNameEn",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.fullNameEn}</span>,
    },
    {
      accessorKey: "departmentName",
      header: "Department",
      cell: ({ row }) => row.original.departmentName || "—",
    },
    {
      accessorKey: "sectionName",
      header: "Section",
      cell: ({ row }) => row.original.sectionName || "—",
    },
    {
      accessorKey: "designationName",
      header: "Designation",
      cell: ({ row }) => row.original.designationName || "—",
    },
    {
      accessorKey: "lineName",
      header: "Line",
      cell: ({ row }) => row.original.lineName || "—",
    },
    {
      accessorKey: "groupName",
      header: "Group",
      cell: ({ row }) => row.original.groupName || "—",
    },
    {
      accessorKey: "punchNumber",
      header: "Punch",
      cell: ({ row }) => row.original.punchNumber ?? "—",
    },
  ];

  const employeeCodeByEntityId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) {
      if (e.entityId) map.set(e.entityId, e.employeeId);
    }
    return map;
  }, [employees]);

  const assignmentColumns: ColumnDef<TemporaryShiftAssignment & { id: string }>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "shiftDate",
      header: "Date",
      cell: ({ row }) => toDateInput(row.original.shiftDate),
    },
    {
      id: "employeeCode",
      header: "Employee ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">
          {employeeCodeByEntityId.get(row.original.employeeId) ?? row.original.employeeId}
        </span>
      ),
    },
    {
      accessorKey: "shiftName",
      header: "Shift",
      cell: ({ row }) => row.original.shiftName,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => row.original.reason || "—",
    },
    {
      id: "status",
      header: "Type",
      cell: () => <Badge variant="outline">Temporary</Badge>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" data-no-row-click="true">
          <Button variant="ghost" size="icon" onClick={() => editRow(row.original)}>
            <IconEdit className="size-4" />
          </Button>
          {editingId === row.original.id && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => updateAssignment(row.original)}
            >
              Save
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => remove(row.original.id)}>
            <IconTrash className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const assignmentRows = assignments.map((a) => ({ ...a, id: a.id }));

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <IconCalendarStats className="size-6 text-primary" />
          <h1 className="text-2xl font-bold">Temporary Shift</h1>
        </div>
        <p className="text-muted-foreground">
          Filter employees, select multiple rows, and apply a shift across a date range. Uses shadcn
          calendar pickers for dates.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <IconFilter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Advanced filter</CardTitle>
          </div>
          <CardDescription>
            Leave search empty and click Apply Filter to load all active employees for the company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Company
              </Label>
              <NativeSelect
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  resetOrganogramFilters();
                }}
                className="h-10 bg-background"
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.entityId} value={c.entityId}>
                    {c.companyNameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Search
              </Label>
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Name, punch, keyword…"
                  className="h-10 pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Employee ID
              </Label>
              <Input
                placeholder="e.g. EMP-0001"
                className="h-10 bg-background font-mono text-sm"
                value={employeeIdFilter}
                onChange={(e) => setEmployeeIdFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Department
              </Label>
              <NativeSelect
                value={deptFilter.toString()}
                onChange={(e) =>
                  setDeptFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10 bg-background"
                disabled={!selectedCompany}
              >
                <option value="All">All departments</option>
                {departments.map((d) => (
                  <option key={d.entityId} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Section
              </Label>
              <NativeSelect
                value={sectionFilter.toString()}
                onChange={(e) =>
                  setSectionFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10 bg-background"
                disabled={deptFilter === "All"}
              >
                <option value="All">All sections</option>
                {sections.map((s) => (
                  <option key={s.entityId} value={s.id}>
                    {s.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Designation
              </Label>
              <NativeSelect
                value={designationFilter.toString()}
                onChange={(e) =>
                  setDesignationFilter(
                    e.target.value === "All" ? "All" : parseInt(e.target.value, 10),
                  )
                }
                className="h-10 bg-background"
                disabled={sectionFilter === "All"}
              >
                <option value="All">All designations</option>
                {designations.map((d) => (
                  <option key={d.entityId} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Line</Label>
              <NativeSelect
                value={lineFilter.toString()}
                onChange={(e) =>
                  setLineFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10 bg-background"
                disabled={sectionFilter === "All"}
              >
                <option value="All">All lines</option>
                {lines.map((l) => (
                  <option key={l.entityId} value={l.id}>
                    {l.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Group</Label>
              <NativeSelect
                value={groupFilter.toString()}
                onChange={(e) =>
                  setGroupFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10 bg-background"
                disabled={!selectedCompany}
              >
                <option value="All">All groups</option>
                {groups.map((g) => (
                  <option key={g.entityId} value={g.id}>
                    {g.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Shift to apply
              </Label>
              <NativeSelect
                value={filterShiftId}
                onChange={(e) => setFilterShiftId(e.target.value)}
                className="h-10 bg-background"
              >
                <option value="">Select shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                From — To (calendar)
              </Label>
              <DateRangePicker
                date={filterRange}
                setDate={setFilterRange}
                className="w-full"
                placeholder="Select date range"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Reason (optional)
              </Label>
              <Input
                placeholder="Bulk apply reason"
                className="h-10 bg-background"
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => void applyFilter()}
              disabled={loadingEmployees || !selectedCompany}
            >
              {loadingEmployees ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconFilter className="size-4" />
              )}
              Apply filter
            </Button>
            <Button
              className="gap-2"
              onClick={applyShiftToSelected}
              disabled={
                applying ||
                !selectedCompany ||
                !filterShiftId ||
                selectedEmployees.length === 0
              }
            >
              {applying ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconUsers className="size-4" />
              )}
              Apply shift
              {selectedEmployees.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedEmployees.length}
                </Badge>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {fromDate} → {toDate}
              {selectedEmployees.length > 0 &&
                ` · ${selectedEmployees.length} employee(s) selected`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="text-base">Employees</CardTitle>
          <CardDescription>
            Select one or more employees, then Apply shift to assign the chosen shift for each day in
            the range.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={employees}
            columns={employeeColumns}
            showTabs={false}
            showActions={false}
            showColumnCustomizer={false}
            enableSelection={true}
            searchKey="fullNameEn"
            isLoading={loadingEmployees}
            getRowId={(row) => row.id}
            onSelectionChange={(rows) => setSelectedEmployees(rows as EmployeeRow[])}
            className="border-0 shadow-none"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/20 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Temporary shift records</CardTitle>
              <CardDescription>
                Existing assignments in the filtered date range ({assignments.length}).
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAssignments}
              disabled={loadingAssignments || !selectedCompany}
            >
              {loadingAssignments && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Refresh list
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={assignmentRows}
            columns={assignmentColumns}
            showTabs={false}
            showActions={false}
            showColumnCustomizer={true}
            enableSelection={false}
            isLoading={loadingAssignments}
            getRowId={(row) => row.id}
            className="border-0 shadow-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
