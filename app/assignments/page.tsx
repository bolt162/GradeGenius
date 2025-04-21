'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { FileText, Upload, AlertCircle, CheckCircle, Award, Eye, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';

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
        grades.forEach((grade: any) => {
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
      const response = await fetch(`/api/grade/${encodeURIComponent(fileKey)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch grade feedback');
      }
      
      const data = await response.json();
      setGradeFeedback(data.grade?.gradeResult || 'No feedback available');
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
        throw new Error('Upload failed');
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
      setUploadMessage('Failed to upload file. Please try again.');
      
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

  // Count ungraded assignments to check if uploads should be disabled
  const ungradedCount = assignments.filter(a => !a.graded).length;
  const isUploadDisabled = ungradedCount >= 3;

  return (
    <Layout activePage="assignments">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-gray-400">View, upload, and grade your assignments</p>
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
            className={`inline-flex items-center px-4 py-2 rounded-md cursor-pointer ${
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
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
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
              Upload your first assignment by clicking the "Upload Assignment" button above.
            </p>
            <label 
              htmlFor="file-upload" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md cursor-pointer text-white"
            >
              <Upload size={20} className="mr-2" />
              Upload Assignment
            </label>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {assignments.map((assignment) => (
                    <tr key={assignment.key} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText size={20} className="text-indigo-400 mr-3" />
                          <span className="font-medium">{assignment.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatFileSize(assignment.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(assignment.lastModified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {assignment.graded ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                            <Award size={12} className="mr-1" />
                            Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400">
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
                          View
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
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-medium">Grade Feedback</h3>
              <button 
                onClick={closeGradeModal}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              {isGradeLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  {gradeFeedback?.split('\n').map((line, i) => (
                    line ? <p key={i} className="mb-4">{line}</p> : <br key={i} />
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={closeGradeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
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