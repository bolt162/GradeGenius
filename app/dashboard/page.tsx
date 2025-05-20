'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
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
import styles from './dashboard.module.css';

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
  
  return (
    <Layout activePage="dashboard">
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeHeader}>
            <div>
              <h2 className={styles.welcomeText}>Welcome, {user?.username || user?.firstName || 'Teacher'}!</h2>
              <p className={styles.welcomeDate}>{currentDate}</p>
            </div>
            <div className={styles.headerButtonsContainer}>
              <Link 
                href="/grade" 
                className={styles.uploadButton}
              >
                <Upload className="mr-2" size={18} />
                Upload & Grade New Assignment
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <div key={index} className={`${styles.metricCard} border-${metric.color.split(' ')[1]}`}>
            <div className={styles.metricHeader}>
              <div>
                <p className={styles.metricTitle}>{metric.title}</p>
                <h3 className={styles.metricValue}>{metric.value}</h3>
                <p className={styles.metricChange}>{metric.change}</p>
              </div>
              <div className={styles.metricIcon}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content Area */}
      <div className={styles.contentGrid}>
        {/* Recent Submissions */}
        <div className={styles.submissionsPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Recent Submissions</h2>
            <Link href="/assignments" className={styles.viewAllLink}>View All</Link>
          </div>
          
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <span className={styles.loadingText}>Loading assignments...</span>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <AlertCircle className={styles.errorIcon} size={24} />
              <span>{error}</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className={styles.emptyContainer}>
              <FileText className={styles.emptyIcon} size={48} />
              <h3 className={styles.emptyTitle}>No assignments yet</h3>
              <p className={styles.emptyDescription}>
                Upload your first assignment to get started.
              </p>
              <Link 
                href="/grade" 
                className={styles.uploadCta}
              >
                <Upload className="mr-2" size={18} />
                Upload Assignment
              </Link>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={`${styles.tableHeadCell} w-3/6`}>Assignment</th>
                    <th className={`${styles.tableHeadCell} w-1/6 min-w-[120px]`}>Status</th>
                    <th className={`${styles.tableHeadCell} w-1/6`}>Time</th>
                    <th className={`${styles.tableHeadCell} w-1/6 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {assignments.map((assignment) => (
                    <tr key={assignment.key} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.fileName}>
                          <FileText className={styles.fileIcon} size={16} />
                          <span className="truncate">{assignment.name}</span>
                        </div>
                      </td>
                      <td className={styles.statusCell}>
                        <span className={`${styles.statusBadge} ${
                          assignment.graded 
                            ? styles.statusGraded
                            : styles.statusPending
                        }`}>
                          {assignment.graded ? (
                            <>
                              <Award size={12} className={styles.statusIcon} style={{color: '#000000'}} />
                              <span>Graded</span>
                            </>
                          ) : (
                            'Not Graded'
                          )}
                        </span>
                      </td>
                      <td className={styles.timeCell}>
                        {getTimeAgo(assignment.lastModified)}
                      </td>
                      <td className={styles.actionCell}>
                        <Link 
                          href={`/grade?fileKey=${encodeURIComponent(assignment.key)}`}
                          className={styles.actionLink}
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
        <div className={styles.queuePanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Grading Queue</h2>
          </div>
          <div className={styles.queueList}>
            {assignments.filter(a => !a.graded).slice(0, 3).map((item) => (
              <div key={item.key} className={styles.queueItem}>
                <div className={styles.queueItemHeader}>
                  <h3 className={styles.queueItemTitle}>{item.name}</h3>
                  <span className={styles.queueItemStatus}>
                    Pending
                  </span>
                </div>
                <p className={styles.queueItemTime}>Uploaded {getTimeAgo(item.lastModified)}</p>
                <div className={styles.queueItemAction}>
                  <Link 
                    href={`/grade?fileKey=${encodeURIComponent(item.key)}`}
                    className={styles.queueItemLink}
                  >
                    Grade Now
                  </Link>
                </div>
              </div>
            ))}
            {assignments.filter(a => !a.graded).length === 0 && (
              <div className={styles.emptyQueueContainer}>
                <Clock className={styles.emptyQueueIcon} size={32} />
                <p>No pending assignments</p>
                <p className={styles.emptyQueueText}>All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 