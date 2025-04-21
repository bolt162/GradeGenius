import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes
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

// Use the middleware from Clerk
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    
    // Always run for API routes
    '/api/(.*)'
  ],
}; 