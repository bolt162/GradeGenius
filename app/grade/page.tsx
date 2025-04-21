'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { FileText, Send, Loader2, ChevronLeft, Upload, AlertCircle, CheckCircle, Edit3, ArrowUp, Download, Coins, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Tab } from '@headlessui/react';

export default function GradePage() {
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
  
  const [rubric, setRubric] = useState<string>('Grade on clarity, organization, and accuracy.');
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [directTextInput, setDirectTextInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tokenInfo, setTokenInfo] = useState<{ tokensNeeded: number; tokensAvailable: number; } | null>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false);

  useEffect(() => {
    if (isLoaded && user && fileKeyParam) {
      fetchFileDetails(fileKeyParam);
    }
  }, [isLoaded, user, fileKeyParam]);

  const fetchFileDetails = async (key: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching details for file: ${key}`);
      const response = await fetch(`/api/file?key=${encodeURIComponent(key)}`);
      
      if (!response.ok) {
        console.error(`API response not OK: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch file details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('File details received:', data);
      
      if (data.file) {
        setFileUrl(data.file.url);
        setFileName(data.file.name);
        setUploadedFileKey(data.file.key);
        
        // Fetch file content if it's a text file
        if (data.file.contentType && data.file.contentType.startsWith('text/')) {
          console.log(`Fetching content through proxy for file: ${key}`);
          try {
            // Use our proxy endpoint instead of direct S3 URL
            const contentResponse = await fetch(`/api/file-content?key=${encodeURIComponent(key)}`);
            
            if (contentResponse.ok) {
              const textContent = await contentResponse.text();
              setFileContent(textContent);
            } else {
              console.error(`Content fetch failed: ${contentResponse.status} ${contentResponse.statusText}`);
              // Don't throw here, we'll show the file download link instead
            }
          } catch (contentError) {
            console.error('Error fetching file content:', contentError);
            // Continue execution, we'll show the file download link
          }
        } else {
          console.log(`File is not text type (${data.file.contentType}), skipping content fetch`);
        }
      } else {
        console.error('Response had no file field:', data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setError('Failed to load file details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
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
        throw new Error('Upload failed');
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
        console.log('Setting uploaded file key:', data.file.key);
        
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
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to upload file. Please try again.');
    }
  };

  const handleGrade = async () => {
    // Check if we have content to grade (either direct input or file content)
    if ((!fileContent && !fileUrl) && !directTextInput) {
      setError('No content to grade. Please enter text or upload a file first.');
      return;
    }
    
    setIsGrading(true);
    setError(null);
    setShowTokenWarning(false);
    setTokenInfo(null);
    
    // Use direct text input if on the text tab, otherwise use the file content
    const contentToGrade = activeTab === 1 ? directTextInput : fileContent || fileUrl;
    const nameToUse = activeTab === 1 ? 'Direct text input' : fileName;
    
    // Determine fileKey to use
    // If we're on the file tab, we use either the URL parameter or the uploaded file's key
    const fileKeyToUse = activeTab === 0 ? (uploadedFileKey || fileKeyParam) : null;
    
    try {
      console.log('Grading with fileKey:', fileKeyToUse); // Debug log
      
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
      if (data.gradeStored) {
        setUploadStatus('success');
        setUploadMessage('Grade saved successfully! You can view this grade in your assignment history.');
      } else if (fileKeyToUse) {
        // If we had a fileKey but grade wasn't stored, show a warning
        setUploadStatus('error');
        setUploadMessage('Warning: Unable to save grade to your assignment history.');
      }
    } catch (error: any) {
      console.error('Grading error:', error);
      setError(error.message || 'An error occurred during grading. Please try again.');
    } finally {
      setIsGrading(false);
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
    // Add line breaks for readability
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <Layout activePage="assignments">
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link href="/assignments" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center mb-2">
              <ChevronLeft size={20} className="mr-1" />
              Back to Assignments
            </Link>
            <h1 className="text-2xl font-bold">Grade Assignment</h1>
          </div>
        </div>
        
        {/* Insufficient token warning */}
        {showTokenWarning && tokenInfo && (
          <div className="mb-6 p-4 bg-amber-900/30 border border-amber-700 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-amber-400 mt-1 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-amber-400 mb-2">Insufficient Tokens</h3>
                <p className="mb-2">
                  You don't have enough tokens to grade this assignment. This assignment requires approximately 
                  <span className="font-bold text-amber-400 mx-1">{tokenInfo.tokensNeeded.toLocaleString()}</span> 
                  tokens, but you only have 
                  <span className="font-bold text-amber-400 mx-1">{tokenInfo.tokensAvailable.toLocaleString()}</span> 
                  tokens remaining.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link
                    href="/tokens"
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white"
                  >
                    <CreditCard size={18} className="mr-2" />
                    Purchase Tokens
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {uploadStatus !== 'idle' && (
          <div className={`mb-6 p-3 rounded-md flex items-center ${
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
            <span>{uploadMessage}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Content to Grade</h2>
            
            <Tab.Group onChange={setActiveTab}>
              <Tab.List className="flex mb-4 border-b border-gray-700">
                <Tab className={({ selected }) => 
                  `px-4 py-2 font-medium outline-none ${selected ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`
                }>
                  File
                </Tab>
                <Tab className={({ selected }) => 
                  `px-4 py-2 font-medium outline-none ${selected ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`
                }>
                  Direct Text
                </Tab>
              </Tab.List>
              
              <Tab.Panels>
                <Tab.Panel>
                  {renderFileContent()}
                  
                  <div className="mt-4 flex justify-end">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={triggerFileUpload}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center"
                    >
                      <Upload size={18} className="mr-2" />
                      {fileUrl ? 'Upload Different File' : 'Upload File'}
                    </button>
                  </div>
                </Tab.Panel>
                
                <Tab.Panel>
                  <textarea
                    className="w-full p-4 h-64 bg-gray-800 border border-gray-700 rounded-md font-mono text-sm resize-none"
                    placeholder="Paste student work here..."
                    value={directTextInput}
                    onChange={(e) => setDirectTextInput(e.target.value)}
                  ></textarea>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Grading Settings</h2>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Rubric:</label>
              <textarea
                className="w-full p-4 h-32 bg-gray-700 border border-gray-600 rounded-md text-sm resize-none"
                placeholder="Enter grading rubric here..."
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
              ></textarea>
            </div>
            
            <button
              onClick={handleGrade}
              disabled={isGrading || ((!fileContent && !fileUrl) && !directTextInput)}
              className={`w-full py-3 rounded-md flex items-center justify-center ${
                isGrading || ((!fileContent && !fileUrl) && !directTextInput)
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isGrading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Grading...
                </>
              ) : (
                <>
                  <Send size={20} className="mr-2" />
                  Grade Assignment
                </>
              )}
            </button>
          </div>
        </div>
        
        {result && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle size={24} className="text-green-500 mr-2" />
              Grading Result
            </h2>
            <div className="prose prose-invert max-w-none">
              {formatResult(result)}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 