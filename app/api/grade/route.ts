import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { auth } from '@clerk/nextjs/server';
import { detectSubmissionType } from '../../lib/contentAnalyzer';
import { classifySubmissionType } from '../../lib/classificationAgent';
import { codeGradingPrompt, essayGradingPrompt, defaultGradingPrompt } from '../../lib/prompts';
import { storeGradeResult } from '../../lib/s3';
import { getUserTokens, spendUserTokens, calculateTokens } from '../../lib/dynamo';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  console.log('BACKEND: API route handler started');
  const requestStartTime = Date.now();
  
  // For debugging - will show in the response
  const debugLog: string[] = ['API route started'];
  let errorDetails = '';
  
  try {
    // Check authentication
    const authObject = await auth();
    const userId = authObject.userId;
    if (!userId) {
      debugLog.push('User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.', debug: debugLog },
        { status: 401 }
      );
    }
    
    // Parse the request body
    debugLog.push('Parsing request body');
    const body = await request.json();
    const { studentWork, rubric, submissionType, fileName, fileKey } = body;
    debugLog.push(`Request parsed - type: ${submissionType || 'auto-detect'}, content length: ${studentWork?.length || 0}`);

    if (!studentWork) {
      debugLog.push('Missing student work');
      return NextResponse.json(
        { error: 'Student work is required', debug: debugLog },
        { status: 400 }
      );
    }
    
    // Check if user has enough tokens
    debugLog.push('Checking token balance');
    const userTokenData = await getUserTokens(userId);
    
    if (!userTokenData) {
      debugLog.push('User token data not found');
      return NextResponse.json(
        { error: 'Unable to retrieve token information. Please try again.', debug: debugLog },
        { status: 403 }
      );
    }
    
    // Calculate tokens needed for this grading operation
    // We add the content length of both student work and rubric
    const combinedContent = studentWork + (rubric || '');
    const tokensNeeded = calculateTokens(combinedContent);
    
    debugLog.push(`Token calculation: ${tokensNeeded} tokens needed, user has ${userTokenData} tokens`);
    
    // Check if user has enough tokens
    if (userTokenData < tokensNeeded) {
      debugLog.push('Insufficient tokens');
      return NextResponse.json(
        { 
          error: 'Insufficient tokens for grading. Please purchase more tokens.', 
          insufficientTokens: true,
          tokensNeeded,
          tokensAvailable: userTokenData,
          debug: debugLog 
        },
        { status: 403 }
      );
    }

    // Initialize the language model
    debugLog.push('Initializing language model');
    let model: ChatOpenAI;
    
    try {
      model = new ChatOpenAI({
        temperature: 0.1,
        modelName: "gpt-3.5-turbo",
      });
      debugLog.push('Language model initialized successfully');
    } catch (error: any) {
      errorDetails = `Failed to initialize AI model: ${error?.message || 'Unknown error'}`;
      debugLog.push(`ERROR: ${errorDetails}`);
      return NextResponse.json(
        { error: errorDetails, debug: debugLog },
        { status: 500 }
      );
    }

    // TEMPORARY DEBUGGING - Skip AI classification and just use basic detection
    // This helps isolate if the OpenAI API is the problem
    let detectedType: 'code' | 'essay';
    debugLog.push('Starting simplified submission type detection');
    
    if (submissionType === 'code' || submissionType === 'essay') {
      // Use the explicitly provided type
      detectedType = submissionType;
      debugLog.push(`Using explicit type: ${detectedType}`);
    } else {
      // Only use basic detection for now to bypass potential OpenAI issues
      detectedType = detectSubmissionType(studentWork);
      debugLog.push(`Basic detection result: ${detectedType}`);
      
      // COMMENTING OUT AI CLASSIFICATION FOR TESTING
      // This helps determine if the AI classification is causing the timeout
      /*
      if (
        (basicDetection === 'code' && studentWork.length > 100 && studentWork.split(' ').length > 30) || 
        (studentWork.includes('```') || studentWork.includes('const ') || studentWork.includes('function '))
      ) {
        debugLog.push('Using AI classification');
        try {
          detectedType = await classifySubmissionType(studentWork);
          debugLog.push(`AI classification result: ${detectedType}`);
        } catch (error: any) {
          debugLog.push(`AI classification failed: ${error?.message}`);
          detectedType = basicDetection;
        }
      }
      */
    }

    // Select the appropriate prompt template based on submission type
    debugLog.push(`Selecting prompt for ${detectedType}`);
    let templateString;
    switch (detectedType) {
      case 'code':
        templateString = codeGradingPrompt;
        break;
      case 'essay':
        templateString = essayGradingPrompt;
        break;
      default:
        templateString = defaultGradingPrompt;
    }

    const prompt = PromptTemplate.fromTemplate(templateString);
    
    // Generate the response
    debugLog.push('Formatting prompt');
    const formattedPrompt = await prompt.format({
      studentWork,
      rubric: rubric || 'Grade on clarity, organization, and accuracy.',
    });

    debugLog.push('Calling OpenAI for grading');
    const openaiCallStart = Date.now();
    try {
      const response = await model.invoke(formattedPrompt);
      const duration = Date.now() - openaiCallStart;
      debugLog.push(`OpenAI grading call successful (${duration}ms)`);
      
      const gradeResult = response.content;
      
      // Store the grade in S3 if we have a fileKey
      let gradeStorageResult = null;
      if (fileKey) {
        try {
          debugLog.push(`Storing grade for file ${fileKey}`);
          
          // Get the current user to access their username
          const user = await currentUser();
          const username = user?.username || user?.firstName?.toLowerCase() || userId;
          
          gradeStorageResult = await storeGradeResult(
            fileKey,
            userId,
            gradeResult as string,
            rubric || 'Grade on clarity, organization, and accuracy.',
            username
          );
          debugLog.push('Grade stored successfully');
        } catch (storageError: any) {
          debugLog.push(`Warning: Failed to store grade: ${storageError.message}`);
          // Continue execution even if storage fails
        }
      } else {
        debugLog.push('No fileKey provided, skipping grade storage');
      }
      
      // Deduct tokens from user's account
      try {
        debugLog.push(`Using ${tokensNeeded} tokens from user account`);
        await spendUserTokens(userId, tokensNeeded);
        debugLog.push('Tokens deducted successfully');
      } catch (tokenError: any) {
        debugLog.push(`Warning: Failed to deduct tokens: ${tokenError.message}`);
        // Continue execution even if token deduction fails
      }
      
      // Return the result
      const totalTime = Date.now() - requestStartTime;
      debugLog.push(`API route completed successfully in ${totalTime}ms`);
      return NextResponse.json({ 
        result: gradeResult,
        detectedType,
        processingTime: totalTime,
        gradeStored: !!gradeStorageResult,
        tokensUsed: tokensNeeded,
        debug: debugLog
      });
    } catch (error: any) {
      errorDetails = `OpenAI API call failed: ${error?.message || 'Unknown error'}`;
      debugLog.push(`ERROR: ${errorDetails}`);
      
      // Add detailed error info if available
      if (error.response) {
        const responseDetails = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data || {}).substring(0, 200)}`;
        debugLog.push(`Response details: ${responseDetails}`);
        errorDetails += ` - ${responseDetails}`;
      }
      
      return NextResponse.json(
        { error: errorDetails, debug: debugLog },
        { status: 502 }
      );
    }
  } catch (error: any) {
    errorDetails = `Unhandled error: ${error?.message || 'Unknown error'}`;
    debugLog.push(`ERROR: ${errorDetails}`);
    return NextResponse.json(
      { error: errorDetails, debug: debugLog },
      { status: 500 }
    );
  }
} 