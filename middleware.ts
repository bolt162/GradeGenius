import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is simplified to completely avoid Clerk header issues
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public routes
  const publicRoutes = ['/', '/login', '/signup'];
  
  // Skip API routes completely to avoid authorization header issues
  if (path.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Skip public routes
  if (publicRoutes.some(route => path === route)) {
    return NextResponse.next();
  }
  
  // For protected routes, check for session cookie
  // This is intentionally basic to avoid header parsing issues
  const hasClerkSession = request.cookies.has('__session') || 
                         request.cookies.has('__clerk_db_jwt');
  
  if (!hasClerkSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static files and API routes 
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}; 