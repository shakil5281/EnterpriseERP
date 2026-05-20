import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { canAccessRoute, findMatchingRouteRule } from '@/lib/auth/access-config'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/unauthorized']

function parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const base64Url = token.split('.')[1]
        if (!base64Url) return null
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(atob(base64)) as Record<string, unknown>
    } catch {
        return null
    }
}

function extractRoles(payload: Record<string, unknown>): string[] {
    const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const userRoles = payload[roleKey] ?? payload['role'] ?? []
    return Array.isArray(userRoles) ? userRoles.map(String) : [String(userRoles)]
}

function extractPermissions(payload: Record<string, unknown>): string[] {
    const raw = payload['permission']
    if (!raw) return []
    return Array.isArray(raw) ? raw.map(String) : [String(raw)]
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('token')?.value

    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    )

    if (token && isPublicPath) {
        const payload = parseJwtPayload(token)
        if (payload) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        const response = NextResponse.next()
        response.cookies.delete('token')
        return response
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

    if (token && !isPublicPath && findMatchingRouteRule(pathname)) {
        const payload = parseJwtPayload(token)
        if (!payload) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        const roles = extractRoles(payload)
        const permissions = extractPermissions(payload)

        if (!canAccessRoute(pathname, roles, permissions)) {
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.rewrite(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
