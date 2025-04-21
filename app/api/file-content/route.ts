import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFileUrl } from '@/app/lib/s3';

// GET /api/file-content - Proxy for fetching file content from S3
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const { userId } = await auth();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file key from query parameters
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');
    
    if (!fileKey) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    try {
      // Get pre-signed URL for the file
      const fileUrl = await getFileUrl(fileKey);
      
      // Proxy the request to S3
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.status} ${response.statusText}`);
      }
      
      // Get the content type from the response or derive it from the file extension
      let contentType = response.headers.get('content-type') || 'application/octet-stream';
      if (fileKey.endsWith('.py')) contentType = 'text/x-python';
      else if (fileKey.endsWith('.txt')) contentType = 'text/plain';
      
      // Get the file content
      const content = await response.text();
      
      // Return the content with appropriate headers
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error fetching file content:', error);
      return NextResponse.json(
        { error: 'File not found or inaccessible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file content' },
      { status: 500 }
    );
  }
} 