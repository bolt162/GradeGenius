'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Coins, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';

interface TokenPlan {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
}

export default function TokensPage() {
  const { user, isLoaded } = useUser();
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Token plans available for purchase
  const tokenPlans: TokenPlan[] = [
    { id: 'freemium', name: 'Freemium', tokens: 12, price: 0 },
    { id: 'standard', name: 'Standard', tokens: 250, price: 19.99 },
    { id: 'pro', name: 'Professional', tokens: 0, price: 0 }
  ];

  // Fetch token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      // Wait for Clerk to load user info
      if (!isLoaded || !user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/tokens');
        
        if (!response.ok) {
          throw new Error('Failed to fetch token information');
        }
        
        const data = await response.json();
        setTokens(data.tokens);
      } catch (error) {
        console.error('Error fetching token information:', error);
        setError('Failed to load token information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokenInfo();
  }, [isLoaded, user]);

  // All plans are coming soon since there's no Stripe integration yet
  const handleSelectPlan = (planId: string) => {
    // Disabled since all plans are coming soon
    return;
  };

  const handlePurchaseTokens = async () => {
    // Disabled until Stripe integration is implemented
    return;
  };
  
  // Format number with commas - safely handle null/undefined
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Token Management</h1>
          <p className="text-gray-400">Purchase and manage your tokens for grading assignments</p>
        </div>
        
        {/* Current Token Information */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Coins className="mr-2 text-indigo-400" size={24} />
            Your Token Balance
          </h2>
          
          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-400">Loading token information...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 text-red-400 p-4 rounded-md">
              <AlertCircle className="inline mr-2" size={20} />
              {error}
            </div>
          ) : tokens !== null ? (
            <div className="bg-gray-700/50 p-4 rounded-md">
              <div className="text-sm text-gray-400 mb-1">Available Tokens</div>
              <div className="text-3xl font-bold text-indigo-400">{formatNumber(tokens)}</div>
              <div className="text-xs text-gray-500 mt-1">Each token allows you to grade one assignment</div>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center">
              <span className="text-gray-400">No token information available</span>
            </div>
          )}
        </div>
        
        {/* Token Purchase Options */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <CreditCard className="mr-2 text-indigo-400" size={24} />
            Purchase Tokens
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Display token plans */}
            {tokenPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative border-2 ${plan.id === 'freemium' ? 'border-indigo-500' : 'border-gray-700'} rounded-lg p-5 ${plan.id === 'standard' ? 'opacity-75 cursor-not-allowed' : plan.id === 'pro' ? 'cursor-pointer hover:border-indigo-400 transition-colors' : ''}`}
                onClick={plan.id === 'pro' ? () => window.open('/#contact', '_blank') : undefined}
                role={plan.id === 'pro' ? "button" : undefined}
                aria-label={plan.id === 'pro' ? "Contact us for professional plan" : undefined}
              >
                {plan.id === 'freemium' ? (
                  <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs py-1 px-2 rounded-full">
                    Current Plan
                  </div>
                ) : plan.id === 'standard' ? (
                  <div className="absolute -top-3 right-4 bg-gray-600 text-white text-xs py-1 px-2 rounded-full">
                    Coming Soon
                  </div>
                ) : null}
                
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                {plan.id === 'pro' ? (
                  <div className="text-gray-400 mb-1">Custom plan based on your needs</div>
                ) : (
                  <div className="text-2xl font-bold text-indigo-400 mb-1">{formatNumber(plan.tokens)}</div>
                )}
                <div className="text-gray-400 text-sm mb-3">{plan.id === 'pro' ? '' : 'tokens'}</div>
                {plan.id === 'pro' ? (
                  <div className="text-xl font-semibold flex items-center">
                    Contact Us <span className="ml-1 text-indigo-400">→</span>
                  </div>
                ) : (
                  <div className="text-xl font-semibold">{plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}</div>
                )}
                {plan.id !== 'pro' && plan.tokens > 0 && plan.price > 0 && (
                  <div className="text-gray-400 text-xs mt-1">
                    ${(plan.price / plan.tokens).toFixed(2)} per token
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center">
            <button
              disabled={true}
              className="px-6 py-3 rounded-md flex items-center bg-gray-700 text-gray-400 cursor-not-allowed"
            >
              <CreditCard size={20} className="mr-2" />
              Payment Integration Coming Soon
            </button>
            <p className="mt-4 text-sm text-yellow-500">
              Online payments are coming soon! Check back for updates.
            </p>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            Your tokens will be added immediately after purchase. No refunds available for token purchases.
          </div>
        </div>
        
        {/* Token Usage Information */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How Tokens Work</h2>
          
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-indigo-400">Tokens</strong> are used every time you grade an assignment. 
              Each grading operation costs exactly 1 token, regardless of the assignment size.
            </p>
            
            <p>
              This means if you have 20 tokens, you can grade exactly 20 assignments. Both new grading requests
              and re-grading existing assignments count as separate operations and will use 1 token each.
            </p>
            
            <div className="mt-6 text-sm text-gray-400">
              <p>New users receive 12 tokens upon signing up for GradeGenius.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 