/**
 * Content analyzer for detecting submission types
 */

// Common code patterns that indicate a programming submission
const CODE_PATTERNS = [
  // Function declarations
  /function\s+\w+\s*\(/i,
  /def\s+\w+\s*\(/i,
  /\w+\s*=\s*function\s*\(/i,
  /const\s+\w+\s*=\s*\(.*\)\s*=>/i,
  
  // Class declarations
  /class\s+\w+/i,
  
  // Import statements
  /import\s+.+\s+from/i,
  /import\s+{.+}\s+from/i,
  /require\s*\(/i,
  /use\s+\w+/i,
  /include\s+[<"']/i,
  
  // Variable declarations with types
  /let\s+\w+:\s*\w+/i,
  /var\s+\w+:\s*\w+/i,
  /const\s+\w+:\s*\w+/i,
  
  // Common programming constructs
  /if\s*\(.+\)\s*{/i,
  /for\s*\(.+\)\s*{/i,
  /while\s*\(.+\)\s*{/i,
  /switch\s*\(.+\)\s*{/i,
  
  // Multi-line comments
  /\/\*[\s\S]*?\*\//,
  
  // Single-line comments (multiple occurrences)
  /\/\/.*\n.*\/\/.*\n.*\/\/.*/,
  /#.*\n.*#.*\n.*#.*/,
  
  // Special programming symbols (multiple occurrences)
  /[{}]{3,}/,  // Multiple braces
  /[();]{5,}/,  // Multiple parentheses/semicolons
];

/**
 * Detects if content appears to be code
 * @param content Text content to analyze
 * @returns True if content appears to be code
 */
export function isCodeSubmission(content: string): boolean {
  // Short content is assumed not to be code
  if (content.length < 10) return false;
  
  // Check for code patterns
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  
  // Count programming-specific characters
  const codeCharRatio = (content.match(/[{};()[\]=<>!&|+\-*/%^]/g) || []).length / content.length;
  if (codeCharRatio > 0.05) {
    return true;
  }
  
  // Check whitespace patterns (code often has consistent indentation)
  const lines = content.split('\n');
  let indentedLines = 0;
  for (const line of lines) {
    if (/^\s{2,}/.test(line)) {
      indentedLines++;
    }
  }
  
  // If more than 25% of lines are indented, likely code
  if (lines.length > 5 && (indentedLines / lines.length) > 0.25) {
    return true;
  }
  
  return false;
}

/**
 * Determines the submission type based on content analysis
 * @param content Text content to analyze
 * @param explicitType Optional explicit type override
 * @returns 'code' or 'essay'
 */
export function detectSubmissionType(content: string, explicitType?: string): 'code' | 'essay' {
  if (explicitType === 'code') return 'code';
  if (explicitType === 'essay') return 'essay';
  
  return isCodeSubmission(content) ? 'code' : 'essay';
} 