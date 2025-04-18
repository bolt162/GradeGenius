import { clerkMiddleware } from '@clerk/nextjs/server';

// Export simple Clerk middleware
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next/|.*\\.).*)',
    '/',
    '/login',
    '/signup', 
    '/verify',
  ],
}; 