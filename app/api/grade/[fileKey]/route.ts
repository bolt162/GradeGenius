import { NextResponse, NextRequest } from 'next/server';
import { getGradeResult } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: unknown }
) {
  try {
    // Use our custom cookie-based auth instead of Clerk
    const auth = await getAuthFromCookies();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Safely extract the fileKey from params
    // Using the Promise.resolve approach to avoid Next.js "params should be awaited" error
    const fileKeyPromise = Promise.resolve(params).then(p => 
      typeof p === 'object' && p !== null && 'fileKey' in p
        ? (p as { fileKey: string }).fileKey
        : null
    );
    
    const fileKey = await fileKeyPromise;
    
    if (!fileKey) {
      return NextResponse.json(
        { error: 'Missing file key' },
        { status: 400 }
      );
    }
    
    // Decode the fileKey (since it's part of the URL)
    const decodedKey = decodeURIComponent(fileKey);
    
    // Use username from our auth utils
    const userId = auth.userId;
    const username = auth.username;
    
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