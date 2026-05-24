export type RouteRule = {
  path: string;
  permissions?: string[];
  roles?: string[];
  superAdminOnly?: boolean;
};

/** Single source of truth for route RBAC (proxy, RouteAccessGuard, sidebar). */
export const routeRules: RouteRule[] = [
  { path: "/management/administrator", permissions: ["auth.users.read"], superAdminOnly: false },
  { path: "/management/administrator/payroll-policies", superAdminOnly: true },
  { path: "/management/human-resource", permissions: ["hr.employees.read"], roles: ["HR", "Management", "HR Officer"] },
  { path: "/management/attendance", permissions: ["attendance.read"], roles: ["HR", "Management", "HR Officer"] },
  { path: "/management/leave", permissions: ["leave.read"], roles: ["HR", "Management", "HR Officer"] },
  { path: "/management/payroll", permissions: ["payroll.read"], roles: ["HR", "Management"] },
  { path: "/management/data-process", permissions: ["dataprocess.read"], roles: ["IT Officer", "HR", "Management"] },
  { path: "/management", roles: ["HR", "Management", "HR Officer", "IT Officer"] },
  { path: "/accounts", permissions: ["accounts.module.access"], roles: ["Accounts", "Accountant", "Account Officer"] },
  { path: "/production", permissions: ["production.read"], roles: ["Production", "ProductionManager"] },
  { path: "/store", permissions: ["store.read"], roles: ["Store", "StoreKeeper"] },
  { path: "/merchandising", permissions: ["merchandising.read"], roles: ["Admin", "Merchandising", "Merchandiser"] },
  { path: "/cutting", permissions: ["cutting.read"], roles: ["Cutting"] },
];

export function findMatchingRouteRule(pathname: string): RouteRule | undefined {
  const sorted = [...routeRules].sort((a, b) => b.path.length - a.path.length);
  return sorted.find((rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`));
}

export function canAccessRoute(
  pathname: string,
  roles: string[],
  permissions: string[] = [],
): boolean {
  if (roles.includes("SuperAdmin")) {
    return true;
  }

  const rule = findMatchingRouteRule(pathname);
  if (!rule) {
    return true;
  }

  if (rule.superAdminOnly) {
    return false;
  }

  if (rule.permissions?.length) {
    if (rule.permissions.some((p) => permissions.includes(p))) {
      return true;
    }
  }

  if (rule.roles?.length) {
    if (rule.roles.some((r) => roles.includes(r))) {
      return true;
    }
  }

  return !rule.permissions?.length && !rule.roles?.length;
}
