import { NextResponse, NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getGradeResult } from '@/app/lib/s3';

export async function GET(
  request: NextRequest,
  context: { params: { fileKey: string } }
) {
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
    
    // Get the fileKey from the URL params
    const { fileKey } = context.params;
    
    if (!fileKey) {
      return NextResponse.json(
        { error: 'Missing file key' },
        { status: 400 }
      );
    }
    
    // Decode the fileKey (since it's part of the URL)
    const decodedKey = decodeURIComponent(fileKey);
    
    // Get the current user to access their username
    const user = await currentUser();
    const username = user?.username || user?.firstName?.toLowerCase() || userId;
    
    // Get grade result from S3 using username for path
    const gradeResult = await getGradeResult(decodedKey, userId, username);
    
    if (!gradeResult) {
      return NextResponse.json(
        { error: 'Grade not found for this file' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ grade: gradeResult });
  } catch (error: any) {
    console.error('Error getting grade:', error);
    return NextResponse.json(
      { error: `Failed to fetch grade: ${error.message}` },
      { status: 500 }
    );
  }
} 