import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware completely bypasses Clerk's built-in middleware to avoid 
// "Invalid header name or value" errors with multi-byte characters in Auth headers
export async function middleware(request: NextRequest) {
  // Always skip API routes entirely - they handle auth independently
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // List of public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/sign-in', '/sign-up'];
  if (publicRoutes.some(route => request.nextUrl.pathname === route)) {
    return NextResponse.next();
  }

  // Protected routes - Check for any Clerk session cookies
  // We only check for cookies and avoid header parsing completely
  const hasClerkSession = 
    request.cookies.has('__session') || 
    request.cookies.has('__clerk_db_jwt');

  // If no session found, redirect to login
  if (!hasClerkSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal Next.js routes, static files, API routes and images
    '/((?!_next|api|.*\\..*|favicon.ico).*)',
  ],
}; 