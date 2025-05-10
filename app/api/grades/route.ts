import { NextResponse } from 'next/server';
import { listUserGrades } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

export async function GET() {
  try {
    // Get authentication info from cookies
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    // If not authenticated, return 401
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Get grades from S3 using userId/username for the path
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