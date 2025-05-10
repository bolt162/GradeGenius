import { NextRequest, NextResponse } from 'next/server';
import { listUserFiles } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

// GET /api/assignments - Get all assignments for current user
export async function GET(request: NextRequest) {
  try {
    // Get authentication info from cookies
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    // If not authenticated, return 401
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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