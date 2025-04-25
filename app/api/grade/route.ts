import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { detectSubmissionType } from '../../lib/contentAnalyzer';
import { classifySubmissionType } from '../../lib/classificationAgent';
import { codeGradingPrompt, essayGradingPrompt, defaultGradingPrompt } from '../../lib/prompts';
import { storeGradeResult } from '../../lib/s3';
import { getUserTokens, spendUserTokens, calculateTokens } from '../../lib/dynamo';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  
  try {
    // Check if this is a demo request
    const isDemo = request.nextUrl.searchParams.has('demo') || request.nextUrl.pathname.includes('/demo');
    
    let userId = null;
    let username = null;
    
    // Skip authentication check for demo requests
    if (!isDemo) {
      // Manual check for authentication using cookies
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('__session');
      const clerkDbJwtCookie = cookieStore.get('__clerk_db_jwt');
      
      try {
        // Try to extract userId from session cookie if available
        if (sessionCookie?.value) {
          const parts = sessionCookie.value.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString()
            );
            userId = payload.sub || null;
            username = payload.username || payload.email || userId;
          }
        }
      } catch (error: any) {
        console.error('Error parsing session cookie:', error);
      }

      // If no cookies are present or userId not found, the user is not authenticated
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        );
      }
    } else {
      // Use default demo user for demo requests
      userId = 'demo_user';
      username = 'Demo User';
    }
    
    // Parse the request body
    const body = await request.json();
    const { studentWork, rubric, submissionType, fileName, fileKey } = body;

    if (!studentWork) {
      return NextResponse.json(
        { error: 'Student work is required' },
        { status: 400 }
      );
    }
    
    // Calculate tokens for all requests to use in the response
    const combinedContent = studentWork + (rubric || '');
    const tokensNeeded = calculateTokens(combinedContent);
    
    // Skip token check for demo requests
    if (!isDemo) {
      // Check if user has enough tokens
      const userTokenData = await getUserTokens(userId);
      
      if (!userTokenData) {
        return NextResponse.json(
          { error: 'Unable to retrieve token information. Please try again.' },
          { status: 403 }
        );
      }
      
      // Check if user has enough tokens
      if (userTokenData < tokensNeeded) {
        return NextResponse.json(
          { 
            error: 'Insufficient tokens for grading. Please purchase more tokens.', 
            insufficientTokens: true,
            tokensNeeded,
            tokensAvailable: userTokenData
          },
          { status: 403 }
        );
      }
    }

    // Initialize the language model
    let model: ChatOpenAI;
    
    try {
      model = new ChatOpenAI({
        temperature: 0.1,
        modelName: "gpt-3.5-turbo",
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to initialize AI model: ${error?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // TEMPORARY DEBUGGING - Skip AI classification and just use basic detection
    // This helps isolate if the OpenAI API is the problem
    let detectedType: 'code' | 'essay';
    
    if (submissionType === 'code' || submissionType === 'essay') {
      // Use the explicitly provided type
      detectedType = submissionType;
    } else {
      // Only use basic detection for now to bypass potential OpenAI issues
      detectedType = detectSubmissionType(studentWork);
    }

    // Select the appropriate prompt template based on submission type
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
    const formattedPrompt = await prompt.format({
      studentWork,
      rubric: rubric || 'Grade on clarity, organization, and accuracy.',
    });

    const openaiCallStart = Date.now();
    try {
      const response = await model.invoke(formattedPrompt);
      const duration = Date.now() - openaiCallStart;
      
      const gradeResult = response.content;
      
      // Store the grade in S3 if we have a fileKey
      let gradeStorageResult = null;
      if (fileKey) {
        try {
          // Use the username we extracted from the session cookie
          const user_name = username || userId;
          
          gradeStorageResult = await storeGradeResult(
            fileKey,
            userId,
            gradeResult as string,
            rubric || 'Grade on clarity, organization, and accuracy.',
            user_name
          );
        } catch (storageError: any) {
          // Continue execution even if storage fails
          console.error('Failed to store grade:', storageError);
        }
      }
      
      // Deduct tokens from user's account
      try {
        // Skip token deduction for demo users
        if (!isDemo) {
          await spendUserTokens(userId, tokensNeeded);
        }
      } catch (tokenError: any) {
        // Continue execution even if token deduction fails
        console.error('Failed to deduct tokens:', tokenError);
      }
      
      // Return the result
      const totalTime = Date.now() - requestStartTime;
      return NextResponse.json({ 
        result: gradeResult,
        detectedType,
        processingTime: totalTime,
        gradeStored: !!gradeStorageResult,
        tokensUsed: tokensNeeded
      });
    } catch (error: any) {
      let errorDetails = `OpenAI API call failed: ${error?.message || 'Unknown error'}`;
      
      // Add detailed error info if available
      if (error.response) {
        const responseDetails = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data || {}).substring(0, 200)}`;
        errorDetails += ` - ${responseDetails}`;
      }
      
      return NextResponse.json(
        { error: errorDetails },
        { status: 502 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `Unhandled error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 