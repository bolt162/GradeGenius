import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { uploadFile } from '@/app/lib/s3';

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the current user to access their username
    const user = await currentUser();
    const username = user?.username || user?.firstName?.toLowerCase() || userId;

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