'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { FileText, Upload, AlertCircle, CheckCircle, Award, Trash2, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import styles from './assignments.module.css';
import { useTheme } from '../context/ThemeContext';

interface Assignment {
  key: string;
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  graded?: boolean;
  grade?: {
    timestamp: string;
    gradeResult: string;
  };
}

export default function AssignmentsPage() {
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedGradeKey, setSelectedGradeKey] = useState<string | null>(null);
  const [gradeFeedback, setGradeFeedback] = useState<string | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isGradeLoading, setIsGradeLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
  const [rubricQuestions, setRubricQuestions] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Helper function to toggle question expansion
  const toggleQuestionExpansion = (questionIndex: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchAssignments();
    }
  }, [isLoaded, user]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First fetch all assignments
      const response = await fetch('/api/assignments');
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === 'No assignments found') {
          // Not a real error, just no assignments yet
          setAssignments([]);
          return;
        }
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      let assignmentsList = data.assignments || [];
      
      // Now fetch all grades
      const gradesResponse = await fetch('/api/grades');
      
      if (gradesResponse.ok) {
        const gradesData = await gradesResponse.json();
        const grades = gradesData.grades || [];
        
        // Map of fileKey to grade info
        const gradeMap = new Map();
        grades.forEach((grade: {fileKey: string; timestamp: string; key: string}) => {
          gradeMap.set(grade.fileKey, {
            timestamp: grade.timestamp,
            key: grade.key
          });
        });
        
        // Merge assignment data with grade info
        assignmentsList = assignmentsList.map((assignment: Assignment) => {
          const gradeInfo = gradeMap.get(assignment.key);
          if (gradeInfo) {
            return {
              ...assignment,
              graded: true,
              gradeKey: gradeInfo.key,
              gradeTimestamp: gradeInfo.timestamp
            };
          }
          return assignment;
        });
      }
      
      setAssignments(assignmentsList);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGradeFeedback = async (fileKey: string) => {
    setIsGradeLoading(true);
    setGradeFeedback(null);
    setSelectedGradeKey(fileKey);
    setIsGradeModalOpen(true);
    
    try {
      // Use the selected key for additional tracking if needed in the future
      console.log('Fetching feedback for:', selectedGradeKey);
      const response = await fetch(`/api/grade/${encodeURIComponent(fileKey)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch grade feedback');
      }
      
      const data = await response.json();
      setGradeFeedback(data.grade?.gradeResult || 'No feedback available');
      
      // Store the rubric questions from the grade data
      setRubricQuestions(data.grade?.rubricQuestions || []);
    } catch (error) {
      console.error('Error fetching grade feedback:', error);
      setGradeFeedback('Error loading feedback. Please try again.');
    } finally {
      setIsGradeLoading(false);
    }
  };

  const closeGradeModal = () => {
    setIsGradeModalOpen(false);
    setSelectedGradeKey(null);
    setGradeFeedback(null);
    setRubricQuestions([]);
  };

  const handleDeleteFile = async (fileKey: string) => {
    // First, confirm deletion
    if (deleteConfirmKey !== fileKey) {
      setDeleteConfirmKey(fileKey);
      setTimeout(() => {
        // Reset delete confirmation after 3 seconds
        setDeleteConfirmKey(null);
      }, 3000);
      return;
    }
    
    // User confirmed, proceed with deletion
    setIsDeleting(true);
    setDeleteConfirmKey(null); // Reset confirmation
    
    try {
      const response = await fetch(`/api/file/delete?key=${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      // Remove the deleted assignment from the local state
      setAssignments(assignments.filter(assignment => assignment.key !== fileKey));
      
      // Show success message
      setUploadStatus('success');
      setUploadMessage('File deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting file:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to delete file. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check if there are already 3 or more ungraded assignments
    const ungradedCount = assignments.filter(a => !a.graded).length;
    if (ungradedCount >= 3) {
      setUploadStatus('error');
      setUploadMessage('You cannot upload more assignments until you grade at least one of your existing assignments.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
      
      // Reset file input
      event.target.value = '';
      return;
    }
    
    const file = files[0];
    
    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus('error');
      setUploadMessage('File size exceeds the maximum allowed limit of 5MB.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
      
      // Reset file input
      event.target.value = '';
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadStatus('uploading');
    setUploadMessage('Uploading file...');
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      // Handle successful upload
      setUploadStatus('success');
      setUploadMessage('File uploaded successfully!');
      
      // Refresh assignments list
      fetchAssignments();
      
      // Reset form
      event.target.value = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format markdown content for grade feedback
  const formatResult = (text: string) => {
    // Check if the result contains multiple question sections separated by the delimiter
    const sections = text.split('\n\n---\n\n');
    const hasMultipleQuestions = sections.length > 1;
    
    // Extract numeric scores from the text (look for patterns like "Score: 8/10" or "Grade: 85%")
    const scoreRegex = /(?:score|grade|points|mark)(?:\s*|:\s*)(\d+(?:\.\d+)?)(?:\s*\/\s*|\s*out of\s*)(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)(?:\s*\/\s*|\s*out of\s*)(\d+(?:\.\d+)?)|(?:score|grade|points|mark)(?:\s*|:\s*)(\d+(?:\.\d+)?)(?:\s*%)/gi;
    
    let totalScore = 0;
    let totalPossible = 0;
    let scoreCount = 0;
    
    // Function to extract score from a single section
    const extractSectionScore = (content: string) => {
      const sectionScoreRegex = /(?:score|grade|points|mark)(?:\s*|:\s*)(\d+(?:\.\d+)?)(?:\s*\/\s*|\s*out of\s*)(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)(?:\s*\/\s*|\s*out of\s*)(\d+(?:\.\d+)?)|(?:score|grade|points|mark)(?:\s*|:\s*)(\d+(?:\.\d+)?)(?:\s*%)/gi;
      let sectionScore = 0;
      let sectionPossible = 0;
      let matches;
      
      while ((matches = sectionScoreRegex.exec(content)) !== null) {
        if (matches[1] && matches[2]) {
          sectionScore = Number(matches[1]);
          sectionPossible = Number(matches[2]);
          break;
        } else if (matches[3] && matches[4]) {
          sectionScore = Number(matches[3]);
          sectionPossible = Number(matches[4]);
          break;
        } else if (matches[5]) {
          sectionScore = Number(matches[5]);
          sectionPossible = 100;
          break;
        }
      }
      
      return { score: sectionScore, possible: sectionPossible };
    };
    
    // Function to extract scores from all sections for total calculation
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
    
    // Parse and categorize sections by score
    let sortedSections = [];
    if (hasMultipleQuestions) {
      // Parse each section with its score
      const sectionsWithScores = sections.map((section, index) => {
        const { score, possible } = extractSectionScore(section);
        return { section, index, score, possible };
      });
      
      // Calculate total score from all sections
      sectionsWithScores.forEach(({ score, possible }) => {
        totalScore += score;
        totalPossible += possible;
        scoreCount++;
      });
      
      // Categorize sections
      const incorrectSections = sectionsWithScores.filter(({ score }) => score === 0);
      const partialCreditSections = sectionsWithScores.filter(({ score, possible }) => score > 0 && score < possible);
      const fullCreditSections = sectionsWithScores.filter(({ score, possible }) => score === possible && score > 0);
      
      // Sort sections: incorrect first, then partial credit, then full credit
      sortedSections = [...incorrectSections, ...partialCreditSections, ...fullCreditSections];
    } else {
      extractScores(text);
      // For single question, just use the original section
      const { score, possible } = extractSectionScore(text);
      sortedSections = [{ section: text, index: 0, score, possible }];
    }
    
    // Calculate overall score
    let overallScore = '';
    if (scoreCount > 0) {
      if (totalPossible > 0) {
        // Always show as percentage out of 100
        overallScore = `${totalScore} out of ${totalPossible}`;
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
      // Table formatting
      table: ({children}: {children: React.ReactNode}) => (
        <div className="overflow-x-auto my-6">
          <table className={`min-w-full border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-md`}>{children}</table>
        </div>
      ),
      thead: ({children}: {children: React.ReactNode}) => (
        <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>{children}</thead>
      ),
      tbody: ({children}: {children: React.ReactNode}) => (
        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>{children}</tbody>
      ),
      tr: ({children}: {children: React.ReactNode}) => (
        <tr className={`hover:${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>{children}</tr>
      ),
      th: ({children}: {children: React.ReactNode}) => (
        <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'} uppercase tracking-wider font-oswald`}>{children}</th>
      ),
      td: ({children}: {children: React.ReactNode}) => (
        <td className={`px-4 py-3 text-sm border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{children}</td>
      ),
      // Formatting for emphasis
      strong: ({children}: {children: React.ReactNode}) => (
        <strong className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{children}</strong>
      ),
      em: ({children}: {children: React.ReactNode}) => (
        <em className={`italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{children}</em>
      ),
      a: ({href, children}: {href?: string, children: React.ReactNode}) => (
        <a href={href} className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} underline`} target="_blank" rel="noopener noreferrer">{children}</a>
      ),
      // Custom code handling with type casting
      code: ({className, children}: {className?: string, children: React.ReactNode}) => {
        // Check if this is a code block with a language (not an inline code)
        const match = /language-(\w+)/.exec(className || '');
        const content = String(children).replace(/\n$/, '');
        
        if (match && typeof children === 'string') {
          // Code block with language
          return (
            <SyntaxHighlighter style={vscDarkPlus} language={match[1]}>
              {content}
            </SyntaxHighlighter>
          );
        }
        
        // Inline code
        return (
          <code className={`${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} px-1 rounded font-mono text-sm`}>{children}</code>
        );
      }
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
        
        {hasMultipleQuestions ? (
          sortedSections.map((sectionData, displayIndex) => {
            const { section, index: originalIndex, score, possible } = sectionData;
            
            // Determine score category for visual indicators
            let scoreCategory = 'full';
            let categoryIcon = '✓';
            let categoryText = 'Full Credit';
            
            if (score === 0) {
              scoreCategory = 'incorrect';
              categoryIcon = '✗';
              categoryText = 'Incorrect';
            } else if (score > 0 && score < possible) {
              scoreCategory = 'partial';
              categoryIcon = '◐';
              categoryText = 'Partial Credit';
            }
            
            const isExpanded = expandedQuestions.has(originalIndex);
            
            return (
              <div key={originalIndex} className={displayIndex > 0 ? `mt-8 pt-8 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}` : ""}>
                <div 
                  className={`${theme === 'dark' ? 'bg-gray-900/50 hover:bg-gray-900/70' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-3 rounded-lg mb-4 cursor-pointer transition-colors`}
                  onClick={() => toggleQuestionExpansion(originalIndex)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} font-oswald`}>
                        Question {originalIndex + 1}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm px-2 py-1 rounded-full text-white font-oswald ${
                        scoreCategory === 'incorrect' ? 'bg-red-500' :
                        scoreCategory === 'partial' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}>
                        {categoryIcon} {categoryText}
                      </span>
                      {possible > 0 && (
                        <span className={`text-lg font-bold font-oswald ${
                          scoreCategory === 'incorrect' ? 'text-red-600 dark:text-red-500' :
                          scoreCategory === 'partial' ? 'text-yellow-600 dark:text-yellow-500' :
                          'text-green-600 dark:text-green-500'
                        }`}>
                          {score}/{possible}
                        </span>
                      )}
                    </div>
                  </div>
                  {rubricQuestions.length > originalIndex && (
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} italic font-oswald`}>
                      {rubricQuestions[originalIndex]}
                    </p>
                  )}
                </div>
                
                {/* Collapsible content */}
                {isExpanded && (
                  <div className="mb-4">
                    {/* @ts-expect-error - Required for ReactMarkdown components */}
                    <ReactMarkdown components={components}>
                      {section}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <>
            {/* Single question - make it collapsible too */}
            {sortedSections.length > 0 && (() => {
              const sectionData = sortedSections[0];
              const { section, score, possible } = sectionData;
              const isExpanded = expandedQuestions.has(0);
              
              // Determine score category for visual indicators
              let scoreCategory = 'full';
              let categoryIcon = '✓';
              let categoryText = 'Full Credit';
              
              if (score === 0) {
                scoreCategory = 'incorrect';
                categoryIcon = '✗';
                categoryText = 'Incorrect';
              } else if (score > 0 && score < possible) {
                scoreCategory = 'partial';
                categoryIcon = '◐';
                categoryText = 'Partial Credit';
              }
              
              return (
                <div>
                  <div 
                    className={`${theme === 'dark' ? 'bg-gray-900/50 hover:bg-gray-900/70' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-3 rounded-lg mb-4 cursor-pointer transition-colors`}
                    onClick={() => toggleQuestionExpansion(0)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} font-oswald`}>
                          Question
                        </h3>
                        {isExpanded ? (
                          <ChevronUp className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        ) : (
                          <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-2 py-1 rounded-full text-white font-oswald ${
                          scoreCategory === 'incorrect' ? 'bg-red-500' :
                          scoreCategory === 'partial' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}>
                          {categoryIcon} {categoryText}
                        </span>
                                                 {possible > 0 && (
                           <span className={`text-lg font-bold font-oswald ${
                             scoreCategory === 'incorrect' ? 'text-red-600 dark:text-red-500' :
                             scoreCategory === 'partial' ? 'text-yellow-600 dark:text-yellow-500' :
                             'text-green-600 dark:text-green-500'
                           }`}>
                             {score}/{possible}
                           </span>
                         )}
                      </div>
                    </div>
                    {rubricQuestions.length > 0 && (
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} italic font-oswald`}>
                        {rubricQuestions[0]}
                      </p>
                    )}
                  </div>
                  
                  {/* Collapsible content */}
                  {isExpanded && (
                    <div className="mb-4">
                      {/* @ts-expect-error - Required for ReactMarkdown components */}
                      <ReactMarkdown components={components}>
                        {section}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    );
  };

  // Count ungraded assignments to check if uploads should be disabled
  const ungradedCount = assignments.filter(a => !a.graded).length;
  const isUploadDisabled = ungradedCount >= 3;

  return (
    <Layout activePage="assignments">
      <div className="mb-6">
        <h1 className={`${styles.pageTitle} text-2xl font-bold`}>My Assignments</h1>
        <p className={`${styles.pageSubtitle} text-gray-400`}>View, upload, and grade your assignments</p>
      </div>
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          {isUploadDisabled && (
            <p className="text-amber-400 text-sm">
              <AlertCircle size={16} className="inline-block mr-1" />
              Please grade some assignments before uploading more files.
            </p>
          )}
        </div>
        <div className="relative">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={uploadStatus === 'uploading' || isUploadDisabled}
          />
          <label 
            htmlFor="file-upload" 
            className={`inline-flex items-center px-4 py-2 rounded-md cursor-pointer ${styles.uploadButton} ${
              isUploadDisabled 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } ${uploadStatus === 'uploading' ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Upload size={20} className="mr-2" />
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Assignment'}
          </label>
        </div>
      </div>
      
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
          <span>{uploadMessage}</span>
        </div>
      )}
      
      {/* List of assignments */}
      <div className={`${styles.tableContainer} bg-gray-800 rounded-lg shadow-lg overflow-hidden`}>
        {isLoading ? (
          <div className={`${styles.loadingContainer} flex items-center justify-center p-8`}>
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            <span className="ml-3">Loading assignments...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 text-red-400">
            <AlertCircle size={24} className="mr-2" />
            <span>{error}</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <FileText size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No assignments uploaded yet</h3>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              Upload your first assignment by clicking the &quot;Upload Assignment&quot; button above.
            </p>
            <label 
              htmlFor="file-upload" 
              className={`${styles.uploadButton} inline-flex items-center px-4 py-2 rounded-md cursor-pointer`}
            >
              <Upload size={20} className="mr-2" />
              Upload Assignment
            </label>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className={`${styles.table} w-full`}>
                <thead className={`${styles.tableHead} bg-gray-700`}>
                  <tr>
                    <th className={`${styles.tableHeadCell} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>Name</th>
                    <th className={`${styles.tableHeadCell} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>Size</th>
                    <th className={`${styles.tableHeadCell} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>Uploaded</th>
                    <th className={`${styles.tableHeadCell} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>Status</th>
                    <th className={`${styles.tableHeadCell} px-6 py-3 text-right text-xs font-medium uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`${styles.tableBody} divide-y divide-gray-700`}>
                  {assignments.map((assignment) => (
                    <tr key={assignment.key} className={styles.tableRow}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText size={20} className="text-indigo-400 mr-3" />
                          <span className={`${styles.columnText} font-medium`}>{assignment.name}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${styles.columnText} text-gray-300`}>
                        {formatFileSize(assignment.size)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${styles.columnText} text-gray-300`}>
                        {formatDate(assignment.lastModified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {assignment.graded ? (
                          <span className={`${styles.statusGraded} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                            <Award size={12} className="mr-1" />
                            Graded
                          </span>
                        ) : (
                          <span className={`${styles.statusPending} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                            <Clock size={12} className="mr-1" />
                            Not Graded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a 
                          href={assignment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 mr-3"
                        >
                          Download
                        </a>
                        {assignment.graded ? (
                          <button
                            onClick={() => fetchGradeFeedback(assignment.key)}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                          >
                            Feedback
                          </button>
                        ) : null}
                        <Link 
                          href={`/grade?fileKey=${encodeURIComponent(assignment.key)}`}
                          className="text-green-400 hover:text-green-300 mr-3"
                        >
                          Grade
                        </Link>
                        <button 
                          onClick={() => handleDeleteFile(assignment.key)}
                          className={`${
                            deleteConfirmKey === assignment.key 
                              ? 'text-red-500 hover:text-red-400' 
                              : 'text-red-400 hover:text-red-300'
                          }`}
                          disabled={isDeleting}
                          title={deleteConfirmKey === assignment.key ? "Click again to confirm deletion" : "Delete file"}
                        >
                          {deleteConfirmKey === assignment.key ? "Confirm" : <Trash2 size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Grade Feedback Modal */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col shadow-xl`}>
            <div className={`p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b flex justify-between items-center`}>
              <h3 className={`text-xl font-medium font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Grade Feedback</h3>
              <button 
                onClick={closeGradeModal}
                className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              {isGradeLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className={`animate-spin h-10 w-10 border-4 ${theme === 'dark' ? 'border-blue-500 border-t-transparent' : 'border-indigo-600 border-t-transparent'} rounded-full`}></div>
                </div>
              ) : (
                gradeFeedback && formatResult(gradeFeedback)
              )}
            </div>
            
            <div className={`p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-t flex justify-end`}>
              <button
                onClick={closeGradeModal}
                className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-md font-oswald transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 