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
  const [currentTheme, setCurrentTheme] = useState<string>('dark');
  
  // Track theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(theme);
      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            setCurrentTheme(newTheme);
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);

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
      <div className={`flex items-center p-2 ${currentTheme === 'light' ? 'bg-white border border-black' : 'bg-gray-800'} rounded-md text-sm`}>
        <div className="animate-pulse flex space-x-2 items-center">
          <Coins size={16} className={`${currentTheme === 'light' ? 'text-black' : 'text-gray-400'}`} />
          <span className={`${currentTheme === 'light' ? 'text-black' : 'text-gray-400'}`}>Loading tokens...</span>
        </div>
      </div>
    );
  }

  if (error || tokens === null) {
    return (
      <div className={`flex items-center p-2 ${currentTheme === 'light' ? 'bg-white border border-black' : 'bg-gray-800'} rounded-md text-sm`}>
        <Coins size={16} className="text-red-400 mr-2" />
        <span className="text-red-400">Unable to load tokens</span>
      </div>
    );
  }

  // Format number with commas
  const formattedTokens = tokens.toLocaleString();

  return (
    <div className={`flex items-center p-2 ${currentTheme === 'light' ? 'bg-white border border-black' : 'bg-gray-800'} rounded-md text-sm`}>
      <Coins size={16} className={`${currentTheme === 'light' ? 'text-black' : 'text-gray-300'} mr-2`} />
      <span className={`${currentTheme === 'light' ? 'text-black' : 'text-gray-300'} mr-1 font-[var(--font-oswald)]`}>Tokens:</span>
      <span className={`font-medium ${currentTheme === 'light' ? 'text-black' : 'text-gray-300'}`}>{formattedTokens}</span>
      <Link href="/tokens" className="ml-3 text-[#0255ab] hover:text-blue-700 flex items-center font-medium font-[var(--font-oswald)]">
        <CreditCard size={14} className="mr-1" />
        <span>Buy More</span>
      </Link>
    </div>
  );
} 