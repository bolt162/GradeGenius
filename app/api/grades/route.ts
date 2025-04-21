import { NextResponse } from 'next/server';
import { listUserGrades } from '@/app/lib/s3';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Manual check for authentication using cookies
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session');
    const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
    
    // If no cookies are present, the user is not authenticated
    if (!sessionCookie && !clerkDbJwtCookie) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Hardcoded default username/userId as fallback
    let userId = 'default_user';
    let username = 'default_user';
    
    try {
      // Try to extract userId and username from the session cookie
      if (sessionCookie?.value) {
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
          // Parse JWT payload (simplified, not secure for production)
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          userId = payload.sub || userId;
          username = payload.username || payload.email || userId;
        }
      }
    } catch (e) {
      console.error('Error parsing session cookie:', e);
    }
    
    // Get grades from S3 using username for the path
    const grades = await listUserGrades(userId, username);
    
    return NextResponse.json({ grades });
  } catch (error: any) {
    console.error('Error getting grades:', error);
    return NextResponse.json(
      { error: `Failed to fetch grades: ${error.message}` },
      { status: 500 }
    );
  }
} 