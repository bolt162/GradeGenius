import { NextRequest, NextResponse } from 'next/server';
import { listUserFiles } from '@/app/lib/s3';
import { cookies } from 'next/headers';

// GET /api/assignments - Get all assignments for current user
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
    
    // Hardcoded default username/userId as fallback
    let userId = 'default_user';
    let username = 'default_user';
    
    try {
      // Try to extract userId and username from the session cookie
      if (sessionCookie?.value) {
        const parts = sessionCookie.value.split('.');
        if (parts.length >= 2) {
          // Parse JWT payload (simplified, not secure for production)
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