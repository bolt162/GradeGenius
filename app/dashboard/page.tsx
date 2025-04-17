import { currentUser } from "@clerk/nextjs";
import Navigation from '../components/Navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) return null; // This shouldn't happen due to middleware, but just in case
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600">
                    {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-neutral-600">Your GradeGenius Dashboard</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-indigo-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-indigo-800 mb-2">Quick Stats</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Assignments Graded</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Average Score</span>
                    <span className="font-medium">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Feedback Provided</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-indigo-800 mb-2">Account Info</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Plan</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Usage</span>
                    <span className="font-medium">0/5 assignments</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Member Since</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/demo" className="bg-indigo-600 text-white rounded-lg p-6 text-center hover:bg-indigo-700 transition-colors">
                  Grade New Assignment
                </Link>
                <button className="bg-white border border-indigo-600 text-indigo-600 rounded-lg p-6 text-center hover:bg-indigo-50 transition-colors">
                  View History
                </button>
                <button className="bg-white border border-indigo-600 text-indigo-600 rounded-lg p-6 text-center hover:bg-indigo-50 transition-colors">
                  Account Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer would go here */}
    </div>
  );
} 