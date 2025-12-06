import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Skip all API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Let all other routes pass through - auth will be handled by NextAuth
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
