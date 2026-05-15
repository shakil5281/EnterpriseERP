import api from "../api";
import { unwrapApiData, firstApiErrorMessage } from "@/lib/api-response";

/** Auth API + HR gateway use camelCase envelopes. */
interface LoginEnvelope {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  requiresTwoFactor: boolean;
  pendingTwoFactorToken?: string | null;
}

interface UserProfileEnvelope {
  userId: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  isActive: boolean;
  status: number;
  isLocked: boolean;
  lastLoginAt?: string | null;
  twoFactorEnabled: boolean;
  roles: string[];
  permissions: string[];
  companyAccess: Array<{ id: string; companyId: number; isDefaultCompany: boolean }>;
}

interface UserListItemEnvelope {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber?: string | null;
  status: number;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  success: boolean;
  message: string;
  username: string;
  fullName: string;
  roles: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  isActive: boolean;
  roles: string[];
  /** Populated from `auth/me` when available */
  permissions?: string[];
  assignedCompanyIds?: number[];
}

export interface RoleDetails {
  id: string;
  name: string;
  userCount: number;
}

export interface PermissionDto {
  roleName: string;
  permissions: string[];
}

export interface AuthPermissionItem {
  id: string;
  code: string;
  description: string;
}

export interface UpdatePermissionDto {
  roleId: string;
  permissions: string[];
}

export interface UserProfileUpdateDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

function storeSessionFromLogin(data: LoginEnvelope) {
  const token = data.accessToken;
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem(
    "user",
    JSON.stringify({
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
    }),
  );
}

function mapProfileToUser(p: UserProfileEnvelope): User {
  return {
    id: p.userId,
    username: p.username,
    email: p.email,
    fullName: p.fullName,
    phoneNumber: p.phoneNumber ?? undefined,
    isActive: p.isActive,
    roles: [...p.roles],
    permissions: [...p.permissions],
    assignedCompanyIds: p.companyAccess.map((c) => c.companyId),
  };
}

function mapListItemToUser(row: UserListItemEnvelope): User {
  return {
    id: row.id,
    username: row.userName,
    email: row.email,
    fullName: row.fullName,
    phoneNumber: row.phoneNumber ?? undefined,
    isActive: row.isActive,
    roles: [],
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const res = await api.post("auth/login", {
        username: credentials.username,
        password: credentials.password,
      });
      const data = unwrapApiData<LoginEnvelope>(res.data);
      if (data.requiresTwoFactor) {
        return {
          success: false,
          message: "Two-factor authentication is required (not yet supported in this UI).",
          token: "",
          refreshToken: "",
          username: data.username,
          fullName: data.fullName,
          roles: data.roles ?? [],
        };
      }
      storeSessionFromLogin(data);
      return {
        success: true,
        message: "Signed in successfully.",
        token: data.accessToken,
        refreshToken: data.refreshToken,
        username: data.username,
        fullName: data.fullName,
        roles: [...data.roles],
      };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      const msg =
        firstApiErrorMessage(ax.response?.data) ||
        ax.message ||
        "Invalid username or password.";
      return {
        success: false,
        message: msg,
        token: "",
        refreshToken: "",
        username: "",
        fullName: "",
        roles: [],
      };
    }
  },

  async getUsers(): Promise<User[]> {
    const res = await api.get("users");
    const rows = unwrapApiData<UserListItemEnvelope[]>(res.data);
    return rows.map(mapListItemToUser);
  },

  async createUser(
    userData: Partial<User> & { password: string; username: string; email: string; role?: string; fullName?: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      const reg = await api.post("auth/register", {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName || userData.username,
      });
      const created = unwrapApiData<LoginEnvelope>(reg.data);
      if (userData.role) {
        await api.post(`users/${created.userId}/roles`, {
          roleNames: [userData.role],
        });
      }
      return { success: true, message: "User created." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Create user failed.",
      };
    }
  },

  async getRoles(): Promise<RoleDetails[]> {
    const res = await api.get("roles");
    const items = unwrapApiData<Array<{ id: string; name: string }>>(res.data);
    return items.map((r) => ({ id: r.id, name: r.name, userCount: 0 }));
  },

  async createRole(roleName: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post("roles", { name: roleName });
      return { success: true, message: "Role created." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Create role failed.",
      };
    }
  },

  async assignRole(
    userId: string,
    roleName: string,
    currentRoles: string[],
  ): Promise<{ success: boolean; message: string }> {
    const next = Array.from(new Set([...currentRoles, roleName]));
    return authService.replaceUserRoles(userId, next);
  },

  async removeRole(
    userId: string,
    roleName: string,
    currentRoles: string[],
  ): Promise<{ success: boolean; message: string }> {
    const next = currentRoles.filter((r) => r !== roleName);
    return authService.replaceUserRoles(userId, next);
  },

  async replaceUserRoles(
    userId: string,
    roleNames: string[],
  ): Promise<{ success: boolean; message: string }> {
    try {
      await api.post(`users/${userId}/roles`, { roleNames });
      return { success: true, message: "Roles updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Role update failed.",
      };
    }
  },

  async getAllPermissions(): Promise<string[]> {
    const res = await api.get("permissions");
    const items = unwrapApiData<AuthPermissionItem[]>(res.data);
    return items.map((p) => p.code);
  },

  async getAllPermissionDetails(): Promise<AuthPermissionItem[]> {
    const res = await api.get("permissions");
    return unwrapApiData<AuthPermissionItem[]>(res.data);
  },

  async getRolePermissions(roleName: string): Promise<PermissionDto> {
    void roleName;
    return { roleName, permissions: [] };
  },

  async updateRolePermissions(data: UpdatePermissionDto): Promise<{ success: boolean; message: string }> {
    try {
      await api.post(`roles/${data.roleId}/permissions`, {
        permissionCodes: data.permissions,
      });
      return { success: true, message: "Permissions updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Permission update failed.",
      };
    }
  },

  async updateUser(
    userId: string,
    data: Partial<User> & { isActive?: boolean; fullName?: string; email?: string },
  ): Promise<{ success: boolean; message: string }> {
    return authService.updateUserStatus(userId, {
      status: data.isActive === false ? 2 : 1,
      isActive: data.isActive ?? true,
    });
  },

  async updateUserStatus(
    userId: string,
    body: { status: number; isActive: boolean },
  ): Promise<{ success: boolean; message: string }> {
    try {
      await api.put(`users/${userId}/status`, body);
      return { success: true, message: "User updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Update failed.",
      };
    }
  },

  async setUserCompanies(userId: string, companyIds: number[]): Promise<{ success: boolean; message: string }> {
    try {
      const items = companyIds.map((companyId, index) => ({
        companyId,
        isDefaultCompany: index === 0,
      }));
      await api.post(`users/${userId}/companies`, { items });
      return { success: true, message: "Company access updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Company access update failed.",
      };
    }
  },

  async updateProfile(_data: UserProfileUpdateDto): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: "Profile update is not implemented on Auth API v1 yet.",
    };
  },

  async getProfile(): Promise<User> {
    const res = await api.get("auth/me");
    const p = unwrapApiData<UserProfileEnvelope>(res.data);
    return mapProfileToUser(p);
  },

  async changePassword(_data: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: "Change password is not implemented on Auth API v1 yet.",
    };
  },

  async deleteUser(_userId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: "Delete user is not available on Auth API v1.",
    };
  },

  logout: async () => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("token")) {
        await api.post("auth/revoke");
      }
    } catch {
      /* ignore */
    }
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getCurrentUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },
};
