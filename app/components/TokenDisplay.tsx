'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Coins } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function TokenDisplay() {
  const { user, isLoaded } = useUser();
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center p-2 bg-gray-800 rounded-md text-sm">
        <div className="animate-pulse flex space-x-2 items-center">
          <Coins size={16} className="text-gray-400" />
          <span className="text-gray-400">Loading tokens...</span>
        </div>
      </div>
    );
  }

  if (error || tokens === null) {
    return (
      <div className="flex items-center p-2 bg-gray-800 rounded-md text-sm">
        <Coins size={16} className="text-red-400 mr-2" />
        <span className="text-red-400">Unable to load tokens</span>
      </div>
    );
  }

  // Format number with commas
  const formattedTokens = tokens.toLocaleString();

  const tokenColor = tokens > 5000 
    ? 'text-green-400' 
    : tokens > 1000 
      ? 'text-yellow-400' 
      : 'text-red-400';

  return (
    <div className="flex items-center p-2 bg-gray-800 rounded-md text-sm">
      <Coins size={16} className={`${tokenColor} mr-2`} />
      <span className="text-gray-300 mr-1">Tokens:</span>
      <span className={`font-medium ${tokenColor}`}>{formattedTokens}</span>
      <Link href="/tokens" className="ml-3 text-blue-400 hover:text-blue-300 flex items-center">
        <CreditCard size={14} className="mr-1" />
        <span>Buy More</span>
      </Link>
    </div>
  );
} 