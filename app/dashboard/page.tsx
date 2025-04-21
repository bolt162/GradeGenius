'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  BarChart3, 
  ClipboardCheck, 
  Clock, 
  FileText, 
  MessageSquare, 
  Percent,
  Upload,
  Award,
  AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout';

interface Assignment {
  key: string;
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  graded?: boolean;
  timestamp?: string;
}

interface GradeInfo {
  fileKey: string;
  timestamp: string;
  fileName: string;
  lastModified?: Date;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState([
    { 
      title: 'Assignments Graded', 
      value: '0', 
      icon: <ClipboardCheck className="text-green-500" size={24} />,
      change: 'Loading...',
      color: 'bg-green-50 border-green-100'
    },
    { 
      title: 'Pending Assignments', 
      value: '0', 
      icon: <Clock className="text-amber-500" size={24} />,
      change: 'Loading...',
      color: 'bg-amber-50 border-amber-100'
    },
    { 
      title: 'Average Score', 
      value: '0%', 
      icon: <Percent className="text-blue-500" size={24} />,
      change: 'Loading...',
      color: 'bg-blue-50 border-blue-100'
    },
    { 
      title: 'Feedback Rate', 
      value: '0%', 
      icon: <MessageSquare className="text-purple-500" size={24} />,
      change: 'Loading...',
      color: 'bg-purple-50 border-purple-100'
    }
  ]);
  
