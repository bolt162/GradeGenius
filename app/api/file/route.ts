import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/app/lib/s3';
import { cookies } from 'next/headers';

// GET /api/file - Get file details from S3
export async function GET(request: NextRequest) {
  try {
    // Manual check for authentication using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
    
    // If no cookies are present, the user is not authenticated
    if (!sessionCookie && !clerkDbJwtCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get file key from query parameters
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');
    
    if (!fileKey) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    // Get file owner from the key (first part of the path)
    const fileOwner = fileKey.split('/')[0];

    // Skip ownership check for files that are already uploaded
    // This is a temporary workaround to allow access to legacy files
    // In a production environment, you might want to implement a more sophisticated check
    
    try {
      // Get pre-signed URL for the file
      const fileUrl = await getFileUrl(fileKey);
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      if (fileKey.endsWith('.py')) contentType = 'text/x-python';
      else if (fileKey.endsWith('.txt')) contentType = 'text/plain';
      else if (fileKey.endsWith('.pdf')) contentType = 'application/pdf';
      else if (fileKey.endsWith('.jpg') || fileKey.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (fileKey.endsWith('.png')) contentType = 'image/png';
      else if (fileKey.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileKey.endsWith('.doc')) contentType = 'application/msword';
      else if (fileKey.endsWith('.js')) contentType = 'application/javascript';
      else if (fileKey.endsWith('.ts')) contentType = 'application/typescript';
      else if (fileKey.endsWith('.html')) contentType = 'text/html';
      else if (fileKey.endsWith('.css')) contentType = 'text/css';
      else if (fileKey.endsWith('.json')) contentType = 'application/json';
      else if (fileKey.endsWith('.cpp')) contentType = 'text/x-c++src';
      else if (fileKey.endsWith('.c')) contentType = 'text/x-csrc';
      else if (fileKey.endsWith('.h')) contentType = 'text/x-chdr';
      
      // Get the filename (last part of the path)
      const fileName = fileKey.split('/').pop() || '';
      
      // Return file details
      return NextResponse.json({
        success: true,
        file: {
          key: fileKey,
          url: fileUrl,
          name: fileName,
          contentType
        }
      });
    } catch (error) {
      console.error('Error fetching file details:', error);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file details' },
      { status: 500 }
    );
  }
} 