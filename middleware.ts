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
  try {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
    return NextResponse.next();
  } catch (error) {
    console.error('Clerk middleware error:', error);
    // Handle authentication errors gracefully
    if (isProtectedRoute(req)) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    return NextResponse.next();
  }
});

// Important: This configuration ensures we don't run the middleware on API routes
// which prevents the multi-byte character issues with Authorization headers
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 