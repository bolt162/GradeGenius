import { NextResponse, NextRequest } from 'next/server';
import { listUserRubrics, storeRubric } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

// Maximum number of rubrics allowed per user
const MAX_RUBRICS_PER_USER = 20;

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
    
    // Get existing rubrics to check if user has reached the limit
    const existingRubrics = await listUserRubrics(userId, username);
    
    // Check if user has reached the maximum rubrics limit
    if (existingRubrics.length >= MAX_RUBRICS_PER_USER) {
      return NextResponse.json(
        { 
          error: `You have reached the maximum limit of ${MAX_RUBRICS_PER_USER} rubrics. Please delete some rubrics before creating new ones.`,
          maxRubricLimitReached: true
        },
        { status: 403 }
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
    
    // Validate number of questions doesn't exceed 10
    if (rubricData.questions && rubricData.questions.length > 10) {
      return NextResponse.json(
        { error: 'Rubrics can have at most 10 questions' },
        { status: 400 }
      );
    }
    
    // Validate each question is 200 characters or less
    if (rubricData.questions && rubricData.questions.some((q: string) => q.length > 200)) {
      return NextResponse.json(
        { error: 'Each question must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Validate partial credit fields
    if (rubricData.partialCreditEnabled && rubricData.partialCreditCriteria) {
      // Check that partial credit arrays match question length
      if (rubricData.partialCreditEnabled.length !== rubricData.questions.length ||
          rubricData.partialCreditCriteria.length !== rubricData.questions.length) {
        return NextResponse.json(
          { error: 'Partial credit arrays must match the number of questions' },
          { status: 400 }
        );
      }

      // Validate partial credit criteria when enabled
      for (let i = 0; i < rubricData.partialCreditEnabled.length; i++) {
        if (rubricData.partialCreditEnabled[i] && (!rubricData.partialCreditCriteria[i] || !rubricData.partialCreditCriteria[i].trim())) {
          return NextResponse.json(
            { error: `Partial credit criteria is required for question ${i + 1} when partial credit is enabled` },
            { status: 400 }
          );
        }
        
        // Validate partial credit criteria length
        if (rubricData.partialCreditCriteria[i] && rubricData.partialCreditCriteria[i].length > 200) {
          return NextResponse.json(
            { error: `Partial credit criteria for question ${i + 1} must be 200 characters or less` },
            { status: 400 }
          );
        }
      }
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