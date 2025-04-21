import { cookies } from 'next/headers';

interface AuthData {
  userId: string;
  username: string;
  isAuthenticated: boolean;
}

/**
 * Get authentication data from cookies
 * This is a workaround for Clerk authentication issues in API routes
 */
export async function getAuthFromCookies(): Promise<AuthData> {
  // Get cookies
  const cookieStore = cookies();
  
  // Check for clerk session cookies
  const sessionCookie = cookieStore.get('__session');
  const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
  
  // Default authentication state
  const authData: AuthData = {
    userId: 'default_user',
    username: 'default_user',
    isAuthenticated: false
  };
  
  // If any session cookie exists, consider user authenticated
  if (sessionCookie || clerkDbJwtCookie) {
    authData.isAuthenticated = true;
  }
  
  try {
    // Try to extract userId from JWT in session cookie
    if (sessionCookie?.value) {
      const parts = sessionCookie.value.split('.');
      if (parts.length >= 2) {
        // Decode base64 JWT payload
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString()
        );
        
        // Extract user data from payload
        if (payload.sub) {
          authData.userId = payload.sub;
        }
        
        // Try to get username from various payload fields
        authData.username = 
          payload.username || 
          payload.email || 
          payload.name || 
          payload.firstName || 
          authData.userId;
      }
    }
  } catch (e) {
    console.error('Error parsing session cookie:', e);
  }
  
  return authData;
} 