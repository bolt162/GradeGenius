import { NextRequest, NextResponse } from 'next/server';
import { getUserTokens } from '@/app/lib/dynamo';
import { getAuthFromExtensionToken } from '@/app/lib/extension-auth';

// GET /api/extension/tokens - Get token information for extension
export async function GET(request: NextRequest) {
  try {
    // Authenticate with extension token
    const { isAuthenticated, userId } = await getAuthFromExtensionToken();
    
    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please authenticate the extension first.' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Get user tokens from DynamoDB
    const tokenInfo = await getUserTokens(userId);
    
    // Return token information
    return NextResponse.json(
      {
        success: true,
        tokens: tokenInfo || 0 // Return 0 as fallback if token retrieval fails
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching user tokens for extension:', error);
    return NextResponse.json(
      { error: `Failed to get token information: ${error.message}` },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
} 