// Role-based redirect mapping
// Maps user roles to their default dashboard/landing page

export const roleRedirectMap: Record<string, string> = {
    // Admin roles - go to main dashboard
    'SuperAdmin': '/',
    'Admin': '/',

    // Management module roles
    'HR': '/',
    'Management': '/',
    'HR Officer': '/',
    'IT Officer': '/',

    // Accounts module roles
    'Accounts': '/accounts/dashboard',
    'Accountant': '/accounts/dashboard',
    'Account Officer': '/accounts/dashboard',

    // Production module roles
    'Production': '/production/dashboard',
    'ProductionManager': '/production/dashboard',

    // Store module roles
    'Store': '/store/dashboard',
    'StoreKeeper': '/store/dashboard',

    // Cutting module roles
    'Cutting': '/cutting/dashboard',

    // Merchandising module roles
    'Merchandising': '/merchandising/dashboard',
    'Merchandiser': '/merchandising/dashboard',
}

/**
 * Get the redirect URL for a user based on their roles
 * Priority: SuperAdmin/Admin > First matching role in the map
 */
export function getRedirectUrlForUser(roles: string[]): string {
    if (!roles || roles.length === 0) {
        return '/' // Default to home
    }

    // Check for SuperAdmin or Admin first (they get main dashboard)
    if (roles.includes('SuperAdmin') || roles.includes('Admin')) {
        return '/'
    }

    // Find the first matching role and return its redirect URL
    for (const role of roles) {
        if (roleRedirectMap[role]) {
            return roleRedirectMap[role]
        }
    }

    // Default to home if no matching role found
    return '/'
}
