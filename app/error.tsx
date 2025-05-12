'use client';
 
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from './components/Navigation/Navigation';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);
 
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Something Went Wrong</h1>
            <p className="text-xl text-neutral-700">We encountered an error while processing your request</p>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
              <div className="mb-8">
                <Image 
                  src="/images/main_logo.png"
                  alt="GradeGenius Logo"
                  width={96}
                  height={96}
                  className="w-24 h-24 mx-auto"
                />
              </div>
              
              <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Oops! An Error Occurred</h2>
              
              <p className="text-neutral-600 mb-8">
                We&apos;re sorry for the inconvenience. Our team has been notified of this issue.
                You can try again or return to the homepage.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Homepage
                </Link>
                
                <button 
                  onClick={() => reset()} 
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Try Again
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 text-left p-4 bg-gray-100 rounded-md overflow-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details (Development Only):</h3>
                  <p className="text-sm text-gray-600 font-mono">{error.message}</p>
                  {error.stack && (
                    <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 