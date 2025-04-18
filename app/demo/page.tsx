'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Navigation from '../components/Navigation';

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [studentWork, setStudentWork] = useState('');
  const [rubric, setRubric] = useState('');
  const [submissionType, setSubmissionType] = useState<string | undefined>(undefined);
  const [detectedType, setDetectedType] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
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
      
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentWork,
          rubric: rubric || 'Grade on clarity, organization, and accuracy.',
          submissionType,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await res.json();
      setResponse(data.result);
      setDetectedType(data.detectedType);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Experience GradeGenius in Action</h1>
            <p className="text-xl text-neutral-700">Try our AI-powered grading system with your own content</p>
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
                  <div className="text-red-500 text-sm py-2">{error}</div>
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
                    <div className="prose prose-indigo max-w-none text-black">
                      {response.split('\n').map((line, i) => (
                        line ? <p key={i} className="mb-4 text-black">{line}</p> : <br key={i} />
                      ))}
                    </div>
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
      
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GradeGenius</h3>
              <p className="text-indigo-200">Making grading smarter and faster with AI technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="/#features" className="text-indigo-200 hover:text-white">Features</a></li>
                <li><a href="/#pricing" className="text-indigo-200 hover:text-white">Pricing</a></li>
                <li><a href="/demo" className="text-indigo-200 hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/#about" className="text-indigo-200 hover:text-white">About</a></li>
                <li><a href="/#contact" className="text-indigo-200 hover:text-white">Contact</a></li>
                <li><a href="/#careers" className="text-indigo-200 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#privacy" className="text-indigo-200 hover:text-white">Privacy Policy</a></li>
                <li><a href="#terms" className="text-indigo-200 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-indigo-200">
            <p>© 2024 GradeGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
