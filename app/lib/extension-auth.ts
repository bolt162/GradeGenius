import { headers } from 'next/headers';

interface ExtensionAuthData {
  userId: string;
  username: string;
  isAuthenticated: boolean;
  extensionId?: string;
}

/**
 * Verify authentication from extension JWT token
 * This is used specifically for the Chrome extension API routes
 */
export async function getAuthFromExtensionToken(): Promise<ExtensionAuthData> {
  // Default authentication state
  const authData: ExtensionAuthData = {
    userId: '',
    username: '',
    isAuthenticated: false
  };
  
  try {
    // Get headers - await because headers() returns a Promise in Next.js
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    
    // If no Authorization header is present, the request is not authenticated
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return authData;
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Decode JWT token
    // In a production app, you should verify the signature
    // This is a simplified implementation
    const parts = token.split('.');
    if (parts.length >= 2) {
      // Decode base64 JWT payload
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString()
      );
      
      // Extract user data from payload
      if (payload.sub) {
        authData.userId = payload.sub;
        authData.isAuthenticated = true;
        
        // Try to get username from various payload fields
        authData.username = 
          payload.username || 
          payload.email || 
          payload.name || 
          payload.firstName || 
          authData.userId;
          
        // Store extension ID if present
        if (payload.extensionId) {
          authData.extensionId = payload.extensionId;
        }
      }
    }
  } catch (e) {
    console.error('Error parsing extension token:', e);
    authData.isAuthenticated = false;
  }
  
  return authData;
}

/**
 * Generate a JWT token for extension use
 * This should be called when the extension authenticates
 */
export function generateExtensionToken(
  userId: string, 
  username: string, 
  extensionId: string,
  expiresIn: string = '30d' // Token valid for 30 days by default
): string {
  // This is a placeholder - in a real implementation you would:
  // 1. Use a proper JWT library (jose, jsonwebtoken, etc.)
  // 2. Use a secure secret key stored in environment variables
  // 3. Add proper expiration, issued at times, etc.
  
  // For now we'll just create a base64-encoded structure
  const payload = {
    sub: userId,
    username,
    extensionId,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Encode payload to base64
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // In a real implementation, you would sign this properly
  // This is just a placeholder structure
  return `header.${encodedPayload}.signature`;
} 