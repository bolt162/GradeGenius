'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  BookOpen, 
  Calendar, 
  ChevronDown, 
  ClipboardCheck, 
  Clock, 
  FileText, 
  Home, 
  Mail, 
  Menu, 
  MessageSquare, 
  Moon, 
  Settings, 
  Sun, 
  Users, 
  X, 
  Bell,
  CheckCircle,
  HelpCircle,
  LayoutDashboard,
  Percent,
  User,
  LogOut,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Get current date in a user-friendly format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You would implement actual dark mode toggling with a theme provider
  };
  
  // Toggle profile dropdown
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Handle sign out
  const handleSignOut = () => {
    signOut().then(() => {
      router.push('/');
    });
  };

  // Sample data for metrics
  const metrics = [
    { 
      title: 'Assignments Graded', 
      value: 128, 
      icon: <ClipboardCheck className="text-green-500" size={24} />,
      change: '+12% from last week',
      color: 'bg-green-50 border-green-100'
    },
    { 
      title: 'Pending Assignments', 
      value: 23, 
      icon: <Clock className="text-amber-500" size={24} />,
      change: '5 due today',
      color: 'bg-amber-50 border-amber-100'
    },
    { 
      title: 'Average Score', 
      value: '86%', 
      icon: <Percent className="text-blue-500" size={24} />,
      change: '+3% from last month',
      color: 'bg-blue-50 border-blue-100'
    },
    { 
      title: 'Feedback Rate', 
      value: '92%', 
      icon: <MessageSquare className="text-purple-500" size={24} />,
      change: '24 detailed reviews',
      color: 'bg-purple-50 border-purple-100'
    }
  ];

  // Sample data for recent submissions
  const recentSubmissions = [
    { id: 1, studentName: 'Alex Johnson', title: 'Essay on Modern Literature', time: '2 hours ago', status: 'Pending', score: null },
    { id: 2, studentName: 'Samantha Lee', title: 'Critical Analysis of Poetry', time: '3 hours ago', status: 'Graded', score: '94%' },
    { id: 3, studentName: 'David Kim', title: 'Research Paper: AI Ethics', time: '1 day ago', status: 'Graded', score: '88%' },
    { id: 4, studentName: 'Emily Chen', title: 'History Essay: Industrial Revolution', time: '1 day ago', status: 'Graded', score: '76%' },
    { id: 5, studentName: 'Michael Patel', title: 'Scientific Report', time: '2 days ago', status: 'Pending', score: null },
  ];

  // Sample data for grading queue
  const gradingQueue = [
    { id: 101, studentName: 'Alex Johnson', title: 'Essay on Modern Literature', dueIn: '12 hours', priority: 'High', submittedAt: 'May 15, 2023' },
    { id: 102, studentName: 'Michael Patel', title: 'Scientific Report', dueIn: '2 days', priority: 'Medium', submittedAt: 'May 14, 2023' },
    { id: 103, studentName: 'Jessica Martinez', title: 'Economics Case Study', dueIn: '3 days', priority: 'Low', submittedAt: 'May 13, 2023' },
  ];
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm h-16 flex items-center px-4`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mr-2`}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center">
              <span className="text-indigo-600 text-xl font-bold mr-1">Grade</span>
              <span className="text-xl font-bold">Genius</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Bell size={20} />
            </button>
            
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative">
              <button 
                onClick={toggleProfile}
                className="flex items-center space-x-2"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                  {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:block">{user?.firstName || 'User'}</span>
                <ChevronDown size={16} />
              </button>
              
              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    <Link href="/profile" className={`block px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      Your Profile
                    </Link>
                    <Link href="/settings" className={`block px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      Settings
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <nav className="h-full py-4 flex flex-col">
          <div className="px-4 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center py-3 px-3 rounded-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-indigo-50 text-indigo-600'}`}
            >
              <LayoutDashboard size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Dashboard</span>
            </Link>
            
            <Link
              href="/assignments"
              className={`flex items-center py-3 px-3 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <FileText size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Assignments</span>
            </Link>
            
            <Link
              href="/students"
              className={`flex items-center py-3 px-3 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Users size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Students</span>
            </Link>
            
            <Link
              href="/analytics"
              className={`flex items-center py-3 px-3 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <BarChart3 size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Analytics</span>
            </Link>
            
            <Link
              href="/settings"
              className={`flex items-center py-3 px-3 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Settings size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Settings</span>
            </Link>
          </div>
          
          <div className="mt-auto px-4">
            <Link
              href="/help"
              className={`flex items-center py-3 px-3 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <HelpCircle size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Help & Support</span>
            </Link>
            
            <button
              onClick={handleSignOut}
              className={`flex items-center w-full text-left py-3 px-3 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <LogOut size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>Logout</span>
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <main className={`flex-1 mt-16 p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Welcome section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Welcome, {user?.firstName || 'User'}!</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentDate}</p>
          </div>
          
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div 
                key={index} 
                className={`${isDarkMode ? 'bg-gray-800' : `${metric.color}`} ${isDarkMode ? 'border-gray-700' : 'border'} rounded-lg p-5 shadow-sm transition-all hover:shadow-md`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{metric.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{metric.change}</p>
                  </div>
                  <div className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    {metric.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Submissions Section */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm lg:col-span-2 overflow-hidden`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Submissions</h2>
                <Link href="/assignments" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} text-xs uppercase tracking-wider`}>
                    <tr>
                      <th className="px-6 py-3 text-left">Student</th>
                      <th className="px-6 py-3 text-left">Assignment</th>
                      <th className="px-6 py-3 text-left">Submitted</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Score</th>
                      <th className="px-6 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">{submission.studentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.status === 'Graded' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.score || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                            {submission.status === 'Pending' ? 'Grade' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Grading Queue Section */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Grading Queue</h2>
              </div>
              <div className="p-4 space-y-3">
                {gradingQueue.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${
                      item.priority === 'High' 
                        ? 'border-red-200 dark:border-red-900' 
                        : item.priority === 'Medium'
                          ? 'border-yellow-200 dark:border-yellow-900'
                          : 'border-blue-200 dark:border-blue-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.priority === 'High' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : item.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.studentName}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Due in {item.dueIn}
                      </p>
                      <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md">
                        Grade Now
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    View All Pending ({gradingQueue.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Analytics */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm mt-6 p-6`}>
            <h2 className="text-lg font-semibold mb-4">Performance Analytics</h2>
            <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
              <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Analytics charts will be displayed here
                <br />
                <span className="text-xs">Coming soon!</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 