import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { detectSubmissionType } from '../../lib/contentAnalyzer';
import { codeGradingPrompt, essayGradingPrompt, defaultGradingPrompt, singleQuestionGradingPrompt } from '../../lib/prompts';
import { storeGradeResult, getFileContent, getDocumentContent, getRubric } from '../../lib/s3';
import { getUserTokens, spendUserTokens, calculateTokens } from '../../lib/dynamo';
import { cookies } from 'next/headers';
import { RAGService } from '../../lib/rag/ragService';

// Initialize RAG service
const ragService = new RAGService();

export async function POST(request: NextRequest) {
  console.log('Grade request received');
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
    const { studentWork, rubric, submissionType, fileName, fileKey, selectedRubricKey } = body;

    if (!studentWork) {
      return NextResponse.json(
        { error: 'Student work is required' },
        { status: 400 }
      );
    }
    
    // Each grading operation costs exactly 1 token
    const tokensNeeded = 1;
    
    // Skip token check for demo requests
    if (!isDemo) {
      // Check if user has enough tokens
      const userTokenData = await getUserTokens(userId);
      
      // Fix: Check explicitly for null or undefined instead of using falsy check
      if (userTokenData === null || userTokenData === undefined) {
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
        modelName: "gpt-4o",
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to initialize AI model: ${error?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Detect submission type
    let detectedType: 'code' | 'essay';
    
    if (submissionType === 'code' || submissionType === 'essay') {
      console.log('[Grade API] Submission type detected:', submissionType);
      detectedType = submissionType;
    } else {
      detectedType = detectSubmissionType(studentWork);
      console.log('[Grade API] Submission detected after evaluation:', detectedType);
    }

    // Process submission with RAG if we have a fileKey
    let actualContent = studentWork; // Store the actual content

    if (fileKey) {
      try {
        // Get the actual content from S3 if we have a fileKey
        try {
          console.log('[Grade API] Fetching content from S3 for:', fileKey);
          
          // Check if the file is a document type (docx or doc)
          const isDocument = fileKey.toLowerCase().endsWith('.docx') || fileKey.toLowerCase().endsWith('.doc');
          
          // Use the appropriate method to get content based on file type
          let content;
          if (isDocument) {
            console.log('[Grade API] Detected document file type, using document content extractor');
            content = await getDocumentContent(fileKey);
            // If this is a document, it's likely an essay, so override the detection
            if (detectedType === 'code') {
              console.log('[Grade API] Overriding detected type from code to essay for document file');
              detectedType = 'essay';
            }
          } else {
            content = await getFileContent(fileKey);
          }
          
          if (content) {
            actualContent = content;
            console.log('[Grade API] Retrieved content from S3:', {
              contentLength: actualContent.length,
              sampleContent: actualContent.substring(0, 100),
              isUrl: actualContent.startsWith('http'),
              firstLine: actualContent.split('\n')[0]
            });
          } else {
            console.log('[Grade API] No content received from S3, falling back to studentWork');
          }
        } catch (contentError) {
          console.error('[Grade API] Error fetching content from S3:', contentError);
          // Continue with the original content if we can't get it from S3
        }

        // Process the submission for future reference
        console.log('[Grade API] Content being sent to RAGService:', {
          contentLength: actualContent.length,
          contentType: typeof actualContent,
          isUrl: actualContent.startsWith('http'),
          firstLine: actualContent.split('\n')[0]
        });
        
        await ragService.processSubmission({
          content: actualContent, // Use the actual content
          type: detectedType,
          userId,
          fileKey
        });
      } catch (ragError: any) {
        console.error('RAG processing failed:', ragError);
        // Continue without RAG context if it fails
      }
    }

    // Get rubric details if a saved rubric was selected
    let rubricDetails = null;
    let rubricQuestions: string[] = [];
    let rubricWeights: number[] = [];
    let partialCreditEnabled: boolean[] = [];
    let partialCreditCriteria: string[] = [];
    let courseInfo = { course: "", specialization: "", classLevel: "" };
    
    // If we have a selected rubric key, fetch the rubric details
    if (selectedRubricKey) {
      try {
        const rubricData = await getRubric(selectedRubricKey, userId, username);
        if (rubricData) {
          rubricDetails = rubricData;
          rubricQuestions = rubricData.questions || [];
          rubricWeights = rubricData.questionWeights || rubricQuestions.map(() => 10);
          partialCreditEnabled = rubricData.partialCreditEnabled || rubricQuestions.map(() => false);
          partialCreditCriteria = rubricData.partialCreditCriteria || rubricQuestions.map(() => '');
          
          // Extract course information
          courseInfo = {
            course: rubricData.course || "",
            specialization: rubricData.specialization || "",
            classLevel: rubricData.classLevel || ""
          };
          
          console.log('[Grade API] Retrieved rubric details:', {
            name: rubricData.name,
            numQuestions: rubricQuestions.length,
            courseInfo,
            questions: rubricQuestions,
            weights: rubricWeights,
            completeRubricData: JSON.stringify(rubricData)
          });
        }
      } catch (error) {
        console.error('[Grade API] Error fetching rubric details:', error);
      }
    } else if (rubric) {
      // If using a manual rubric, split by newlines to get questions
      rubricQuestions = rubric.split('\n').filter((q: string) => q.trim().length > 0);
      // For manual rubrics, default all weights to 10
      rubricWeights = rubricQuestions.map(() => 10);
      console.log('[Grade API] Using manual rubric:', {
        rubricText: rubric,
        parsedQuestions: rubricQuestions,
        weights: rubricWeights
      });
    }

    let responseText = '';
    
    // If not a demo request, always use the RAG context approach
    if (!isDemo) {
      if (rubricQuestions.length > 0) {
        console.log('[Grade API] Processing individual questions from rubric');
        
        let questionResponses = [];
        
        // Process each question with its own context
        for (let i = 0; i < rubricQuestions.length; i++) {
          const question = rubricQuestions[i];
          console.log(`[Grade API] Processing question ${i+1}: ${question.substring(0, 50)}...`);
          
          // Retrieve relevant context for this specific question
          let questionContext = null;
          try {
            questionContext = await ragService.retrieveContext(
              question,
              {
                contentType: detectedType,
                userId,
                fileKey: fileKey || undefined
              }
            );
            
            console.log(`[Grade API] Retrieved context for question ${i+1}:`, questionContext ? questionContext.chunks.length : 'none');
          } catch (contextError) {
            console.error(`[Grade API] Error retrieving context for question ${i+1}:`, contextError);
          }
          
          // Format the prompt with the question and context
          const promptTemplate = PromptTemplate.fromTemplate(singleQuestionGradingPrompt);
          
          const formattedPrompt = await promptTemplate.format({
            course: courseInfo.course || "General",
            specialization: courseInfo.specialization || "General",
            classLevel: courseInfo.classLevel || "General",
            question: question,
            weight: rubricWeights[i] || 10,
            partialCreditEnabled: partialCreditEnabled[i] ? "Yes" : "No",
            partialCreditCriteria: partialCreditEnabled[i] ? (partialCreditCriteria[i] || "No specific criteria provided") : "Not applicable",
            context: questionContext ? JSON.stringify(questionContext.chunks.map(chunk => chunk.content)) : "No additional context available."
          });
          
          console.log(`[Grade API] Prompt for question ${i+1}:`, formattedPrompt);
          console.log(`[Grade API] Sending prompt for question ${i+1} to AI model`);
          
          // Get response from AI model
          const response = await model.invoke(formattedPrompt);
          questionResponses.push(String(response.content));
        }
        
        // Combine all responses
        responseText = questionResponses.join("\n\n---\n\n");
      } else {
        console.log('[Grade API] No rubric questions found, using default prompt with context');
        
        // Default to single question approach for backward compatibility
        let defaultContext = null;
        try {
          defaultContext = await ragService.retrieveContext(
            "Grade this submission",
            {
              contentType: detectedType,
              userId,
              fileKey: fileKey || undefined
            }
          );
        } catch (contextError) {
          console.error('[Grade API] Error retrieving default context:', contextError);
        }
        
        // Use default grading prompt with context
        const promptTemplate = PromptTemplate.fromTemplate(defaultGradingPrompt);
        
        const formattedPrompt = await promptTemplate.format({
          rubric: rubric || "Grade on clarity, organization, and accuracy.",
          studentWork: actualContent,
          context: defaultContext ? JSON.stringify(defaultContext.chunks.map(chunk => chunk.content)) : "No additional context available."
        });
        
        console.log('[Grade API] Default prompt:', formattedPrompt);
        console.log('[Grade API] Sending default prompt with context to AI model');
        
        // Get response from AI model
        const response = await model.invoke(formattedPrompt);
        responseText = String(response.content);
      }
    } 
    // For demo requests, use regular grading
    else {
      // Choose prompt based on detected type
      console.log('[Grade API] Demo mode: Regular grading');
      let promptTemplate;
      
      if (detectedType === 'code') {
        promptTemplate = PromptTemplate.fromTemplate(codeGradingPrompt);
      } else {
        promptTemplate = PromptTemplate.fromTemplate(essayGradingPrompt);
      }
    
      const formattedPrompt = await promptTemplate.format({
        rubric: rubric || "Grade on clarity, organization, and accuracy.",
        studentWork: actualContent
      });
    
      console.log('[Grade API] Demo mode prompt:', formattedPrompt);
      // Get response from AI model
      const response = await model.invoke(formattedPrompt);
      responseText = String(response.content);
    }
    
    // Store the result in S3 if we have a file key
    let resultKey = null;
    if (fileKey) {
      try {
        const user_name = username || userId;
        resultKey = await storeGradeResult(
          fileKey,
          userId,
          responseText,
          rubric || 'Grade on clarity, organization, and accuracy.',
          user_name,
          rubricQuestions,
          rubricWeights
        );
        console.log('[Grade API] Stored grading result:', resultKey);
      } catch (error) {
        console.error('[Grade API] Error storing result:', error);
        // Continue without storing if it fails
      }
    }
    
    // Deduct tokens for the request (skip for demo)
    if (!isDemo) {
      try {
        await spendUserTokens(userId, tokensNeeded);
        console.log('[Grade API] Tokens spent:', tokensNeeded);
      } catch (error) {
        console.error('[Grade API] Error spending tokens:', error);
        // Continue without deducting if it fails
      }
    }
    
    // Calculate timing
    const requestEndTime = Date.now();
    const requestDuration = requestEndTime - requestStartTime;
    console.log(`[Grade API] Request completed in ${requestDuration}ms`);
    
    return NextResponse.json({
      success: true,
      result: responseText,
      resultKey,
      tokensUsed: tokensNeeded
    });
  } catch (error: any) {
    console.error('[Grade API] Unhandled error:', error);
    return NextResponse.json(
      { error: `Grading failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}