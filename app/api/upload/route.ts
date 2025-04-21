import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/app/lib/s3';
import { cookies } from 'next/headers';

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
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

    // Parse the FormData from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Convert the file to a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const contentType = file.type;
    
    // Upload to S3 with username in the path
    const result = await uploadFile(buffer, fileName, userId, contentType, username);
    
    // Return the file details
    return NextResponse.json({ 
      success: true,
      file: result
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Define the maximum file size (10MB)
export const config = {
  api: {
    bodyParser: false,
  },
}; 