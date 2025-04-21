import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', 
  '/assignments(.*)', 
  '/grade(.*)', 
  '/tokens(.*)',
  '/analytics(.*)',
  '/settings(.*)',
  '/help(.*)',
  '/test-upload(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Completely bypass Clerk auth for API routes to avoid header issues
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // For protected routes, enforce authentication
  if (isProtectedRoute(req)) {
    try {
      auth.protect();
    } catch (error) {
      console.error('Auth error:', error);
      const signInUrl = new URL('/login', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

// Configure middleware to exclude API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}; 