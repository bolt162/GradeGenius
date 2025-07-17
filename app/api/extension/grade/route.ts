import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromExtensionToken } from '@/app/lib/extension-auth';
import { ChatOpenAI } from '@langchain/openai';
import { detectSubmissionType } from '@/app/lib/contentAnalyzer';
import { getRubric } from '@/app/lib/s3';
import { getUserTokens, spendUserTokens, calculateTokens } from '@/app/lib/dynamo';
import { PromptTemplate } from '@langchain/core/prompts';
import { singleQuestionGradingPrompt, defaultGradingPrompt } from '@/app/lib/prompts';
import { RAGService } from '@/app/lib/rag/ragService';

// Initialize RAG service
const ragService = new RAGService();

// POST /api/extension/grade - Grade submission from extension
export async function POST(request: NextRequest) {
  try {
    // Authenticate with extension token
    const { isAuthenticated, userId, username } = await getAuthFromExtensionToken();
    
    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please authenticate the extension first.' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate that only required parameters are provided
    const allowedParams = ['studentWork', 'submissionType', 'selectedRubricKey'];
    const extraParams = Object.keys(body).filter(key => !allowedParams.includes(key));
    
    if (extraParams.length > 0) {
      return NextResponse.json(
        { error: `Invalid parameters: ${extraParams.join(', ')}. Only studentWork, submissionType, and selectedRubricKey are allowed.` },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    const { studentWork, submissionType, selectedRubricKey } = body;

    if (!studentWork) {
      return NextResponse.json(
        { error: 'Student work is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    if (!selectedRubricKey) {
      return NextResponse.json(
        { error: 'A rubric selection is required. Please select a rubric from your saved rubrics.' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Calculate tokens for all requests to use in the response
    const tokensNeeded = calculateTokens(studentWork);
    
    // Check if user has enough tokens
    const userTokenData = await getUserTokens(userId);
    
    if (!userTokenData) {
      return NextResponse.json(
        { 
          error: 'Unable to retrieve token information. Please try again.' 
        },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
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
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
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
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // Detect submission type if not provided
    let detectedType: 'code' | 'essay';
    
    if (submissionType === 'code' || submissionType === 'essay') {
      detectedType = submissionType;
    } else {
      detectedType = detectSubmissionType(studentWork);
    }
    
    // Get rubric details from the selected rubric key (mandatory)
    let rubricQuestions: string[] = [];
    let partialCreditEnabled: boolean[] = [];
    let partialCreditCriteria: string[] = [];
    let courseInfo = { course: "", specialization: "", classLevel: "" };
    
    try {
      const rubricData = await getRubric(selectedRubricKey, userId, username || userId);
      if (!rubricData) {
        return NextResponse.json(
          { error: 'The selected rubric could not be found or is invalid.' },
          { 
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }
      
      // Extract rubric questions from questions array
      if (rubricData.questions && Array.isArray(rubricData.questions) && rubricData.questions.length > 0) {
        rubricQuestions = rubricData.questions;
        partialCreditEnabled = rubricData.partialCreditEnabled || rubricQuestions.map(() => false);
        partialCreditCriteria = rubricData.partialCreditCriteria || rubricQuestions.map(() => '');
        
        // Extract course information from the rubric if available
        courseInfo = {
          course: rubricData.course || "",
          specialization: rubricData.specialization || "",
          classLevel: rubricData.classLevel || ""
        };
      } else {
        return NextResponse.json(
          { error: 'The selected rubric does not contain any grading criteria.' },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }
      
      console.log('[Extension API] Retrieved rubric:', {
        key: selectedRubricKey,
        name: rubricData.name || 'Unnamed rubric',
        questionsCount: rubricQuestions.length
      });
    } catch (error) {
      console.error('[Extension API] Error fetching rubric:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve the selected rubric. Please try again or select a different rubric.' },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Generate a virtual file key for extension submissions (needed for RAG but won't be saved)
    const timestamp = Date.now();
    const virtualFileKey = `${username || userId}/extension/${timestamp}-submission.txt`;
    
    // Process the submission for RAG context
    try {
      console.log('[Extension API] Processing submission with RAG service');
      await ragService.processSubmission({
        content: studentWork,
        type: detectedType,
        userId,
        fileKey: virtualFileKey
      });
    } catch (ragError: any) {
      console.error('[Extension API] RAG processing failed:', ragError);
      // Continue without RAG processing if it fails
    }
    
    // Process each question in the rubric
    let responseContent = '';
    
    if (rubricQuestions.length > 0) {
      console.log('[Extension API] Processing individual questions from rubric');
      
      const questionResponses = [];
      
      // Process each question with its own context
      for (let i = 0; i < rubricQuestions.length; i++) {
        const question = rubricQuestions[i];
        console.log(`[Extension API] Processing question ${i+1}: ${question.substring(0, 50)}...`);
        
        // Retrieve relevant context for this specific question
        let questionContext = null;
        try {
          questionContext = await ragService.retrieveContext(
            question,
            {
              contentType: detectedType,
              userId,
              fileKey: virtualFileKey
            }
          );
          
          console.log(`[Extension API] Retrieved context for question ${i+1}:`, questionContext ? questionContext.chunks.length : 'none');
        } catch (contextError) {
          console.error(`[Extension API] Error retrieving context for question ${i+1}:`, contextError);
        }
        
        // Format the prompt with the question and context
        const promptTemplate = PromptTemplate.fromTemplate(singleQuestionGradingPrompt);
        
        const formattedPrompt = await promptTemplate.format({
          course: courseInfo.course || "Not specified",
          specialization: courseInfo.specialization || "Not specified",
          classLevel: courseInfo.classLevel || "Not specified",
          question: question,
          weight: 10, // Default weight of 10 points
          partialCreditEnabled: partialCreditEnabled[i] ? "Yes" : "No",
          partialCreditCriteria: partialCreditEnabled[i] ? (partialCreditCriteria[i] || "No specific criteria provided") : "Not applicable",
          context: questionContext ? JSON.stringify(questionContext.chunks) : studentWork
        });
        
        console.log(`[Extension API] Sending prompt for question ${i+1} to AI model`);
        
        // Call the AI with the formatted prompt with retries
        let response;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            response = await model.invoke(formattedPrompt);
            break; // Success, exit the loop
          } catch (error: any) {
            retries++;
            console.error(`[Extension API] Error calling AI (attempt ${retries}/${maxRetries}):`, error);
            
            if (retries >= maxRetries) {
              // All retries failed, but continue with other questions
              console.error(`[Extension API] Failed to grade question ${i+1} after ${maxRetries} attempts`);
              questionResponses.push(`Failed to grade question: ${question}`);
              break;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        }

        if (response) {
          questionResponses.push(String(response.content));
        }
      }
      
      // Combine all responses
      responseContent = questionResponses.join("\n\n---\n\n");
    } else {
      // Should not reach here due to previous validation, but just in case
      console.log('[Extension API] No rubric questions found, using default prompt');
      
      const promptTemplate = PromptTemplate.fromTemplate(defaultGradingPrompt);
      
      const formattedPrompt = await promptTemplate.format({
        rubric: rubricQuestions.join('\n') || "Grade on clarity, organization, and accuracy.",
        studentWork: studentWork
      });
      
      // Call the AI with the formatted prompt
      let response;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          response = await model.invoke(formattedPrompt);
          break; // Success, exit the loop
        } catch (error: any) {
          retries++;
          console.error(`[Extension API] Error calling AI (attempt ${retries}/${maxRetries}):`, error);
          
          if (retries >= maxRetries) {
            // All retries failed
            return NextResponse.json(
              { error: `Failed to grade submission after ${maxRetries} attempts: ${error.message}` },
              { 
                status: 500,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
              }
            );
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }

      if (!response) {
        return NextResponse.json(
          { error: 'Failed to generate a response from the AI model.' },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }

      responseContent = response.content.toString();
    }
    
    // Note: We're no longer storing extension feedback in S3
    // The code that called storeGradeResult has been removed
    
    // Spend tokens for this grading operation
    try {
      await spendUserTokens(userId, tokensNeeded);
    } catch (tokenError) {
      console.error('[Extension API] Failed to spend tokens:', tokenError);
      // Continue even if spending tokens fails
    }
    
    // Return the grading result
    return NextResponse.json(
      { 
        success: true,
        feedback: responseContent,
        type: detectedType,
        tokensUsed: tokensNeeded,
        tokensRemaining: userTokenData - tokensNeeded
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error: any) {
    console.error('[Extension API] Extension grading error:', error);
    return NextResponse.json(
      { error: `Grading failed: ${error.message}` },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}