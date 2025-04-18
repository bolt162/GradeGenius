import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { detectSubmissionType } from '../../lib/contentAnalyzer';
import { classifySubmissionType } from '../../lib/classificationAgent';
import { codeGradingPrompt, essayGradingPrompt, defaultGradingPrompt } from '../../lib/prompts';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { studentWork, rubric, submissionType } = body;

    if (!studentWork) {
      return NextResponse.json(
        { error: 'Student work is required' },
        { status: 400 }
      );
    }

    // Initialize the language model
    const model = new ChatOpenAI({
      temperature: 0.1,
      modelName: "gpt-3.5-turbo",
    });

    // Use explicit submission type if provided, otherwise use AI classification
    let detectedType: 'code' | 'essay';
    
    if (submissionType === 'code' || submissionType === 'essay') {
      // Use the explicitly provided type
      detectedType = submissionType;
      console.log(`Using explicit submission type: ${detectedType}`);
    } else {
      // First use the basic heuristic detection as a quick check
      const basicDetection = detectSubmissionType(studentWork);
      
      // If it looks like it could be ambiguous content (like programming explanations),
      // use the AI classifier for a more nuanced decision
      if (
        // Potential ambiguous cases:
        (basicDetection === 'code' && studentWork.length > 100 && studentWork.split(' ').length > 30) || 
        // Text with code snippets might be detected as code but have many words
        (studentWork.includes('```') || studentWork.includes('const ') || studentWork.includes('function '))
      ) {
        console.log('Content may be ambiguous, using AI classification');
        detectedType = await classifySubmissionType(studentWork);
      } else {
        detectedType = basicDetection;
      }
      
      console.log(`Submission AI-classified as: ${detectedType}`);
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

    const response = await model.invoke(formattedPrompt);
    
    // Return the result
    return NextResponse.json({ 
      result: response.content,
      detectedType 
    });
  } catch (error) {
    console.error('Error in grade API route:', error);
    return NextResponse.json(
      { error: 'Failed to process grading request' },
      { status: 500 }
    );
  }
} 