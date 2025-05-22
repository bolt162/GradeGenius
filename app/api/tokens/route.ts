import { NextResponse } from 'next/server';
import { getUserTokens, initializeUserTokens } from '@/app/lib/dynamo';
import { cookies } from 'next/headers';

/**
 * Get the current user's token information
 */
export async function GET() {
  try {
    // Manual check for authentication using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
    
    // If no cookies are present, the user is not authenticated
    if (!sessionCookie && !clerkDbJwtCookie) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Extract userId from cookie (simplified implementation)
    // In production, you should properly verify the JWT
    // This is a fallback due to middleware issues
    let userId = 'user_placeholder';
    
    try {
      // Try to extract userId from session cookie if available
      if (sessionCookie?.value) {
        // Simple parsing, not full verification
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          userId = payload.sub || userId;
        }
      }
    } catch (e) {
      console.error('Error parsing session cookie:', e);
    }
    
    // Get user tokens from DynamoDB
    let tokenInfo = await getUserTokens(userId);
    
    // If the user doesn't exist in DynamoDB yet, initialize them
    if (!tokenInfo) {
      await initializeUserTokens(userId);
      // Fetch the tokens again after initialization
      tokenInfo = await getUserTokens(userId);
    }
    
    // Fix: Check explicitly for null or undefined instead of using falsy check
    const finalTokens = tokenInfo === null || tokenInfo === undefined ? 20000 : tokenInfo;
    
    // Return token information
    return NextResponse.json({
      success: true,
      tokens: finalTokens // Fallback if token retrieval fails
    });
  } catch (error: any) {
    console.error('Error fetching user tokens:', error);
    return NextResponse.json(
      { error: `Failed to get token information: ${error.message}` },
      { status: 500 }
    );
  }
} 