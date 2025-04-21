import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { addUserTokens, getUserTokens } from '@/app/lib/dynamo';

/**
 * Purchase additional tokens
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
    const { tokenAmount = 10 } = body;
    
    if (typeof tokenAmount !== 'number' || tokenAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid token amount specified' },
        { status: 400 }
      );
    }
    
    // Add tokens to the user's account (simulated)
    const newTotalTokens = await addUserTokens(userId, tokenAmount);
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${tokenAmount} tokens`,
      newTotalTokens
    });
    
  } catch (error: any) {
    console.error('Error purchasing tokens:', error);
    return NextResponse.json(
      { error: `Failed to purchase tokens: ${error.message}` },
      { status: 500 }
    );
  }
} 