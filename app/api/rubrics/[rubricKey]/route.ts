import { NextResponse, NextRequest } from 'next/server';
import { getRubric, updateRubric, deleteRubric } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

// GET /api/rubrics/[rubricKey] - Get a specific rubric
export async function GET(
  request: NextRequest,
  { params }: { params: unknown }
) {
  try {
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Safely extract the rubricKey from params
    // Using the Promise.resolve approach to avoid Next.js "params should be awaited" error
    const rubricKeyPromise = Promise.resolve(params).then(p => 
      typeof p === 'object' && p !== null && 'rubricKey' in p
        ? (p as { rubricKey: string }).rubricKey
        : null
    );
    
    const rubricKey = await rubricKeyPromise;
    
    if (!rubricKey) {
      return NextResponse.json(
        { error: 'Missing rubric key' },
        { status: 400 }
      );
    }
    
    // Decode the rubricKey (since it's part of the URL)
    const decodedKey = decodeURIComponent(rubricKey);
    
    // Get the rubric from S3
    const rubric = await getRubric(decodedKey, userId, username);
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ rubric });
  } catch (error: any) {
    console.error('Error getting rubric:', error);
    return NextResponse.json(
      { error: `Failed to fetch rubric: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT /api/rubrics/[rubricKey] - Update a specific rubric
export async function PUT(
  request: NextRequest,
  { params }: { params: unknown }
) {
  try {
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Safely extract the rubricKey from params using Promise.resolve
    const rubricKeyPromise = Promise.resolve(params).then(p => 
      typeof p === 'object' && p !== null && 'rubricKey' in p
        ? (p as { rubricKey: string }).rubricKey
        : null
    );
    
    const rubricKey = await rubricKeyPromise;
    
    if (!rubricKey) {
      return NextResponse.json(
        { error: 'Missing rubric key' },
        { status: 400 }
      );
    }
    
    // Decode the rubricKey (since it's part of the URL)
    const decodedKey = decodeURIComponent(rubricKey);
    
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
    
    console.log('Processing rubric update with data:', {
      key: decodedKey,
      originalKey: rubricData.originalKey,
      originalName: rubricData.originalName,
      newName: rubricData.name,
      nameChanged: rubricData.originalName !== rubricData.name
    });
    
    // Remove metadata fields we don't want to store in the actual rubric
    const { originalKey, originalName, ...dataToSave } = rubricData;
    
    // Handle the case where the name has changed
    let result;
    
    // If the name has changed, we need to create a new file and delete the old one
    if (originalName && originalName !== rubricData.name) {
      console.log(`Rubric name changed from "${originalName}" to "${rubricData.name}"`);
      
      // Create a new rubric with the new name
      result = await updateRubric(decodedKey, userId, dataToSave, username);
      
      // Delete the old rubric file if it exists and has a different key
      if (result.key !== decodedKey) {
        try {
          console.log(`Deleting old rubric file: ${decodedKey}`);
          await deleteRubric(decodedKey, userId, username);
          console.log(`Successfully deleted old rubric: ${decodedKey}`);
        } catch (deleteError) {
          console.error(`Error deleting old rubric ${decodedKey}:`, deleteError);
          // Continue even if delete fails, as the update succeeded
        }
      }
    } else {
      // Standard update without name change
      console.log('Standard update without name change');
      result = await updateRubric(decodedKey, userId, dataToSave, username);
    }
    
    return NextResponse.json({ 
      success: true,
      rubric: result
    });
  } catch (error: any) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: `Failed to update rubric: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/rubrics/[rubricKey] - Delete a specific rubric
export async function DELETE(
  request: NextRequest,
  { params }: { params: unknown }
) {
  try {
    const { isAuthenticated, userId, username } = await getAuthFromCookies();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Safely extract the rubricKey from params using Promise.resolve
    const rubricKeyPromise = Promise.resolve(params).then(p => 
      typeof p === 'object' && p !== null && 'rubricKey' in p
        ? (p as { rubricKey: string }).rubricKey
        : null
    );
    
    const rubricKey = await rubricKeyPromise;
    
    if (!rubricKey) {
      return NextResponse.json(
        { error: 'Missing rubric key' },
        { status: 400 }
      );
    }
    
    // Decode the rubricKey (since it's part of the URL)
    const decodedKey = decodeURIComponent(rubricKey);
    
    // Delete the rubric from S3
    await deleteRubric(decodedKey, userId, username);
    
    return NextResponse.json({ 
      success: true,
      message: 'Rubric deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: `Failed to delete rubric: ${error.message}` },
      { status: 500 }
    );
  }
} 