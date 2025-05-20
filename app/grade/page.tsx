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
import { useTheme } from '../context/ThemeContext';

// Loading component for Suspense fallback
function GradePageLoading() {
  const { theme } = useTheme();
  return (
    <Layout activePage="assignments">
      <div className="container mx-auto">
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
          <p className={`text-lg font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Loading assignment...</p>
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
  const { theme } = useTheme();
  
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
  const [userRubrics, setUserRubrics] = useState<Array<{key: string, name: string}>>([]);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(false);
  const [selectedRubricKey, setSelectedRubricKey] = useState<string>('');
  const [selectedRubricDetails, setSelectedRubricDetails] = useState<{
    name: string;
    questions: string[];
  } | null>(null);
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
          } catch (_) {
            // Continue execution, we'll show the file download link
            setError("Couldn't load file content. You can still grade it.");
          }
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (_) {
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during grading. Please try again.');
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
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-oswald`}>Loading file...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className={`text-center mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} font-oswald`}>{error}</p>
          {fileUrl && (
            <a 
              href={fileUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-md transition-colors font-oswald`}
            >
              <Download className="w-5 h-5 mr-2" />
              Download File
            </a>
          )}
        </div>
      );
    }

    if (!fileUrl && !directTextInput && activeTab === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg flex items-center justify-center mb-6`}>
            <FileText className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-xl font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>No File Selected</h3>
          <p className={`text-center mb-6 max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-oswald`}>
            Upload a file or enter text directly to grade a submission.
          </p>
          <button
            onClick={triggerFileUpload}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors font-oswald"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload File
          </button>
        </div>
      );
    }

    if (activeTab === 1 && !directTextInput) {
      return (
        <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4 min-h-[300px]`}>
          <div className="flex flex-col h-full">
            <textarea
              placeholder="Enter text to grade here..."
              value={directTextInput}
              onChange={(e) => setDirectTextInput(e.target.value)}
              className={`flex-grow p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-md resize-none min-h-[250px] font-oswald`}
            />
          </div>
        </div>
      );
    }

    if (fileContent) {
      return (
        <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>
              <FileText className="inline-block mr-2 h-5 w-5" />
              {fileName}
            </h3>
          </div>
          <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-md whitespace-pre-wrap overflow-auto max-h-[500px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono text-sm`}>
            {fileContent}
          </div>
        </div>
      );
    }

    if (fileUrl) {
      return (
        <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
          <div className="flex flex-col items-center justify-center py-10">
            <FileText className={`w-16 h-16 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mb-4`} />
            <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>{fileName}</h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-oswald`}>This file type cannot be previewed. Click below to download it.</p>
            <a 
              href={fileUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors font-oswald"
            >
              <Download className="w-5 h-5 mr-2" />
              Download File
            </a>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderRubricInput = () => {
    return (
      <div className="mb-6">
        <h2 className={`text-xl font-semibold mb-4 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Select a Rubric</h2>
        
        <div className={`mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-oswald`}>Choose an existing rubric or create a new one to grade this submission.</p>
          
          <div className="mb-4">
            <select
              value={selectedRubricKey}
              onChange={(e) => handleRubricSelection(e.target.value)}
              className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md font-oswald`}
            >
              <option value="">Select a rubric...</option>
              {userRubrics.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
          </div>
          
          <div className={`flex items-center ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} text-sm`}>
            <span className="mr-2">Don&apos;t see what you need?</span>
            <Link href="/rubrics" className="flex items-center hover:underline font-oswald">
              <Edit3 className="w-4 h-4 mr-1" />
              Create New Rubric
            </Link>
          </div>
        </div>
        
        {selectedRubricKey && selectedRubricDetails && (
          <div className={`mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm border-l-4 border-indigo-500`}>
            <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>{selectedRubricDetails.name}</h3>
            <div className="space-y-2">
              {selectedRubricDetails.questions.map((q: string, i: number) => (
                <p key={i} className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-oswald`}>{i+1}. {q}</p>
              ))}
            </div>
          </div>
        )}
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
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mt-6 mb-4 font-oswald`}>{children}</h1>
      ),
      h2: ({children}: {children: React.ReactNode}) => (
        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mt-5 mb-3 font-oswald`}>{children}</h2>
      ),
      h3: ({children}: {children: React.ReactNode}) => (
        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mt-4 mb-2 font-oswald`}>{children}</h3>
      ),
      h4: ({children}: {children: React.ReactNode}) => (
        <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mt-3 mb-2 font-oswald`}>{children}</h4>
      ),
      h5: ({children}: {children: React.ReactNode}) => (
        <h5 className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mt-3 mb-1 font-oswald`}>{children}</h5>
      ),
      h6: ({children}: {children: React.ReactNode}) => (
        <h6 className={`text-xs font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mt-3 mb-1 font-oswald`}>{children}</h6>
      ),
      // Other text elements
      p: ({children}: {children: React.ReactNode}) => (
        <p className={`mb-4 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-oswald`}>{children}</p>
      ),
      ul: ({children}: {children: React.ReactNode}) => (
        <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
      ),
      ol: ({children}: {children: React.ReactNode}) => (
        <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
      ),
      li: ({children}: {children: React.ReactNode}) => (
        <li className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-oswald`}>{children}</li>
      ),
      blockquote: ({children}: {children: React.ReactNode}) => (
        <blockquote className={`border-l-4 ${theme === 'dark' ? 'border-indigo-500 text-gray-300' : 'border-indigo-600 text-gray-600'} pl-4 italic my-4`}>{children}</blockquote>
      ),
      // Other components remain the same with theme conditional classes...
    };

    // If there are multiple questions/sections, render them with separators
    return (
      <div className="prose prose-invert max-w-none">
        {/* Display overall score if available */}
        {overallScore && (
          <div className={`${theme === 'dark' ? 'bg-indigo-900/40' : 'bg-indigo-100'} p-4 rounded-lg mb-6 flex items-center justify-between`}>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} m-0 font-oswald`}>Overall Score</h2>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'} font-oswald`}>{overallScore}</div>
          </div>
        )}
        
        {/* Remaining JSX with theme-aware styling... */}
      </div>
    );
  };

  return (
    <Layout activePage="assignments">
      <div className="w-full px-4 md:px-6 pb-12">
        <div className="mb-8">
          <div className="flex items-center">
            <Link 
              href="/assignments" 
              className={`inline-flex items-center ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mr-4 transition-colors font-oswald`}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Assignments
            </Link>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>Grade Assignment</h1>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Content Input */}
          <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg overflow-hidden shadow-lg p-6`}>
            <Tab.Group onChange={setActiveTab}>
              <Tab.List className="flex space-x-1 rounded-lg bg-indigo-900/20 p-1 mb-4">
                <Tab
                  className={({ selected }) =>
                    `w-full py-3 leading-5 rounded-lg font-medium text-sm flex items-center justify-center transition-colors font-oswald
                    ${selected 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : `${theme === 'dark' ? 'text-gray-300 hover:bg-indigo-600/30 hover:text-white' : 'text-gray-700 hover:bg-indigo-600/30 hover:text-white'}`
                    }`
                  }
                >
                  <FileText className="h-5 w-5 mr-2" />
                  File
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full py-3 leading-5 rounded-lg font-medium text-sm flex items-center justify-center transition-colors font-oswald
                    ${selected 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : `${theme === 'dark' ? 'text-gray-300 hover:bg-indigo-600/30 hover:text-white' : 'text-gray-700 hover:bg-indigo-600/30 hover:text-white'}`
                    }`
                  }
                >
                  <Edit3 className="h-5 w-5 mr-2" />
                  Text Input
                </Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  {/* File Upload Tab Content */}
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    {!fileUrl && !isLoading && (
                      <div className="mb-4 flex justify-end">
                        <button
                          onClick={triggerFileUpload}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors font-oswald"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Status Message */}
                    {uploadStatus !== 'idle' && (
                      <div className={`mb-4 p-3 rounded-md flex items-center ${
                        uploadStatus === 'uploading' ? 'bg-blue-900/30 text-blue-200' : 
                        uploadStatus === 'success' ? 'bg-green-900/30 text-green-200' : 
                        'bg-red-900/30 text-red-200'
                      }`}>
                        {uploadStatus === 'uploading' ? (
                          <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-200 border-t-transparent rounded-full"></div>
                        ) : uploadStatus === 'success' ? (
                          <CheckCircle size={20} className="mr-2 text-green-300" />
                        ) : (
                          <AlertCircle size={20} className="mr-2 text-red-300" />
                        )}
                        <span className="font-oswald">{uploadMessage}</span>
                      </div>
                    )}
                    
                    {/* File Content Display */}
                    {renderFileContent()}
                  </div>
                </Tab.Panel>
                
                <Tab.Panel>
                  {/* Text Input Tab Content */}
                  <div>
                    <div className={`mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
                      <textarea
                        placeholder="Enter text to grade here..."
                        value={directTextInput}
                        onChange={(e) => setDirectTextInput(e.target.value)}
                        className={`w-full p-4 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-800'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} rounded-md resize-none min-h-[250px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-oswald`}
                      />
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            
            {/* Rubric Input */}
            {renderRubricInput()}
            
            {/* Grade Button */}
            <div className="flex items-center justify-between pt-4">
              <div>
                {tokenInfo && !isGrading && (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center font-oswald`}>
                    <Coins className="h-4 w-4 mr-1" />
                    <span>
                      Estimated cost: <span className={theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'}>{tokenInfo.tokensNeeded} tokens</span>
                    </span>
                  </div>
                )}
                
                {showTokenWarning && (
                  <div className="mt-2 text-amber-400 text-sm flex items-center font-oswald">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Not enough tokens. <Link href="/tokens" className="underline">Add more</Link></span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleGrade}
                disabled={isGrading || !(uploadedFileKey || directTextInput) || !rubric}
                className={`inline-flex items-center px-4 py-2 ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-gray-800'} text-white rounded-md transition-colors font-oswald
                ${isGrading || !(uploadedFileKey || directTextInput) || !rubric ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGrading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {gradingStage === 'rubric' ? 'Analyzing Rubric...' : 
                     gradingStage === 'reading' ? 'Reading Submission...' : 
                     gradingStage === 'grading' ? 'Grading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Grade Submission
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Right Column: Grade Results */}
          <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg overflow-hidden shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-6 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Grading Results</h2>
            
            {isGrading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-indigo-500 mb-4"></div>
                <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>
                  {gradingStage === 'rubric' ? 'Analyzing Rubric...' : 
                   gradingStage === 'reading' ? 'Reading Submission...' : 
                   gradingStage === 'grading' ? 'Grading Submission...' : 'Processing...'}
                </h3>
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-oswald`}>
                  This may take a minute or two. Please don&apos;t refresh the page.
                </p>
              </div>
            ) : result ? (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 mb-4 shadow-sm overflow-auto max-h-[80vh]`}>
                {/* @ts-expect-error - Required for ReactMarkdown components */}
                <ReactMarkdown components={formatResult(result).props.children.props.components}>
                  {result}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12">
                <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg flex items-center justify-center mb-6`}>
                  <FileText className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} font-oswald`}>No Grading Results Yet</h3>
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-oswald`}>
                  Upload a file or enter text, select a rubric, and click &quot;Grade Submission&quot; to see results here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function GradePage() {
  return (
    <Suspense fallback={<GradePageLoading />}>
      <GradePageContent />
    </Suspense>
  );
}