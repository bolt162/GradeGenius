import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Classification agent to determine if content is primarily code or essay
 */
export async function classifySubmissionType(content: string): Promise<'code' | 'essay'> {
  console.log('CLASSIFIER: Starting content classification');
  // Skip classification for very short content
  if (content.length < 50) {
    // Use simpler heuristics for short content
    console.log('CLASSIFIER: Content too short, using simple heuristics');
    const codeCharRatio = (content.match(/[{};()[\]=<>!&|+\-*/%^]/g) || []).length / content.length;
    const result = codeCharRatio > 0.15 ? 'code' : 'essay';
    console.log(`CLASSIFIER: Short content classified as ${result} (code char ratio: ${codeCharRatio})`);
    return result;
  }

  try {
    console.log('CLASSIFIER: Initializing OpenAI model for classification');
    // Initialize the language model with lower temperature for classification tasks
    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-3.5-turbo", // Using the same model as the grading for consistency
    });
    console.log('CLASSIFIER: Model initialized successfully');

    // Create a specialized prompt for classification
    console.log('CLASSIFIER: Creating classification prompt');
    const classificationPrompt = PromptTemplate.fromTemplate(`
You are a content classifier that determines if text is primarily CODE or ESSAY.

SUBMISSION:
\`\`\`
{content}
\`\`\`

CLASSIFICATION RULES:
- CODE: Primarily functional programming code with logic, functions, data structures, etc.
- ESSAY: Primarily natural language text, even if it discusses programming or contains small code examples.

Consider these factors:
1. Overall structure and purpose of the text
2. Ratio of natural language to code syntax
3. Whether code snippets are the focus or merely examples in a larger text
4. Presence of narrative, arguments, or explanations (indicates ESSAY)
5. Presence of executable logic that forms a complete program (indicates CODE)

Your answer must be exactly "CODE" or "ESSAY" with nothing else.
    `);

    // Format and send the prompt
    console.log('CLASSIFIER: Formatting prompt with content');
    const formattedPrompt = await classificationPrompt.format({
      content: content.substring(0, 1500), // Limit content length
    });

    // Get classification
    console.log('CLASSIFIER: Sending request to OpenAI');
    const openaiStart = Date.now();
    try {
      const response = await model.invoke(formattedPrompt);
      console.log(`CLASSIFIER: OpenAI response received in ${Date.now() - openaiStart}ms`);
      
      // Handle the response content which could be string or complex type
      let classification: string;
      if (typeof response.content === 'string') {
        classification = response.content.trim().toUpperCase();
      } else {
        // If it's a complex type, extract the text content
        const textContent = response.content.map(item => {
          if (typeof item === 'string') {
            return item;
          } else if (item.type === 'text') {
            return item.text;
          }
          return '';
        }).join('').trim().toUpperCase();
        
        classification = textContent;
      }
      
      console.log(`CLASSIFIER: Classification result: ${classification}`);

      // Parse and return the result
      if (classification === 'CODE') {
        return 'code';
      } else {
        return 'essay';
      }
    } catch (error: any) {
      console.error('CLASSIFIER ERROR: OpenAI API call failed:', error);
      if (error.response) {
        console.error('CLASSIFIER ERROR: OpenAI response details:', 
          error.response.status, 
          error.response.data
        );
      }
      throw error; // Re-throw to be handled by the caller
    }
  } catch (error: any) {
    console.error('CLASSIFIER ERROR: Unhandled error:', error);
    console.log('CLASSIFIER: Falling back to basic detection');
    
    // Fall back to simpler detection if AI classification fails
    const codeCharRatio = (content.match(/[{};()[\]=<>!&|+\-*/%^]/g) || []).length / content.length;
    const hasCodePatterns = /function|const|let|var|if|for|while|class|return|import|export|=>/i.test(content);
    
    const fallbackResult = (codeCharRatio > 0.05 && hasCodePatterns) ? 'code' : 'essay';
    console.log(`CLASSIFIER: Fallback classification result: ${fallbackResult}`);
    return fallbackResult;
  }
} 