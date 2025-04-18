import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)'  // Protect all dashboard routes
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 