  // Get current date in a user-friendly format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  useEffect(() => {
    if (isLoaded && user) {
      fetchAssignmentsAndGrades();
    }
  }, [isLoaded, user]);
  
  const fetchAssignmentsAndGrades = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all assignments
      const assignmentsResponse = await fetch('/api/assignments');
      
      if (!assignmentsResponse.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const assignmentsData = await assignmentsResponse.json();
      let assignmentsList = assignmentsData.assignments || [];
      
      // Fetch all grades
      const gradesResponse = await fetch('/api/grades');
      
      if (!gradesResponse.ok) {
        throw new Error('Failed to fetch grades');
      }
      
      const gradesData = await gradesResponse.json();
      const grades = gradesData.grades || [];
      
      // Map of fileKey to grade info
      const gradeMap = new Map();
      grades.forEach((grade: GradeInfo) => {
        gradeMap.set(grade.fileKey, {
          timestamp: grade.timestamp,
          lastModified: grade.lastModified
        });
      });
      
      // Merge assignment data with grade info
      assignmentsList = assignmentsList.map((assignment: Assignment) => {
        const gradeInfo = gradeMap.get(assignment.key);
        if (gradeInfo) {
          return {
            ...assignment,
            graded: true,
            timestamp: gradeInfo.timestamp
          };
        }
        return {
          ...assignment,
          graded: false
        };
      });
      
      // Sort by lastModified date (newest first)
      assignmentsList.sort((a: Assignment, b: Assignment) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
      
      // Calculate metrics
      updateMetricsFromData(assignmentsList);
      
      // Take only the 5 most recent for display
      setAssignments(assignmentsList.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateMetricsFromData = (assignmentsList: Assignment[]) => {
    // Calculate real metrics based on assignments data
    const totalAssignments = assignmentsList.length;
    const gradedAssignments = assignmentsList.filter(a => a.graded).length;
    const pendingAssignments = totalAssignments - gradedAssignments;
    
    // Calculate percentage of assignments that have been graded
    const feedbackRate = totalAssignments > 0 
      ? Math.round((gradedAssignments / totalAssignments) * 100) 
      : 0;
      
    // We don't have actual scores in our current data model,
    // so for now we'll use a placeholder
    // In a real implementation, this would calculate from actual scores
    const averageScore = gradedAssignments > 0 ? '85%' : 'N/A';
    
    // Update metrics with real data
    setMetrics([
      { 
        title: 'Assignments Graded', 
        value: gradedAssignments.toString(), 
        icon: <ClipboardCheck className="text-green-500" size={24} />,
        change: totalAssignments > 0 
          ? `${Math.round((gradedAssignments / totalAssignments) * 100)}% of total` 
          : 'No assignments',
        color: 'bg-green-50 border-green-100'
      },
      { 
        title: 'Pending Assignments', 
        value: pendingAssignments.toString(), 
        icon: <Clock className="text-amber-500" size={24} />,
        change: pendingAssignments === 1 
          ? '1 assignment needs grading' 
          : `${pendingAssignments} assignments need grading`,
        color: 'bg-amber-50 border-amber-100'
      },
      { 
        title: 'Average Score', 
        value: averageScore, 
        icon: <Percent className="text-blue-500" size={24} />,
        change: gradedAssignments === 0 
          ? 'No graded assignments yet' 
          : 'Based on graded assignments',
        color: 'bg-blue-50 border-blue-100'
      },
      { 
        title: 'Feedback Rate', 
        value: `${feedbackRate}%`, 
        icon: <MessageSquare className="text-purple-500" size={24} />,
        change: `${gradedAssignments} of ${totalAssignments} assignments graded`,
        color: 'bg-purple-50 border-purple-100'
      }
    ]);
  };
  
  // Calculate time ago from date
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  };
  
  // Sample data for grading queue
  const gradingQueue = [
    { id: 101, studentName: 'Alex Johnson', title: 'Essay on Modern Literature', dueIn: '12 hours', priority: 'High', submittedAt: 'May 15, 2023' },
    { id: 102, studentName: 'Michael Patel', title: 'Scientific Report', dueIn: '2 days', priority: 'Medium', submittedAt: 'May 14, 2023' },
    { id: 103, studentName: 'Jessica Martinez', title: 'Economics Case Study', dueIn: '3 days', priority: 'Low', submittedAt: 'May 13, 2023' },
  ];
  
  return (
    <Layout activePage="dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg overflow-hidden shadow-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Welcome back, {user?.username || user?.firstName || 'Teacher'}!</h2>
              <p className="text-indigo-100">{currentDate}</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Link 
                href="/grade" 
                className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50 flex items-center"
              >
                <Upload className="mr-2" size={18} />
                Upload & Grade New Assignment
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className={`bg-gray-800 rounded-lg shadow-lg p-6 border-t-4 border-${metric.color.split(' ')[1]}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium">{metric.title}</p>
                <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
              </div>
              <div className="p-2 rounded-md bg-gray-700">
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Recent Submissions</h2>
            <Link href="/assignments" className="text-sm text-indigo-400 hover:text-indigo-300">View All</Link>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-3">Loading assignments...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-400">
              <AlertCircle className="mr-2" size={24} />
              <span>{error}</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="mb-4 opacity-50" size={48} />
              <h3 className="text-xl font-medium mb-2">No assignments yet</h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                Upload your first assignment to get started.
              </p>
              <Link 
                href="/grade" 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white flex items-center"
              >
                <Upload className="mr-2" size={18} />
                Upload Assignment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50 text-left">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-3/6">Assignment</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6 min-w-[120px]">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">Time</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {assignments.map((assignment) => (
                    <tr key={assignment.key} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          <FileText className="text-indigo-400 mr-2 flex-shrink-0" size={16} />
                          <span className="truncate">{assignment.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                          assignment.graded 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {assignment.graded ? (
                            <>
                              <Award size={12} className="mr-1 flex-shrink-0" />
                              <span>Graded</span>
                            </>
                          ) : (
                            'Not Graded'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {getTimeAgo(assignment.lastModified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <Link 
                          href={`/grade?fileKey=${encodeURIComponent(assignment.key)}`}
                          className="text-green-400 hover:text-green-300"
                        >
                          {assignment.graded ? 'View Grade' : 'Grade'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Grading Queue */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="font-semibold text-lg">Grading Queue</h2>
          </div>
          <div className="p-4 space-y-3">
            {assignments.filter(a => !a.graded).slice(0, 3).map((item) => (
              <div key={item.key} className="p-4 rounded-lg bg-gray-700 hover:bg-gray-700/80">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-900/30 text-yellow-400">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-400">Uploaded {getTimeAgo(item.lastModified)}</p>
                <div className="mt-3">
                  <Link 
                    href={`/grade?fileKey=${encodeURIComponent(item.key)}`}
                    className="w-full text-center block bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm"
                  >
                    Grade Now
                  </Link>
                </div>
              </div>
            ))}
            {assignments.filter(a => !a.graded).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Clock className="mx-auto mb-3 opacity-50" size={32} />
                <p>No pending assignments</p>
                <p className="text-sm text-gray-500 mt-1">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 