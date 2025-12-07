import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't need authentication
    const publicRoutes = ['/login', '/api/auth'];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Skip static files and public routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.') ||
        isPublicRoute
    ) {
        return NextResponse.next();
    }

    // Check for authentication token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // If no token and trying to access protected route, redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
    ],
};
