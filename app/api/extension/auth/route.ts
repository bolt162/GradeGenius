import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateExtensionToken } from '@/app/lib/extension-auth';

// POST /api/extension/auth - Authenticate the Chrome extension
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { extensionId } = body;
    
    // Validate extensionId
    if (!extensionId) {
      return NextResponse.json(
        { error: 'Extension ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Get cookies from the request
    const cookiesList = request.cookies;
    const sessionCookie = cookiesList.get('__session');
    const clerkDbJwtCookie = cookiesList.get('__clerk_db_jwt');
    
    // If no cookies are present, the user is not authenticated
    if (!sessionCookie && !clerkDbJwtCookie) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to the Grade Genius website first.' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Extract userId and username from cookie
    let userId = '';
    let username = '';
    
    try {
      // Try to extract userId from session cookie if available
      if (sessionCookie?.value) {
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          userId = payload.sub || '';
          username = payload.username || payload.email || userId;
        }
      }
      
      // If we still don't have a userId, try the other cookie
      if (!userId && clerkDbJwtCookie?.value) {
        const parts = clerkDbJwtCookie.value.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          userId = payload.sub || '';
          username = payload.username || payload.email || userId;
        }
      }
    } catch (e) {
      console.error('Error parsing session cookie:', e);
    }
    
    // If still no userId, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to authenticate. Please sign in again.' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Generate a token for the extension
    const token = generateExtensionToken(userId, username, extensionId);
    
    // Return the token
    return NextResponse.json(
      { 
        success: true,
        token,
        userId,
        username
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error: any) {
    console.error('Extension authentication error:', error);
    return NextResponse.json(
      { error: `Authentication failed: ${error.message}` },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
} 