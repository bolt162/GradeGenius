'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center m-4">
            <div className="mb-8">
              <img 
                src="/images/main_logo.png"
                alt="GradeGenius Logo"
                width={96}
                height={96}
                className="w-24 h-24 mx-auto"
              />
            </div>
            
            <h1 className="text-2xl font-semibold text-neutral-800 mb-4">Something Went Wrong</h1>
            
            <p className="text-neutral-600 mb-8">
              We've experienced a critical error. Our team has been notified of this issue.
              Please try refreshing the page.
            </p>
            
            <button 
              onClick={() => reset()} 
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </button>
            
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
      </body>
    </html>
  );
} 