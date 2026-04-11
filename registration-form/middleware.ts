if (typeof __dirname === 'undefined') {
  globalThis.__dirname = '/';
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Read token from cookie
    const token = request.cookies.get("admin_token")?.value

    let user: { sub?: string; role?: string; email?: string; name?: string; mobileNumber?: string } | null = null

    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me')
            const { payload } = await jwtVerify(token, secret)
            user = payload
        } catch {
            console.log("Invalid token in middleware")
        }
    }

    // Public routes - no authentication required
    const publicRoutes = ['/login', '/register', '/', '/setup-account']
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // If no user, redirect to login
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
        // Only admin and super-admin can access admin routes
        if (user.role !== 'admin' && user.role !== 'super-admin') {
            // Regular users trying to access admin - redirect to register
            return NextResponse.redirect(new URL('/register', request.url))
        }
    }

    // Regular users - only allow register page
    if (user.role === 'user' && !pathname.startsWith('/register')) {
        return NextResponse.redirect(new URL('/register', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}