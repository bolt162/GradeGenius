import { NextResponse, NextRequest } from 'next/server';
import { listUserRubrics, storeRubric } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

// GET /api/rubrics - Get all rubrics for the current user
export async function GET() {
  try {
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Get rubrics from S3 using username for the path
    const rubrics = await listUserRubrics(userId, username);
    
    return NextResponse.json({ rubrics });
  } catch (error: any) {
    console.error('Error getting rubrics:', error);
    return NextResponse.json(
      { error: `Failed to fetch rubrics: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST /api/rubrics - Create a new rubric
export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const rubricData = await request.json();
    
    // Validate required fields
    if (!rubricData.name || !rubricData.classLevel || !rubricData.course || !rubricData.specialization) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Store the rubric in S3
    const result = await storeRubric(userId, rubricData.name, rubricData, username);
    
    return NextResponse.json({ 
      success: true,
      rubric: result
    });
  } catch (error: any) {
    console.error('Error creating rubric:', error);
    return NextResponse.json(
      { error: `Failed to create rubric: ${error.message}` },
      { status: 500 }
    );
  }
} 