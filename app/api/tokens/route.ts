import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserTokens, initializeUserTokens } from '@/app/lib/dynamo';

/**
 * Get the current user's token information
 */
export async function GET() {
  try {
    // Check authentication
    const authObject = await auth();
    const userId = authObject.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Get user tokens from DynamoDB
    let tokenInfo = await getUserTokens(userId);
    
    // If the user doesn't exist in DynamoDB yet, initialize them
    if (!tokenInfo) {
      await initializeUserTokens(userId);
      // Fetch the tokens again after initialization
      tokenInfo = await getUserTokens(userId);
    }
    
    // Return token information
    return NextResponse.json({
      success: true,
      tokens: tokenInfo
    });
  } catch (error: any) {
    console.error('Error fetching user tokens:', error);
    return NextResponse.json(
      { error: `Failed to get token information: ${error.message}` },
      { status: 500 }
    );
  }
} 