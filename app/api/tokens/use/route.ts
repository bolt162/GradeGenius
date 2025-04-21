import { NextRequest, NextResponse } from 'next/server';
import { spendUserTokens, getUserTokens } from '@/app/lib/dynamo';
import { cookies } from 'next/headers';

/**
 * Use tokens for grading or other feature usage
 */
export async function POST(request: NextRequest) {
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
    
    // Extract userId from cookie
    let userId = 'default_user';
    
    try {
      // Try to extract userId from session cookie if available
      if (sessionCookie?.value) {
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          if (payload.sub) {
            userId = payload.sub;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing session cookie:', e);
    }
    
    // Get request body
    const body = await request.json();
    const { tokenAmount = 1 } = body;
    
    if (typeof tokenAmount !== 'number' || tokenAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid token amount specified' },
        { status: 400 }
      );
    }
    
    // First check if user has enough tokens
    const userTokenData = await getUserTokens(userId);
    
    if (!userTokenData) {
      return NextResponse.json(
        { error: 'User token data not found' },
        { status: 404 }
      );
    }
    
    if (userTokenData < tokenAmount) {
      return NextResponse.json(
        { 
          error: 'Insufficient tokens', 
          currentTokens: userTokenData,
          requiredTokens: tokenAmount
        },
        { status: 403 }
      );
    }
    
    // Use tokens from the user's account
    const remainingTokens = await spendUserTokens(userId, tokenAmount);
    
    return NextResponse.json({
      success: true,
      message: `Successfully used ${tokenAmount} tokens`,
      remainingTokens
    });
    
  } catch (error: any) {
    console.error('Error using tokens:', error);
    return NextResponse.json(
      { error: `Failed to use tokens: ${error.message}` },
      { status: 500 }
    );
  }
} 