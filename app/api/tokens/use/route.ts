import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { spendUserTokens, getUserTokens } from '@/app/lib/dynamo';

/**
 * Use tokens for grading or other feature usage
 */
export async function POST(request: NextRequest) {
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