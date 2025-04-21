import { NextResponse, NextRequest } from 'next/server';
import { deleteFile } from '@/app/lib/s3';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    // Parse URL parameters
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');
    
    // Manual check for authentication using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
    
    // If no cookies are present, the user is not authenticated
    if (!sessionCookie && !clerkDbJwtCookie) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Extract userId and username from cookie
    let userId = 'default_user';
    let username = 'default_user';
    
    try {
      // Try to extract userId from session cookie if available
      if (sessionCookie?.value) {
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
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
    
    // Validate file key
    if (!fileKey) {
      return NextResponse.json(
        { error: 'Missing file key parameter' },
        { status: 400 }
      );
    }
    
    // Extract file owner from the key (usually the first part before the first slash)
    const fileOwner = fileKey.split('/')[0];
    
    // Check if the user owns this file (using either username or userId)
    if (fileOwner !== username && fileOwner !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this file' },
        { status: 403 }
      );
    }
    
    // Delete the file from S3
    await deleteFile(fileKey);
    
    // Success response
    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully',
      key: fileKey
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: `Failed to delete file: ${error.message}` },
      { status: 500 }
    );
  }
} 