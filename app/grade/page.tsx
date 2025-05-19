'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { FileText, Send, Loader2, ChevronLeft, Upload, AlertCircle, CheckCircle, Edit3, ArrowUp, Download, Coins, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Tab } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Loading component for Suspense fallback
function GradePageLoading() {
  return (
    <Layout activePage="assignments">
      <div className="container mx-auto">
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
          <p className="text-lg">Loading assignment...</p>
        </div>
      </div>
    </Layout>
  );
}

// Main component that uses useSearchParams
function GradePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileKeyParam = searchParams.get('fileKey');
  const { user, isLoaded } = useUser();
  
  const [fileContent, setFileContent] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [rubric, setRubric] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [directTextInput, setDirectTextInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tokenInfo, setTokenInfo] = useState<{ tokensNeeded: number; tokensAvailable: number; } | null>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [userRubrics, setUserRubrics] = useState<any[]>([]);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(false);
  const [selectedRubricKey, setSelectedRubricKey] = useState<string>('');
  const [selectedRubricDetails, setSelectedRubricDetails] = useState<any>(null);
  const [gradingStage, setGradingStage] = useState<'idle' | 'rubric' | 'reading' | 'grading'>('idle');

  useEffect(() => {
    if (isLoaded && user && fileKeyParam) {
      fetchFileDetails(fileKeyParam);
    }
    
    if (isLoaded && user) {
      fetchUserRubrics();
    }
  }, [isLoaded, user, fileKeyParam]);

  const fetchFileDetails = async (key: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/file?key=${encodeURIComponent(key)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.file) {
        setFileUrl(data.file.url);
        setFileName(data.file.name);
        setUploadedFileKey(data.file.key);
        
        // Fetch file content if it's a text file
        if (data.file.contentType && data.file.contentType.startsWith('text/')) {
          try {
            // Use our proxy endpoint instead of direct S3 URL
            const contentResponse = await fetch(`/api/file-content?key=${encodeURIComponent(key)}`);
            
            if (contentResponse.ok) {
              const textContent = await contentResponse.text();
              setFileContent(textContent);
            } else {
              // Don't throw here, we'll show the file download link instead
              setError(`Couldn't load file content (${contentResponse.status}). You can still grade it.`);
            }
          } catch (contentError) {
            // Continue execution, we'll show the file download link
            setError("Couldn't load file content. You can still grade it.");
          }
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      setError('Failed to load file details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRubrics = async () => {
    if (!user) return;
    
    setIsLoadingRubrics(true);
    try {
      const response = await fetch('/api/rubrics');
      if (!response.ok) {
        throw new Error('Failed to fetch rubrics');
      }
      
      const data = await response.json();
      setUserRubrics(data.rubrics || []);
    } catch (error) {
      console.error('Error fetching rubrics:', error);
    } finally {
      setIsLoadingRubrics(false);
    }
  };

  const handleRubricSelection = async (rubricKey: string) => {
    if (!rubricKey) {
      setRubric('');
      setSelectedRubricKey('');
      setSelectedRubricDetails(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/rubrics/${encodeURIComponent(rubricKey)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rubric details');
      }
      
      const data = await response.json();
      
      // Store the selected rubric key and details
      setSelectedRubricKey(rubricKey);
      setSelectedRubricDetails(data.rubric);
      
      // Extract the questions from the rubric and format them as a string
      let rubricContent = '';
      if (data.rubric.questions && data.rubric.questions.length > 0) {
        rubricContent = data.rubric.questions.join('\n');
      } else {
        rubricContent = 'Grade on clarity, organization, and accuracy.';
      }
      
      setRubric(rubricContent);
    } catch (error) {
      console.error('Error fetching rubric details:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus('error');
      setUploadMessage('File size exceeds the maximum allowed limit of 5MB.');
      
      // Reset file input
      event.target.value = '';
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadStatus('uploading');
    setUploadMessage('Uploading file...');
    setFileUrl('');
    setFileName('');
    setFileContent('');
    setUploadedFileKey(null);
    setError(null);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Handle successful upload
      setUploadStatus('success');
      setUploadMessage('File uploaded successfully!');
      
      // Set the file details
      if (data.file) {
        setFileUrl(data.file.url);
        setFileName(data.file.name);
        setUploadedFileKey(data.file.key); // Store the uploaded file key
        
        // Try to get the content for text files
        if (file.type.startsWith('text/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFileContent(e.target?.result as string || '');
          };
          reader.readAsText(file);
        }
      }
      
      // Reset form
      event.target.value = '';
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    }
  };

  const handleGrade = async () => {
    // Check if we have content to grade (either direct input or file content)
    if ((!fileContent && !fileUrl) && !directTextInput) {
      setError('No content to grade. Please enter text or upload a file first.');
      return;
    }
    
    // Check if rubric is selected
    if (!selectedRubricKey) {
      setError('Please select an existing rubric or create a new one.');
      return;
    }
    
    setIsGrading(true);
    setError(null);
    setShowTokenWarning(false);
    setTokenInfo(null);
    
    // Start the grading stage animation
    setGradingStage('rubric');
    
    // Use direct text input if on the text tab, otherwise use the file content
    const contentToGrade = activeTab === 1 ? directTextInput : fileContent || fileUrl;
    const nameToUse = activeTab === 1 ? 'Direct text input' : fileName;
    
    // Determine fileKey to use
    // If we're on the file tab, we use either the URL parameter or the uploaded file's key
    const fileKeyToUse = activeTab === 0 ? (uploadedFileKey || fileKeyParam) : null;
    
    try {
      // Simulate the different stages of grading with timeouts
      setTimeout(() => setGradingStage('reading'), 1500);
      setTimeout(() => setGradingStage('grading'), 3000);
      
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentWork: contentToGrade,
          rubric,
          fileName: nameToUse,
          fileKey: fileKeyToUse,
          selectedRubricKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if this is a token-related error
        if (response.status === 403 && data.insufficientTokens) {
          setTokenInfo({
            tokensNeeded: data.tokensNeeded,
            tokensAvailable: data.tokensAvailable
          });
          setShowTokenWarning(true);
          throw new Error('Insufficient tokens to grade this assignment');
        }
        
        throw new Error(data.error || 'Grading failed');
      }
      
      setResult(data.result || 'No grading result returned');
      
      // Show token usage info
      if (data.tokensUsed) {
        setUploadStatus('success');
        setUploadMessage(`Grade completed successfully! Used ${data.tokensUsed.toLocaleString()} tokens.`);
      }
      
      // Notify user if grade was stored for future reference
      if (data.resultKey) {
        setUploadStatus('success');
        setUploadMessage('Grade saved successfully! You can view this grade in your assignment history.');
      } else if (fileKeyToUse) {
        // If we had a fileKey but grade wasn't stored, show a warning
        setUploadStatus('error');
        setUploadMessage('Warning: Unable to save grade to your assignment history.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during grading. Please try again.');
    } finally {
      setIsGrading(false);
      setGradingStage('idle');
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const renderFileContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="ml-3">Loading file content...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 bg-red-900/30 text-red-400 rounded-md">
          <AlertCircle className="inline-block mr-2" size={20} />
          {error}
        </div>
      );
    }
    
    if (!fileUrl && !fileContent) {
      return (
        <div className="p-8 border-2 border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center">
          <Upload size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">No File Selected</h3>
          <p className="text-gray-400 mb-4 text-center">
            Upload a file or paste text to grade.
          </p>
          <button 
            onClick={triggerFileUpload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            <Upload size={18} className="mr-2" />
            Upload File
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileUpload}
          />
        </div>
      );
    }
    
    if (fileContent) {
      // For text files, display the content
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-md">
          <div className="flex justify-between items-center p-3 bg-gray-700 rounded-t-md">
            <span className="font-mono text-sm">{fileName}</span>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <Download size={16} className="mr-1" />
              Download
            </a>
          </div>
          <pre className="p-4 overflow-x-auto whitespace-pre-wrap text-sm font-mono">
            {fileContent}
          </pre>
        </div>
      );
    }
    
    // For non-text files, display a download link
    return (
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-md flex flex-col items-center justify-center">
        <FileText size={48} className="text-indigo-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">{fileName}</h3>
        <p className="text-gray-400 mb-4 text-center">
          This file type cannot be previewed. Click below to download it.
        </p>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center"
        >
        <Download size={18} className="mr-2" />
          Download File
        </a>
      </div>
    );
  };

  const formatResult = (text: string) => {
    // Check if the result contains multiple question sections separated by the delimiter
    const sections = text.split('\n\n---\n\n');
    const hasMultipleQuestions = sections.length > 1;
    
    // Extract numeric scores from the text (look for patterns like "Score: 8/10" or "Grade: 85%")
    const scoreRegex = /(?:score|grade|points|mark)(?:\s*|:\s*)(\d+)(?:\s*\/\s*|\s*out of\s*)(\d+)|(\d+)(?:\s*\/\s*|\s*out of\s*)(\d+)|(?:score|grade|points|mark)(?:\s*|:\s*)(\d+)(?:\s*%)/gi;
    
    let totalScore = 0;
    let totalPossible = 0;
    let scoreCount = 0;
    
    // Function to extract scores from a single section
    const extractScores = (content: string) => {
      let matches;
      // Reset the lastIndex to ensure we start from the beginning
      scoreRegex.lastIndex = 0;
      while ((matches = scoreRegex.exec(content)) !== null) {
        // Check which regex group matched
        if (matches[1] && matches[2]) {
          // Score: X/Y format
          totalScore += Number(matches[1]);
          totalPossible += Number(matches[2]);
          scoreCount++;
        } else if (matches[3] && matches[4]) {
          // X/Y format without "Score:" prefix
          totalScore += Number(matches[3]);
          totalPossible += Number(matches[4]);
          scoreCount++;
        } else if (matches[5]) {
          // Percentage format
          const percentageScore = Number(matches[5]);
          totalScore += percentageScore;
          totalPossible += 100;
          scoreCount++;
        }
      }
    };
    
    // Extract scores from each section
    if (hasMultipleQuestions) {
      sections.forEach(section => extractScores(section));
    } else {
      extractScores(text);
    }
    
    // Calculate overall score
    let overallScore = '';
    if (scoreCount > 0) {
      if (totalPossible > 0) {
        // Always show as percentage out of 100
        const percentage = Math.round((totalScore / totalPossible) * 100);
        overallScore = `${percentage} out of 100`;
      }
    }
    
    // Define custom components with explicit type casting to avoid TS errors
    const components = {
      // Headings with proper styling
      h1: ({children}: {children: React.ReactNode}) => (
        <h1 className="text-2xl font-bold text-indigo-400 mt-6 mb-4">{children}</h1>
      ),
      h2: ({children}: {children: React.ReactNode}) => (
        <h2 className="text-xl font-bold text-indigo-400 mt-5 mb-3">{children}</h2>
      ),
      h3: ({children}: {children: React.ReactNode}) => (
        <h3 className="text-lg font-bold text-indigo-400 mt-4 mb-2">{children}</h3>
      ),
      h4: ({children}: {children: React.ReactNode}) => (
        <h4 className="text-base font-bold text-indigo-400 mt-3 mb-2">{children}</h4>
      ),
      h5: ({children}: {children: React.ReactNode}) => (
        <h5 className="text-sm font-bold text-indigo-400 mt-3 mb-1">{children}</h5>
      ),
      h6: ({children}: {children: React.ReactNode}) => (
        <h6 className="text-xs font-bold text-indigo-400 mt-3 mb-1">{children}</h6>
      ),
      // Other text elements
      p: ({children}: {children: React.ReactNode}) => (
        <p className="mb-4 leading-relaxed">{children}</p>
      ),
      ul: ({children}: {children: React.ReactNode}) => (
        <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
      ),
      ol: ({children}: {children: React.ReactNode}) => (
        <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
      ),
      li: ({children}: {children: React.ReactNode}) => (
        <li className="mb-1">{children}</li>
      ),
      blockquote: ({children}: {children: React.ReactNode}) => (
        <blockquote className="border-l-4 border-indigo-500 pl-4 italic my-4 text-gray-300">{children}</blockquote>
      ),
      // Table formatting
      table: ({children}: {children: React.ReactNode}) => (
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border border-gray-700 rounded-md">{children}</table>
        </div>
      ),
      thead: ({children}: {children: React.ReactNode}) => (
        <thead className="bg-gray-700">{children}</thead>
      ),
      tbody: ({children}: {children: React.ReactNode}) => (
        <tbody className="divide-y divide-gray-700">{children}</tbody>
      ),
      tr: ({children}: {children: React.ReactNode}) => (
        <tr className="hover:bg-gray-700/50 transition-colors">{children}</tr>
      ),
      th: ({children}: {children: React.ReactNode}) => (
        <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">{children}</th>
      ),
      td: ({children}: {children: React.ReactNode}) => (
        <td className="px-4 py-3 text-sm border-t border-gray-700">{children}</td>
      ),
      // Formatting for emphasis
      strong: ({children}: {children: React.ReactNode}) => (
        <strong className="font-bold text-white">{children}</strong>
      ),
      em: ({children}: {children: React.ReactNode}) => (
        <em className="italic text-gray-300">{children}</em>
      ),
      a: ({href, children}: {href?: string, children: React.ReactNode}) => (
        <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>
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
          <code className="bg-gray-700 px-1 rounded text-white font-mono text-sm">{children}</code>
        );
      }
    };

    // If there are multiple questions/sections, render them with separators
    if (hasMultipleQuestions) {
      return (
        <div className="prose prose-invert max-w-none">
          {/* Display overall score if available */}
          {overallScore && (
            <div className="bg-indigo-900/40 p-4 rounded-lg mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white m-0">Overall Score</h2>
              <div className="text-2xl font-bold text-indigo-300">{overallScore}</div>
            </div>
          )}
          
          {sections.map((section, index) => (
            <div key={index} className={index > 0 ? "mt-8 pt-8 border-t border-gray-700" : ""}>
              <div className="bg-gray-900/50 px-4 py-3 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-indigo-400 mb-1">
                  Question {index + 1}
                </h3>
                {selectedRubricDetails && selectedRubricDetails.questions && selectedRubricDetails.questions[index] && (
                  <p className="text-gray-300 italic">
                    {selectedRubricDetails.questions[index]}
                  </p>
                )}
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
      <div className="prose prose-invert max-w-none">
        {/* Display overall score if available */}
        {overallScore && (
          <div className="bg-indigo-900/40 p-4 rounded-lg mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white m-0">Overall Score</h2>
            <div className="text-2xl font-bold text-indigo-300">{overallScore}</div>
          </div>
        )}
        
        {/* Display the question even for a single question */}
        {selectedRubricDetails && selectedRubricDetails.questions && selectedRubricDetails.questions.length > 0 && (
          <div className="bg-gray-900/50 px-4 py-3 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-indigo-400 mb-1">
              Question
            </h3>
            <p className="text-gray-300 italic">
              {selectedRubricDetails.questions[0]}
            </p>
          </div>
        )}
        
        {/* @ts-ignore - Using the type ignore for ReactMarkdown props */}
        <ReactMarkdown components={components}>
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  const renderRubricInput = () => {
    return (
      <div className="mt-6">
        <div className="mb-4">
          <label className="block text-lg font-medium mb-2">
            Select a Rubric
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Choose an existing rubric or create a new one to grade this submission.
          </p>
        </div>
        
        {isLoadingRubrics ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Loading rubrics...</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <select
                className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                value={selectedRubricKey}
                onChange={(e) => handleRubricSelection(e.target.value)}
              >
                <option value="">Select a rubric...</option>
                {userRubrics.map((rubric) => (
                  <option key={rubric.key} value={rubric.key}>
                    {rubric.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedRubricDetails && (
              <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900">
                <h3 className="font-medium text-base mb-2">{selectedRubricDetails.name}</h3>
                <div className="flex flex-wrap text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="mr-4 mb-1">
                    <span className="font-medium">Course:</span> {selectedRubricDetails.course}
                  </div>
                  <div className="mr-4 mb-1">
                    <span className="font-medium">Specialization:</span> {selectedRubricDetails.specialization}
                  </div>
                  <div className="mb-1">
                    <span className="font-medium">Level:</span> {selectedRubricDetails.classLevel}
                  </div>
                </div>
                {selectedRubricDetails.questions && selectedRubricDetails.questions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Rubric Questions:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {selectedRubricDetails.questions.map((question: string, idx: number) => (
                        <li key={idx}>{question}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <span className="mr-2">Don't see what you need?</span>
              <Link href="/rubrics" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                Create New Rubric
              </Link>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Layout activePage="assignments">
      <div className="container mx-auto mb-8">
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <Link href={fileKeyParam ? '/assignments' : '/dashboard'} className="mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">
              {fileKeyParam ? 'Grade Assignment' : 'Grade Submission'}
            </h1>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
          {/* Left column - Input and grading controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            {/* Input Tabs */}
            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
              <Tab.List className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 font-medium focus:outline-none relative ${
                      selected
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    File
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 font-medium focus:outline-none relative ${
                      selected
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Text Input
                  </div>
                </Tab>
              </Tab.List>
              
              <Tab.Panels>
                {/* File Panel */}
                <Tab.Panel>
                  <div className="space-y-4">
                    {/* File Upload / Display */}
                    {fileKeyParam || uploadedFileKey ? (
                      renderFileContent()
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={triggerFileUpload}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="flex flex-col items-center">
                          <FileText size={48} className="text-gray-400 mb-2" />
                          <h3 className="text-lg font-medium mb-1">Upload a file to grade</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Click to browse your files
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Supported formats: txt, pdf, doc, docx, py, js, java, etc.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Status Messages */}
                    {uploadStatus === 'uploading' && (
                      <div className="flex items-center justify-center py-2 text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>{uploadMessage}</span>
                      </div>
                    )}
                    
                    {uploadStatus === 'success' && (
                      <div className="flex items-center justify-center py-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>{uploadMessage}</span>
                      </div>
                    )}
                    
                    {uploadStatus === 'error' && (
                      <div className="flex items-center justify-center py-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>{uploadMessage}</span>
                      </div>
                    )}
                    
                    {/* Rubric Input */}
                    {renderRubricInput()}
                  </div>
                </Tab.Panel>
                
                {/* Text Input Panel */}
                <Tab.Panel>
                  <div className="space-y-4">
                    <div className="mb-4">
                      <label className="block text-lg font-medium mb-2">
                        Enter the text to grade
                      </label>
                      <textarea
                        value={directTextInput}
                        onChange={(e) => setDirectTextInput(e.target.value)}
                        className="w-full p-2 border rounded min-h-64 bg-white dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Paste or type text here..."
                      />
                    </div>
                    
                    {/* Rubric Input */}
                    {renderRubricInput()}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Token warning */}
            {showTokenWarning && tokenInfo && (
              <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Token Warning</p>
                  <p className="text-sm">This grading requires {tokenInfo.tokensNeeded} tokens. You have {tokenInfo.tokensAvailable} tokens available.</p>
                  <Link href="/tokens" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mt-1 inline-block">
                    Purchase more tokens
                  </Link>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGrade}
                disabled={isGrading || (!directTextInput && !fileContent && !fileUrl) || !selectedRubricKey}
                className={`px-4 py-2 rounded-md flex items-center ${
                  isGrading || (!directTextInput && !fileContent && !fileUrl) || !selectedRubricKey
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isGrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Grade Submission
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Right column - Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="h-full p-6 flex flex-col max-h-[800px]">
              {isGrading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 size={64} className="text-indigo-500 animate-spin mb-6" />
                  <h3 className="text-xl font-medium mb-2">
                    {gradingStage === 'rubric' && "Feeding rubric..."}
                    {gradingStage === 'reading' && "Reading the assignment..."}
                    {gradingStage === 'grading' && "Grading submission..."}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {gradingStage === 'rubric' && "Analyzing rubric criteria..."}
                    {gradingStage === 'reading' && "Processing student work..."}
                    {gradingStage === 'grading' && "Generating comprehensive feedback..."}
                  </p>
                </div>
              ) : result ? (
                <>
                  <h2 className="text-xl font-semibold mb-4 flex items-center flex-shrink-0">
                    <CheckCircle size={24} className="text-green-500 mr-2" />
                    Grading Result
                  </h2>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {formatResult(result)}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Grading Results Yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload a file or enter text, select a rubric, and click "Grade Submission" to see results here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Wrapper component with suspense boundary
export default function GradePage() {
  return (
    <Suspense fallback={<GradePageLoading />}>
      <GradePageContent />
    </Suspense>
  );
}