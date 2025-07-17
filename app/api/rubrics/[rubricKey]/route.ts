import { NextResponse, NextRequest } from 'next/server';
import { getRubric, storeRubric, deleteRubric } from '@/app/lib/s3';
import { getAuthFromCookies } from '@/app/lib/auth-utils';

// Import constants from the main route file
const MAX_QUESTIONS_PER_RUBRIC = 20;
const MAX_CHARACTERS_PER_QUESTION = 500;

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
    
    // Get the rubric from S3
    const rubric = await getRubric(decodedKey, userId, username);
    
    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ rubric });
  } catch (error: unknown) {
    console.error('Error getting rubric:', error);
    return NextResponse.json(
      { error: `Failed to fetch rubric: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
    
    // Validate number of questions doesn't exceed maximum
    if (rubricData.questions && rubricData.questions.length > MAX_QUESTIONS_PER_RUBRIC) {
      return NextResponse.json(
        { error: `Rubrics can have at most ${MAX_QUESTIONS_PER_RUBRIC} questions` },
        { status: 400 }
      );
    }
    
    // Validate each question is within character limit
    if (rubricData.questions && rubricData.questions.some((q: string) => q.length > MAX_CHARACTERS_PER_QUESTION)) {
      return NextResponse.json(
        { error: `Each question must be ${MAX_CHARACTERS_PER_QUESTION} characters or less` },
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
        if (rubricData.partialCreditCriteria[i] && rubricData.partialCreditCriteria[i].length > MAX_CHARACTERS_PER_QUESTION) {
          return NextResponse.json(
            { error: `Partial credit criteria for question ${i + 1} must be ${MAX_CHARACTERS_PER_QUESTION} characters or less` },
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
    if (originalName !== rubricData.name) {
      console.log('Rubric name changed, need to handle key update');
      
      // If the name changed, we need to:
      // 1. Store with the new key (based on new name)
      // 2. Delete the old rubric
      try {
        // Store the new rubric
        result = await storeRubric(userId, rubricData.name, dataToSave, username);
        
        // Delete the old rubric only if the new one was successfully stored
        // Use the original key from the request body if available, otherwise use the URL key
        const keyToDelete = originalKey || decodedKey;
        await deleteRubric(keyToDelete, userId, username);
        
        console.log('Successfully updated rubric with name change');
      } catch (error) {
        console.error('Error updating rubric with name change:', error);
        throw error;
      }
    } else {
      // Name didn't change, just update in place
      result = await storeRubric(userId, rubricData.name, dataToSave, username);
      console.log('Successfully updated rubric without name change');
    }
    
    return NextResponse.json({ 
      success: true,
      rubric: result
    });
  } catch (error: unknown) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: `Failed to update rubric: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
  } catch (error: unknown) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: `Failed to delete rubric: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 