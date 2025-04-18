import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Classification agent to determine if content is primarily code or essay
 */
export async function classifySubmissionType(content: string): Promise<'code' | 'essay'> {
  // Skip classification for very short content
  if (content.length < 50) {
    // Use simpler heuristics for short content
    const codeCharRatio = (content.match(/[{};()[\]=<>!&|+\-*/%^]/g) || []).length / content.length;
    return codeCharRatio > 0.15 ? 'code' : 'essay';
  }

  try {
    // Initialize the language model with lower temperature for classification tasks
    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-3.5-turbo", // Using the same model as the grading for consistency
    });

    // Create a specialized prompt for classification
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
    const formattedPrompt = await classificationPrompt.format({
      content: content.substring(0, 1500), // Limit content length
    });

    // Get classification
    const response = await model.invoke(formattedPrompt);
    
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

    // Parse and return the result
    if (classification === 'CODE') {
      return 'code';
    } else {
      return 'essay';
    }
  } catch (error) {
    console.error('Error in classification agent:', error);
    // Fall back to simpler detection if AI classification fails
    const codeCharRatio = (content.match(/[{};()[\]=<>!&|+\-*/%^]/g) || []).length / content.length;
    const hasCodePatterns = /function|const|let|var|if|for|while|class|return|import|export|=>/i.test(content);
    
    return (codeCharRatio > 0.05 && hasCodePatterns) ? 'code' : 'essay';
  }
} 