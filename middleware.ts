import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Function to check if a JWT token is potentially valid
function isValidJwt(token: string): boolean {
  try {
    // Basic structure check (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Try to decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if the token has expired
    if (payload.exp && typeof payload.exp === 'number') {
      const expiryDate = new Date(payload.exp * 1000);
      const now = new Date();
      if (expiryDate < now) {
        console.log('Token expired at:', expiryDate);
        return false;
      }
    }
    
    // Check if there's a user ID in the payload
    if (!payload.sub) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating JWT:', error);
    return false;
  }
}

// This middleware completely bypasses Clerk's built-in middleware to avoid 
// "Invalid header name or value" errors with multi-byte characters in Auth headers
export async function middleware(request: NextRequest) {
  // Log the current path for debugging
  console.log(`Middleware processing: ${request.nextUrl.pathname}`);

  // Always skip API routes entirely - they handle auth independently
  if (request.nextUrl.pathname.startsWith('/api')) {
    console.log('Skipping API route');
    return NextResponse.next();
  }

  // List of public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/sign-in', '/sign-up'];
  if (publicRoutes.some(route => request.nextUrl.pathname === route)) {
    console.log('Public route detected, allowing access');
    return NextResponse.next();
  }

  // List of protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/analytics',
    '/settings',
    '/help',
    '/tokens',
    '/grades',
    '/grade',
    '/assignments'
  ];

  // Check if the current path is a protected route or starts with one
  // (e.g., /grade/some-id should also be protected)
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(`${route}/`)
  );

  console.log(`Is protected route: ${isProtectedRoute}`);

  if (!isProtectedRoute) {
    console.log('Not a protected route, allowing access');
    return NextResponse.next();
  }

  // Get all Clerk cookies
  const sessionCookie = request.cookies.get('__session')?.value;
  const clerkDbJwtCookie = request.cookies.get('__clerk_db_jwt')?.value;
  const clerkCookie = request.cookies.get('__clerk')?.value;
  
  console.log(`Found cookies: __session=${!!sessionCookie}, __clerk_db_jwt=${!!clerkDbJwtCookie}, __clerk=${!!clerkCookie}`);
  
  // Validate the JWT tokens if they exist
  let hasValidSession = false;
  
  if (sessionCookie) {
    console.log('Checking __session cookie');
    hasValidSession = isValidJwt(sessionCookie);
  }
  
  if (!hasValidSession && clerkDbJwtCookie) {
    console.log('Checking __clerk_db_jwt cookie');
    hasValidSession = isValidJwt(clerkDbJwtCookie);
  }
  
  // If no valid session found, redirect to login
  if (!hasValidSession) {
    console.log('No valid session found, redirecting to login');
    
    // Clear any potentially invalid cookies
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Clear all Clerk cookies
    response.cookies.delete('__session');
    response.cookies.delete('__clerk_db_jwt');
    response.cookies.delete('__clerk');
    
    return response;
  }

  console.log('Valid session found, allowing access');
  return NextResponse.next();
}

// Update matcher to explicitly include all our protected routes
export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/analytics',
    '/analytics/:path*',
    '/settings',
    '/settings/:path*',
    '/help',
    '/help/:path*',
    '/tokens',
    '/tokens/:path*',
    '/grades',
    '/grades/:path*',
    '/grade',
    '/grade/:path*',
    '/assignments',
    '/assignments/:path*',
    '/login',
    '/signup',
    '/sign-in',
    '/sign-up',
  ]
}; 