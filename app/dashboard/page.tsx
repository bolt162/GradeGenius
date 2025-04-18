'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useUser();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName || 'User'}!</h2>
        <p className="mb-4">You have successfully authenticated and accessed the protected dashboard page.</p>
        
        <div className="mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 