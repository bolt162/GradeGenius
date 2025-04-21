import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { listUserFiles } from '@/app/lib/s3';

// GET /api/assignments - Get all assignments for current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the current user to access their username
    const user = await currentUser();
    const username = user?.username || user?.firstName?.toLowerCase() || userId;

    try {
      // Fetch assignments from S3
      const files = await listUserFiles(username, true);

      // Return assignments
      return NextResponse.json({ 
        assignments: files.map(file => ({
          ...file,
          // Format date from S3 LastModified
          lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null
        }))
      });
    } catch (error: any) {
      console.error('Error fetching files from S3:', error);
      
      // If the error is because no files were found, return empty array
      if (error.message && error.message.includes('NoSuchKey') || error.message.includes('NoSuchBucket')) {
        return NextResponse.json({ 
          message: 'No assignments found',
          assignments: [] 
        });
      }
      
      throw error; // Re-throw for the outer catch
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
} 