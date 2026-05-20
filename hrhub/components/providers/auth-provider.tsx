"use client"

import * as React from "react"
import { authService, User, LoginResponse } from "@/lib/services/auth"
import { syncActiveCompanyStorage } from "@/lib/active-company-storage"
import { useRouter } from "next/navigation"
import { FullScreenLoading } from "@/components/loading-state"

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

    React.useEffect(() => {
        const initAuth = async () => {
            // Only run on client-side
            if (typeof window === 'undefined') {
                setLoading(false);
                setInitializing(false);
                return;
            }

            if (authService.isAuthenticated()) {
                try {
                    // Fetch fresh profile data from server
                    const profile = await authService.getProfile();
                    if (profile && profile.roles && profile.roles.length > 0) {
                        // Only set user when we have complete data with roles
                        setUser(profile);
                        syncActiveCompanyStorage({
                            allowedCompanyIds: profile.assignedCompanyIds ?? [],
                            defaultCompanyId: profile.defaultCompanyId ?? null,
                            isSuperAdmin: profile.roles.includes("SuperAdmin"),
                            accessToken: localStorage.getItem("token") ?? undefined,
                        });
                        // Update localStorage with fresh data
                        localStorage.setItem('user', JSON.stringify({
                            username: profile.username,
                            fullName: profile.fullName,
                            email: profile.email,
                            roles: profile.roles
                        }));
                    } else {
                        // No valid profile, clear auth
                        authService.logout();
                    }
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                    // If token is invalid, logout
                    if ((error as any)?.response?.status === 401) {
                        authService.logout();
                    }
                }
            }

            setLoading(false)
            setInitializing(false)
        }
        initAuth()

        // Listen for profile updates from other tabs or components
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
        if (response.success) {
            setInitializing(true) // Show loading screen during successful login
            setLoading(true)

            // Fetch full profile after login to populate roles/permissions
            try {
                const profile = await authService.getProfile();
                if (profile && profile.roles && profile.roles.length > 0) {
                    setUser(profile);
                    // Add delay to ensure UI updates properly
                    await new Promise(resolve => setTimeout(resolve, 800));
                } else {
                    // Fallback to basic info from login response
                    setUser({
                        username: response.username,
                        fullName: response.fullName,
                        roles: response.roles || []
                    } as User);
                }
            } catch (e) {
                console.error("Failed to fetch profile after login", e);
                // Fallback to basic info
                setUser({
                    username: response.username,
                    fullName: response.fullName,
                    roles: response.roles || []
                } as User);
            }

            setLoading(false)
            setInitializing(false)
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

    // Show full-screen loading during initialization
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
