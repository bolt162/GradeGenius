'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { BarChart3, ChartBarIcon } from 'lucide-react';
import Layout from '../components/Layout';

export default function AnalyticsPage() {
  const { user } = useUser();
  
  // Get current date in a user-friendly format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Layout activePage="analytics">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg overflow-hidden shadow-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Analytics Dashboard</h2>
              <p className="text-indigo-100">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Coming Soon Message */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-10">
        <div className="flex flex-col items-center justify-center text-center py-16">
          <BarChart3 className="text-indigo-400 mb-6" size={80} />
          <h2 className="text-3xl font-bold mb-4">Analytics Coming Soon</h2>
          <p className="text-gray-400 max-w-2xl mb-6">
            We're working on powerful analytics tools to help you track student performance,
            identify trends, and gain insights into your grading process.
          </p>
          <div className="bg-gray-700/50 rounded-lg p-6 max-w-xl">
            <h3 className="text-xl font-semibold mb-3">What to Expect</h3>
            <ul className="text-left space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="bg-indigo-500/20 p-1 rounded mr-3 mt-1">
                  <BarChart3 className="text-indigo-400" size={16} />
                </span>
                <span>Performance tracking across assignments</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-500/20 p-1 rounded mr-3 mt-1">
                  <BarChart3 className="text-indigo-400" size={16} />
                </span>
                <span>Detailed grading statistics and insights</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-500/20 p-1 rounded mr-3 mt-1">
                  <BarChart3 className="text-indigo-400" size={16} />
                </span>
                <span>Trend analysis to improve teaching methods</span>
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-500/20 p-1 rounded mr-3 mt-1">
                  <BarChart3 className="text-indigo-400" size={16} />
                </span>
                <span>Exportable reports for academic planning</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
} 