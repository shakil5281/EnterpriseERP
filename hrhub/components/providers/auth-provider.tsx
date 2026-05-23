"use client"

import * as React from "react"
import { authService, User, LoginResponse } from "@/lib/services/auth"
import { syncActiveCompanyStorage } from "@/lib/active-company-storage"
import { refreshAccessToken } from "@/lib/auth-session"
import { useRouter, usePathname } from "next/navigation"
import { FullScreenLoading } from "@/components/loading-state"
import { getRedirectUrlForUser } from "@/lib/role-redirect"

interface LoginCredentials {
    username: string;
    password: string;
    rememberMe?: boolean;
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (credentials: LoginCredentials) => Promise<LoginResponse>
    completeTwoFactorLogin: (pendingTwoFactorToken: string, code: string) => Promise<LoginResponse>
    logout: () => void
    hasRole: (role: string) => boolean
    hasPermission: (permission: string) => boolean
    hasAnyRole: (roles: string[]) => boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [initializing, setInitializing] = React.useState(true)
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        const initAuth = async () => {
            if (typeof window === 'undefined') {
                setLoading(false);
                setInitializing(false);
                return;
            }

            if (authService.isAuthenticated()) {
                try {
                    const profile = await authService.getProfile();
                    if (profile && profile.roles && profile.roles.length > 0) {
                        setUser(profile);
                        syncActiveCompanyStorage({
                            allowedCompanyIds: profile.assignedCompanyIds ?? [],
                            defaultCompanyId: profile.defaultCompanyId ?? null,
                            isSuperAdmin: profile.roles.includes("SuperAdmin"),
                            accessToken: localStorage.getItem("token") ?? undefined,
                        });
                        localStorage.setItem('user', JSON.stringify({
                            username: profile.username,
                            fullName: profile.fullName,
                            email: profile.email,
                            roles: profile.roles
                        }));
                    } else {
                        authService.logout();
                    }
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                    if ((error as { response?: { status?: number } })?.response?.status === 401) {
                        const newToken = await refreshAccessToken();
                        if (newToken) {
                            try {
                                const profile = await authService.getProfile();
                                if (profile?.roles?.length) {
                                    setUser(profile);
                                    syncActiveCompanyStorage({
                                        allowedCompanyIds: profile.assignedCompanyIds ?? [],
                                        defaultCompanyId: profile.defaultCompanyId ?? null,
                                        isSuperAdmin: profile.roles.includes("SuperAdmin"),
                                        accessToken: newToken,
                                    });
                                    localStorage.setItem('user', JSON.stringify({
                                        username: profile.username,
                                        fullName: profile.fullName,
                                        email: profile.email,
                                        roles: profile.roles
                                    }));
                                    setLoading(false);
                                    setInitializing(false);
                                    return;
                                }
                            } catch {
                                /* fall through */
                            }
                        }
                        authService.logout();
                    }
                }
            }

            setLoading(false)
            setInitializing(false)
        }
        initAuth()

        const handleProfileUpdate = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(prev => prev ? ({ ...prev, ...parsed }) : parsed);
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('profile-updated', handleProfileUpdate);
    }, [])

    const finishSuccessfulLogin = async (response: LoginResponse) => {
        if (!response.success) return

        setLoading(true)
        let roles = response.roles ?? []
        try {
            const profile = await authService.getProfile()
            if (profile?.roles?.length) {
                setUser(profile)
                roles = profile.roles
                syncActiveCompanyStorage({
                    allowedCompanyIds: profile.assignedCompanyIds ?? [],
                    defaultCompanyId: profile.defaultCompanyId ?? null,
                    isSuperAdmin: profile.roles.includes("SuperAdmin"),
                    accessToken: localStorage.getItem("token") ?? undefined,
                })
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        username: profile.username,
                        fullName: profile.fullName,
                        email: profile.email,
                        roles: profile.roles,
                    }),
                )
            } else {
                setUser({
                    username: response.username,
                    fullName: response.fullName,
                    roles: response.roles || [],
                } as User)
            }
        } catch (e) {
            console.error("Failed to fetch profile after login", e)
            setUser({
                username: response.username,
                fullName: response.fullName,
                roles: response.roles || [],
            } as User)
        }

        setLoading(false)

        if (pathname === "/login" || pathname?.startsWith("/login")) {
            const params = new URLSearchParams(window.location.search)
            const returnUrl = params.get("returnUrl")
            const target =
                returnUrl &&
                returnUrl.startsWith("/") &&
                !returnUrl.startsWith("//") &&
                !returnUrl.startsWith("/login")
                    ? returnUrl
                    : getRedirectUrlForUser(roles)
            router.replace(target)
        }
    }

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials)
        await finishSuccessfulLogin(response)
        return response
    }

    const completeTwoFactorLogin = async (pendingTwoFactorToken: string, code: string) => {
        const response = await authService.verifyTwoFactorLogin(pendingTwoFactorToken, code)
        await finishSuccessfulLogin(response)
        return response
    }

    const logout = () => {
        authService.logout()
        setUser(null)
    }

    const isSuperAdmin = () => !!user?.roles?.includes("SuperAdmin")

    const hasRole = (role: string) => {
        if (!user || !user.roles) return false
        if (isSuperAdmin()) return true
        return user.roles.includes(role)
    }

    const hasAnyRole = (roles: string[]) => {
        if (!user || !user.roles) return false
        if (isSuperAdmin()) return true
        return roles.some(role => user.roles.includes(role))
    }

    const hasPermission = (permission: string) => {
        if (!user) return false
        if (isSuperAdmin()) return true
        return !!user.permissions?.includes(permission)
    }

    if (initializing) {
        return <FullScreenLoading message="Initializing your workspace..." />
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, completeTwoFactorLogin, logout, hasRole, hasPermission, hasAnyRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
