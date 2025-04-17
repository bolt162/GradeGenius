import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { studentWork, rubric } = body;

    if (!studentWork) {
      return NextResponse.json(
        { error: 'Student work is required' },
        { status: 400 }
      );
    }

    // Initialize the language model
    const model = new ChatOpenAI({
      temperature: 0.3,
      modelName: "gpt-3.5-turbo",
    });

    // Create a prompt template
    const template = `
You are GradeGenius, an AI assistant specialized in grading academic submissions.

GRADING RUBRIC:
{rubric}

STUDENT SUBMISSION:
{studentWork}

INSTRUCTIONS:
1. Evaluate the student submission based on the provided rubric.
2. Start with a brief summary of the submission.
3. Provide a detailed assessment organized by rubric criteria.
4. Include specific examples and quotes from the submission to support your evaluation.
5. Suggest specific improvements the student could make.
6. Conclude with an overall grade (letter grade A-F or numerical score out of 100) and brief justification.

FORMAT YOUR RESPONSE AS FOLLOWS:
# Summary
[Brief summary of the submission]

# Detailed Assessment
[Assessment organized by criteria with specific examples]

# Areas for Improvement
[Constructive suggestions for improvement]

# Overall Grade
[Letter grade A-F or numerical score /100] - [Brief justification]
`;

    const prompt = PromptTemplate.fromTemplate(template);
    
    // Generate the response
    const formattedPrompt = await prompt.format({
      studentWork,
      rubric,
    });

    const response = await model.invoke(formattedPrompt);
    
    // Return the result
    return NextResponse.json({ result: response.content });
  } catch (error) {
    console.error('Error in grade API route:', error);
    return NextResponse.json(
      { error: 'Failed to process grading request' },
      { status: 500 }
    );
  }
} 