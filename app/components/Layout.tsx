'use client';

import { useState, useEffect } from 'react';
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
  Settings, 
  Users, 
  X, 
  Bell,
  CheckCircle,
  HelpCircle,
  LayoutDashboard,
  Percent,
  User,
  LogOut,
  Upload,
  Coins,
  ClipboardList
} from 'lucide-react';
import TokenDisplay from './TokenDisplay';

interface LayoutProps {
  children: React.ReactNode;
  activePage?: 'dashboard' | 'assignments' | 'students' | 'analytics' | 'rubrics' | 'settings' | 'help';
}

export default function Layout({ children, activePage = 'dashboard' }: LayoutProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check authentication on load
  useEffect(() => {
    if (isLoaded) {
      // If user is not signed in, redirect to login
      if (!isSignedIn) {
        // Redirect with forceSignOut to clear any invalid cookies
        router.push('/login?forceSignOut=true');
        return;
      }
      
      // Also check if cookies exist as a backup check
      checkCookies();
      
      setIsAuthChecked(true);
    }
  }, [isLoaded, isSignedIn, router]);
  
  // Extra validation - check if cookies exist
  const checkCookies = () => {
    // Check for session cookies
    const hasCookies = document.cookie.includes('__session') || 
                      document.cookie.includes('__clerk_db_jwt');
    
    if (!hasCookies) {
      console.log('No auth cookies found, redirecting to login');
      router.push('/login?forceSignOut=true');
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Toggle profile dropdown
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Handle sign out
  const handleSignOut = () => {
    signOut().then(() => {
      // Clear cookies
      document.cookie = '__session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '__clerk_db_jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '__clerk=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'last_activity=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      router.push('/');
    });
  };

  // If auth check is not complete, show loading
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 shadow-sm h-16 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-md hover:bg-gray-700 mr-2"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-indigo-600 text-xl font-bold mr-1">Grade</span>
                <span className="text-xl font-bold">Genius</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Token Display */}
            <div className="hidden md:block">
              <TokenDisplay />
            </div>
            
            <button className="p-2 rounded-full hover:bg-gray-700">
              <Bell size={20} />
            </button>
            
            <div className="relative">
              <button 
                onClick={toggleProfile}
                className="flex items-center space-x-2"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:block">{user?.firstName || 'User'}</span>
                <ChevronDown size={16} />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      Your Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-700">
                      Settings
                    </Link>
                    <Link href="/tokens" className="block px-4 py-2 text-sm hover:bg-gray-700 flex items-center">
                      <Coins size={16} className="mr-2" />
                      Buy Tokens
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
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
      <div className={`fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} bg-gray-800 shadow-md`}>
        <nav className="h-full py-4 flex flex-col">
          <div className="px-4 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center py-3 px-3 rounded-md ${activePage === 'dashboard' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
            >
              <LayoutDashboard size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Dashboard</span>
            </Link>
            
            <Link
              href="/assignments"
              className={`flex items-center py-3 px-3 rounded-md ${activePage === 'assignments' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
            >
              <FileText size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Assignments</span>
            </Link>
            
            <Link
              href="/analytics"
              className={`flex items-center py-3 px-3 rounded-md ${activePage === 'analytics' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
            >
              <BarChart3 size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Analytics</span>
            </Link>
            
            <Link
              href="/rubrics"
              className={`flex items-center py-3 px-3 rounded-md ${activePage === 'rubrics' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
            >
              <ClipboardList size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Rubrics</span>
            </Link>
            
            <Link
              href="/tokens"
              className="flex items-center py-3 px-3 rounded-md hover:bg-gray-700"
            >
              <Coins size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Tokens</span>
            </Link>
            
            <Link
              href="/settings"
              className={`flex items-center py-3 px-3 rounded-md ${activePage === 'settings' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
            >
              <Settings size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Settings</span>
            </Link>
          </div>
          
          <div className="mt-auto px-4">
            <Link
              href="/help"
              className={`flex items-center py-3 px-3 rounded-md ${activePage === 'help' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
            >
              <HelpCircle size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Help & Support</span>
            </Link>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full text-left py-3 px-3 rounded-md hover:bg-gray-700"
            >
              <LogOut size={20} />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>Logout</span>
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0 md:ml-20'} pt-24 px-6 pb-8`}>
        {/* Mobile Token Display */}
        <div className="mb-4 md:hidden">
          <TokenDisplay />
        </div>
        
        {children}
      </main>
      
      {/* Footer */}
      <footer className={`py-4 px-6 bg-gray-800 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm mb-2 md:mb-0">
            &copy; {new Date().getFullYear()} GradeGenius. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-sm hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-sm hover:underline">Terms of Service</Link>
            <Link href="/#contact" className="text-sm hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 