import { NextRequest, NextResponse } from 'next/server';
import { listUserRubrics } from '@/app/lib/s3';
import { getAuthFromExtensionToken } from '@/app/lib/extension-auth';

// GET /api/extension/rubrics - Get all rubrics for the current user
export async function GET() {
  try {
    // Authenticate with extension token
    const { isAuthenticated, userId, username } = await getAuthFromExtensionToken();
    
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
    
    // Get rubrics from S3 using username for the path
    const rubrics = await listUserRubrics(userId, username || userId);
    
    // Return rubrics
    return NextResponse.json(
      { 
        success: true,
        rubrics 
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
    console.error('Error getting rubrics for extension:', error);
    return NextResponse.json(
      { error: `Failed to fetch rubrics: ${error.message}` },
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