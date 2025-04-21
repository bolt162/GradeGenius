'use client';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from './components/Navigation';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Page Not Found</h1>
            <p className="text-xl text-neutral-700">The page you're looking for doesn't exist or has been moved</p>
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
              
              <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Oops! You've hit a 404</h2>
              
              <p className="text-neutral-600 mb-8">
                We couldn't find the page you were looking for. It might have been moved,
                deleted, or perhaps the URL was mistyped.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Homepage
                </Link>
                
                <button 
                  onClick={() => window.history.back()} 
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 