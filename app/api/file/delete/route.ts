import { NextResponse, NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { deleteFile } from '@/app/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    // Parse URL parameters
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');
    
    // Check authorization
    const authObject = await auth();
    const userId = authObject.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Validate file key
    if (!fileKey) {
      return NextResponse.json(
        { error: 'Missing file key parameter' },
        { status: 400 }
      );
    }
    
    // Get the current user to access their username
    const user = await currentUser();
    const username = user?.username || user?.firstName?.toLowerCase() || userId;
    
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