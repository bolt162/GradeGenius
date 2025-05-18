'use client';
import Image from 'next/image';
import { useState } from 'react';
import Navigation from '../components/Navigation/Navigation';
import Footer from '../components/Footer';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [studentWork, setStudentWork] = useState('');
  const [rubric, setRubric] = useState('');
  const [submissionType, setSubmissionType] = useState<string | undefined>(undefined);
  const [detectedType, setDetectedType] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const maxChars = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentWork.trim()) {
      setError('Please enter the student work to be graded');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setResponse('');
      setDetectedType(undefined);
      setDebugInfo([]);
      
      const startTime = Date.now();
      const res = await fetch('/api/grade?demo=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentWork,
          rubric: rubric || 'Grade on clarity, organization, and accuracy.',
          submissionType,
          demo: true,
        }),
      });
      
      const requestTime = Date.now() - startTime;
      const data = await res.json();
      
      // Check for error response
      if (!res.ok) {
        setError(data.error || `Failed to get response from AI (Status: ${res.status})`);
        
        // Display debug info if available
        if (data.debug && Array.isArray(data.debug)) {
          setDebugInfo(data.debug);
        }
        return;
      }
      
      // Save debug info but don't display it
      if (data.debug && Array.isArray(data.debug)) {
        setDebugInfo(data.debug);
      }
      
      setResponse(data.result);
      setDetectedType(data.detectedType);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the result with proper Markdown rendering
  const formatResult = (text: string) => {
    // Define custom components
    const components = {
      // Headings with proper styling (smaller and black)
      h1: ({children}: {children: React.ReactNode}) => (
        <h1 className="text-xl font-bold text-black mt-5 mb-3">{children}</h1>
      ),
      h2: ({children}: {children: React.ReactNode}) => (
        <h2 className="text-lg font-bold text-black mt-4 mb-2">{children}</h2>
      ),
      h3: ({children}: {children: React.ReactNode}) => (
        <h3 className="text-base font-bold text-black mt-3 mb-2">{children}</h3>
      ),
      h4: ({children}: {children: React.ReactNode}) => (
        <h4 className="text-sm font-bold text-black mt-3 mb-1">{children}</h4>
      ),
      h5: ({children}: {children: React.ReactNode}) => (
        <h5 className="text-xs font-bold text-black mt-2 mb-1">{children}</h5>
      ),
      h6: ({children}: {children: React.ReactNode}) => (
        <h6 className="text-xs font-bold text-black mt-2 mb-1">{children}</h6>
      ),
      // Other text elements (all black)
      p: ({children}: {children: React.ReactNode}) => (
        <p className="mb-4 leading-relaxed text-black">{children}</p>
      ),
      ul: ({children}: {children: React.ReactNode}) => (
        <ul className="list-disc pl-6 mb-4 space-y-1 text-black">{children}</ul>
      ),
      ol: ({children}: {children: React.ReactNode}) => (
        <ol className="list-decimal pl-6 mb-4 space-y-1 text-black">{children}</ol>
      ),
      li: ({children}: {children: React.ReactNode}) => (
        <li className="mb-1 text-black">{children}</li>
      ),
      blockquote: ({children}: {children: React.ReactNode}) => (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-black">{children}</blockquote>
      ),
      // Table formatting
      table: ({children}: {children: React.ReactNode}) => (
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border border-gray-300 rounded-md text-black">{children}</table>
        </div>
      ),
      thead: ({children}: {children: React.ReactNode}) => (
        <thead className="bg-gray-100">{children}</thead>
      ),
      tbody: ({children}: {children: React.ReactNode}) => (
        <tbody className="divide-y divide-gray-300">{children}</tbody>
      ),
      tr: ({children}: {children: React.ReactNode}) => (
        <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
      ),
      th: ({children}: {children: React.ReactNode}) => (
        <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">{children}</th>
      ),
      td: ({children}: {children: React.ReactNode}) => (
        <td className="px-4 py-3 text-sm border-t border-gray-300 text-black">{children}</td>
      ),
      // Formatting for emphasis
      strong: ({children}: {children: React.ReactNode}) => (
        <strong className="font-bold text-black">{children}</strong>
      ),
      em: ({children}: {children: React.ReactNode}) => (
        <em className="italic text-black">{children}</em>
      ),
      a: ({href, children}: {href?: string, children: React.ReactNode}) => (
        <a href={href} className="text-blue-600 hover:text-blue-500 underline" target="_blank" rel="noopener noreferrer">{children}</a>
      ),
      // Custom code handling with type casting
      code: ({className, children}: {className?: string, children: React.ReactNode}) => {
        // Check if this is a code block with a language (not an inline code)
        const match = /language-(\w+)/.exec(className || '');
        const content = String(children).replace(/\n$/, '');
        
        if (match && typeof children === 'string') {
          // Code block with language
          return (
            // @ts-ignore - Type issues with SyntaxHighlighter
            <SyntaxHighlighter style={vscDarkPlus} language={match[1]}>
              {content}
            </SyntaxHighlighter>
          );
        }
        
        // Inline code
        return (
          <code className="bg-gray-100 px-1 rounded text-black font-mono text-sm">{children}</code>
        );
      }
    };

    // Check if response contains multiple sections separated by delimiter
    const sections = text.split('\n\n---\n\n');
    const hasMultipleQuestions = sections.length > 1;

    if (hasMultipleQuestions) {
      return (
        <div className="prose max-w-none text-black">
          {sections.map((section, index) => (
            <div key={index} className={index > 0 ? "mt-8 pt-8 border-t border-gray-200" : ""}>
              <div className="bg-gray-50 px-4 py-3 rounded-lg mb-4">
                <h3 className="text-base font-semibold text-black mb-1">
                  Question {index + 1}
                </h3>
              </div>
              
              {/* @ts-ignore - Using the type ignore for ReactMarkdown props */}
              <ReactMarkdown components={components}>
                {section}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      );
    }

    // Default rendering for single section
    return (
      <div className="prose max-w-none text-black">
        {/* @ts-ignore - Using the type ignore for ReactMarkdown props */}
        <ReactMarkdown components={components}>
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text tracking-tight">Experience GradeGenius in Action</h1>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">Try our AI-powered grading system with your own content</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="studentWork" className="block text-lg font-medium text-neutral-700 mb-2">
                    Student Work
                  </label>
                  <div className="relative">
                    <textarea
                      id="studentWork"
                      name="studentWork"
                      rows={10}
                      maxLength={maxChars}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black"
                      placeholder="Paste student essay, code, or other work to be graded..."
                      value={studentWork}
                      onChange={(e) => setStudentWork(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-neutral-500">
                      {maxChars - studentWork.length} characters left
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="submissionType" className="block text-lg font-medium text-neutral-700 mb-2">
                    Submission Type
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="auto-detect"
                        name="submissionType"
                        value=""
                        checked={submissionType === undefined}
                        onChange={() => setSubmissionType(undefined)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="auto-detect" className="ml-2 text-neutral-700">
                        Auto-detect
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="code"
                        name="submissionType"
                        value="code"
                        checked={submissionType === 'code'}
                        onChange={() => setSubmissionType('code')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="code" className="ml-2 text-neutral-700">
                        Code
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="essay"
                        name="submissionType"
                        value="essay"
                        checked={submissionType === 'essay'}
                        onChange={() => setSubmissionType('essay')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="essay" className="ml-2 text-neutral-700">
                        Essay
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="rubric" className="block text-lg font-medium text-neutral-700 mb-2">
                    Grading Rubric (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      id="rubric"
                      name="rubric"
                      rows={5}
                      maxLength={maxChars}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black"
                      placeholder="Enter specific grading criteria or instructions... (Default: Grade on clarity, organization, and accuracy)"
                      value={rubric}
                      onChange={(e) => setRubric(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-neutral-500">
                      {maxChars - rubric.length} characters left
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm py-2">
                    <p>{error}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Grading...' : 'Grade Work'}
                </button>
              </form>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">AI Assessment</h2>
              
              {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="animate-pulse text-indigo-600">
                    <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
                    </svg>
                    <p className="mt-2">Analyzing submission...</p>
                  </div>
                </div>
              ) : response ? (
                <>
                  {detectedType && (
                    <div className="mb-3 text-sm bg-indigo-50 text-indigo-700 rounded-md px-3 py-1 inline-block">
                      Detected as: {detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} submission
                    </div>
                  )}
                  <div className="flex-grow overflow-auto max-h-[400px] h-[400px] border border-gray-100 rounded-lg p-4">
                    {formatResult(response)}
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-neutral-500 text-center">
                  <div>
                    <Image 
                      src="/images/main_logo.png"
                      alt="GradeGenius Logo"
                      width={64}
                      height={64}
                      className="w-16 h-16 mx-auto opacity-50 mb-4"
                    />
                    <p>Your AI assessment will appear here</p>
                    <p className="text-sm mt-2">Submit student work to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
