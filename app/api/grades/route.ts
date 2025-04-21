import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { listUserGrades } from '@/app/lib/s3';

export async function GET() {
  try {
    // Check auth
    const authObject = await auth();
    const userId = authObject.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Get the current user to access their username
    const user = await currentUser();
    const username = user?.username || user?.firstName?.toLowerCase() || userId;
    
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