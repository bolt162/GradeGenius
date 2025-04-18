import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Use a basic middleware approach instead of clerkMiddleware
export default function middleware(request: NextRequest) {
  try {
    // Check if user is authenticated with a cookie-based approach
    const hasAuthCookie = request.cookies.has('__clerk_session') || 
                           request.cookies.has('__session');
    
    // For protected routes, redirect to login if not authenticated
    if (isProtectedRoute(request) && !hasAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Always return a valid response even on error
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 