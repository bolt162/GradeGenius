import { NextRequest, NextResponse } from 'next/server';
import { getFileContent, getFileUrl, getDocumentContent } from '@/app/lib/s3';
import { cookies } from 'next/headers';

// GET /api/file-content - Proxy for fetching file content from S3
export async function GET(request: NextRequest) {
  console.log('[FileContent API] Received request for file content');
  try {
    // Manual check for authentication using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
    
    // If no cookies are present, the user is not authenticated
    if (!sessionCookie && !clerkDbJwtCookie) {
      console.log('[FileContent API] Authentication failed - no cookies present');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract userId from cookie
    let userId = null;
    let username = null;
    
    try {
      // Try to extract userId from session cookie if available
      if (sessionCookie?.value) {
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          userId = payload.sub || null;
          username = payload.username || payload.email || null;
          console.log('[FileContent API] Extracted userId from cookie:', userId);
          console.log('[FileContent API] Extracted username from cookie:', username);
        }
      }
    } catch (e) {
      console.error('[FileContent API] Error parsing session cookie:', e);
    }
    
    // If we couldn't extract a userId, return unauthorized
    if (!userId) {
      console.log('[FileContent API] Authentication failed - no userId extracted');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file key from query parameters
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');
    
    if (!fileKey) {
      console.log('[FileContent API] No file key provided in request');
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    console.log('[FileContent API] Fetching content for file:', fileKey);
    
    try {
      // Extract file owner from the key (first part of the path)
      const fileOwner = fileKey.split('/')[0];
      
      // Check if the user has permission to access this file
      // Either they own it, or it's a public/shared file
      if (fileOwner !== userId && fileOwner !== username) {
        console.log('[FileContent API] Ownership check: fileOwner=', fileOwner, 'userId=', userId, 'username=', username);
        console.log('[FileContent API] Access denied - user does not own the file');
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      // TEMPORARY DEBUG: Check the URL we would get
      const fileUrl = await getFileUrl(fileKey);
      console.log('[FileContent API] DEBUG - Pre-signed URL generated:', fileUrl.substring(0, 100) + '...');
      
      // Check if the file is a document type (docx or doc)
      const isDocument = fileKey.toLowerCase().endsWith('.docx') || fileKey.toLowerCase().endsWith('.doc');
      
      // Get the actual content from S3 using the appropriate method
      console.log('[FileContent API] Retrieving actual content from S3');
      let content;
      
      if (isDocument) {
        content = await getDocumentContent(fileKey);
      } else {
        content = await getFileContent(fileKey);
      }
      
      console.log('[FileContent API] Content retrieved successfully:', {
        contentLength: content.length,
        isUrl: content.startsWith('http'),
        sample: content.substring(0, 100)
      });
      
      // Get the content type based on file extension
      let contentType = 'application/octet-stream';
      if (fileKey.endsWith('.py')) contentType = 'text/x-python';
      else if (fileKey.endsWith('.txt')) contentType = 'text/plain';
      else if (fileKey.endsWith('.cpp')) contentType = 'text/x-c++src';
      else if (fileKey.endsWith('.c')) contentType = 'text/x-csrc';
      else if (fileKey.endsWith('.h')) contentType = 'text/x-chdr';
      else if (fileKey.endsWith('.js')) contentType = 'application/javascript';
      else if (fileKey.endsWith('.ts')) contentType = 'application/typescript';
      else if (fileKey.endsWith('.html')) contentType = 'text/html';
      else if (fileKey.endsWith('.css')) contentType = 'text/css';
      else if (fileKey.endsWith('.json')) contentType = 'application/json';
      else if (fileKey.endsWith('.php')) contentType = 'application/x-httpd-php';
      else if (fileKey.endsWith('.docx') || fileKey.endsWith('.doc')) contentType = 'text/plain'; // Converted document content
      
      // Return the content with appropriate headers
      console.log('[FileContent API] Returning content to client with content-type:', contentType);
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error: any) {
      console.error('[FileContent API] Error retrieving file content:', error);
      return NextResponse.json(
        { error: `Failed to retrieve file content: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[FileContent API] Unexpected error:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error.message}` },
      { status: 500 }
    );
  }
} 