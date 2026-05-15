import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which routes are public (don't require login)
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/unauthorized']

// Define route protection rules (RBAC)
const roleRules = [
    { path: '/management/administrator', roles: ['SuperAdmin', 'Admin'] },
    { path: '/management/human-resource', roles: ['SuperAdmin', 'Admin', 'HR', 'Management', 'HR Officer'] },
    { path: '/management/attendance', roles: ['SuperAdmin', 'Admin', 'HR', 'Management', 'HR Officer'] },
    { path: '/management/leave', roles: ['SuperAdmin', 'Admin', 'HR', 'Management', 'HR Officer'] },
    { path: '/management', roles: ['SuperAdmin', 'Admin', 'HR', 'Management', 'HR Officer', 'IT Officer'] },
    { path: '/production', roles: ['SuperAdmin', 'Admin', 'Production', 'ProductionManager'] },
    { path: '/accounts', roles: ['SuperAdmin', 'Admin', 'Accounts', 'Accountant', 'Account Officer'] },
    { path: '/store', roles: ['SuperAdmin', 'Admin', 'Store', 'StoreKeeper'] },
    { path: '/merchandising', roles: ['SuperAdmin', 'Admin', 'Merchandising', 'Merchandiser'] },
    { path: '/cutting', roles: ['SuperAdmin', 'Admin', 'Cutting'] },
]

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('token')?.value

    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    )

    if (token && isPublicPath) {
        try {
            const base64Url = token.split('.')[1]
            if (!base64Url) throw new Error("Invalid token")
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = atob(base64)
            JSON.parse(jsonPayload)
            return NextResponse.redirect(new URL('/', request.url))
        } catch (e) {
            // Invalid token, clear it and allow access to public path
            const response = NextResponse.next()
            response.cookies.delete('token')
            return response
        }
    }

    if (!token && !isPublicPath) {
        const isNextInternal = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')
        if (!isNextInternal && pathname !== '/favicon.ico') {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('returnUrl', pathname)
            return NextResponse.redirect(url)
        }
    }

    if (token && !isPublicPath) {
        const sortedRules = [...roleRules].sort((a, b) => b.path.length - a.path.length)
        const matchedRule = sortedRules.find(rule => pathname.startsWith(rule.path))

        if (matchedRule) {
            try {
                const base64Url = token.split('.')[1]
                if (!base64Url) throw new Error("Invalid token")

                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                const jsonPayload = atob(base64)
                const payload = JSON.parse(jsonPayload)

                const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                const userRoles = payload[roleKey] || payload["role"] || []
                const roles: string[] = Array.isArray(userRoles) ? userRoles : [userRoles]

                const hasRole = roles.some((r: string) => matchedRule.roles.includes(r) || r === 'SuperAdmin' || r === 'Admin')

                if (!hasRole) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/unauthorized'
                    return NextResponse.rewrite(url)
                }
            } catch (e) {
                console.error("Proxy token parse error:", e)
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                return NextResponse.redirect(url)
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
