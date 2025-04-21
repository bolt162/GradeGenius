'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  Key, 
  CreditCard, 
  LogOut, 
  ChevronRight, 
  User, 
  Shield, 
  Bell, 
  Save,
  CheckCircle,
  AlertCircle,
  Coins
} from 'lucide-react';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'password' | 'billing' | 'account'>('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  
  // Fetch token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      setIsLoadingTokens(true);
      try {
        const response = await fetch('/api/tokens');
        const data = await response.json();
        
        if (response.ok) {
          setTokenBalance(data.tokens);
        } else {
          console.error('Error fetching token balance:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch token balance:', error);
      } finally {
        setIsLoadingTokens(false);
      }
    };
    
    fetchTokenBalance();
  }, []);
  
  // Password strength requirements state
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });
  
  // Check password requirements on change
  const updatePasswordRequirements = (password: string) => {
    setRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate password
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    // Check all requirements are met
    const allRequirementsMet = 
      requirements.length && 
      requirements.uppercase && 
      requirements.lowercase && 
      requirements.number && 
      requirements.symbol;
      
    if (!allRequirementsMet) {
      setPasswordError('Password does not meet all requirements');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Here you would call Clerk's API to update the password
      // For demo purposes, we're just simulating a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError('Failed to update password. Please try again.');
      console.error('Password update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    signOut().then(() => {
      router.push('/');
    });
  };

  return (
    <Layout activePage="settings">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                    {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-sm text-gray-400">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  <button 
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center justify-between p-3 rounded-md ${activeTab === 'account' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                  >
                    <div className="flex items-center">
                      <User className="mr-3 h-5 w-5 text-indigo-400" />
                      <span>Account</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center justify-between p-3 rounded-md ${activeTab === 'password' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                  >
                    <div className="flex items-center">
                      <Key className="mr-3 h-5 w-5 text-indigo-400" />
                      <span>Change Password</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('billing')}
                    className={`w-full flex items-center justify-between p-3 rounded-md ${activeTab === 'billing' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                  >
                    <div className="flex items-center">
                      <CreditCard className="mr-3 h-5 w-5 text-indigo-400" />
                      <span>Billing</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-700 text-red-400 hover:text-red-300"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Logout</span>
                    </div>
                  </button>
                </nav>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="md:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6">
              {/* Account Settings */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                      <div className="flex space-x-4">
                        <input 
                          type="text" 
                          value={user?.firstName || ''} 
                          disabled
                          className="bg-gray-700 text-white rounded-md p-2 w-full"
                        />
                        <input 
                          type="text" 
                          value={user?.lastName || ''} 
                          disabled
                          className="bg-gray-700 text-white rounded-md p-2 w-full"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-400">To change your name, please visit your Clerk profile.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={user?.primaryEmailAddress?.emailAddress || ''} 
                        disabled
                        className="bg-gray-700 text-white rounded-md p-2 w-full"
                      />
                      <p className="mt-1 text-sm text-gray-400">To change your email, please visit your Clerk profile.</p>
                    </div>
                    
                    <div className="pt-4">
                      <a 
                        href="https://accounts.clerk.dev/account" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Manage Account at Clerk
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Password Change */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                  
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-md flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-900/30 text-green-400 rounded-md flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-gray-700 text-white rounded-md p-2 w-full"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          updatePasswordRequirements(e.target.value);
                        }}
                        className="bg-gray-700 text-white rounded-md p-2 w-full"
                        required
                      />
                      
                      {newPassword.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                          <p className={`text-sm ${requirements.length ? 'text-green-400' : 'text-gray-400'}`}>
                            {requirements.length ? '✓' : '○'} At least 8 characters
                          </p>
                          <p className={`text-sm ${requirements.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                            {requirements.uppercase ? '✓' : '○'} Uppercase letter
                          </p>
                          <p className={`text-sm ${requirements.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                            {requirements.lowercase ? '✓' : '○'} Lowercase letter
                          </p>
                          <p className={`text-sm ${requirements.number ? 'text-green-400' : 'text-gray-400'}`}>
                            {requirements.number ? '✓' : '○'} Number
                          </p>
                          <p className={`text-sm ${requirements.symbol ? 'text-green-400' : 'text-gray-400'}`}>
                            {requirements.symbol ? '✓' : '○'} Special character
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-700 text-white rounded-md p-2 w-full"
                        required
                      />
                      
                      {confirmPassword.length > 0 && (
                        <p className={`mt-1 text-sm ${confirmPassword === newPassword ? 'text-green-400' : 'text-red-400'}`}>
                          {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>Updating...</>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Billing */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Billing & Subscription</h2>
                  
                  <div className="mb-8">
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Current Plan</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-2xl font-bold">Freemium</span>
                        <span className="text-gray-400 ml-2">- 20,000 tokens</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Coins className="h-5 w-5 text-yellow-400" />
                      {isLoadingTokens ? (
                        <span className="font-medium">Loading token balance...</span>
                      ) : (
                        <span className="font-medium">Token Balance: {tokenBalance !== null ? tokenBalance.toLocaleString() : 'Unknown'}</span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Available Plans</h3>
                      <div className="space-y-4">
                        <div className="border border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">Standard Plan</h4>
                              <p className="text-sm text-gray-400">50,000 tokens per month</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold">$9.99</span>
                              <span className="text-sm text-gray-400">/month</span>
                            </div>
                          </div>
                          <button 
                            disabled
                            className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 cursor-not-allowed w-full"
                          >
                            Coming Soon
                          </button>
                        </div>
                        
                        <div className="border border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">Enterprise Plan</h4>
                              <p className="text-sm text-gray-400">Unlimited tokens & priority support</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold">Custom</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => router.push('/#contact')}
                            className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full"
                          >
                            Contact Sales
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Payment Methods</h3>
                    <div className="bg-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
                      <div className="text-gray-400">No payment methods added yet</div>
                      <button 
                        disabled
                        className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Billing History</h3>
                    <div className="bg-gray-700 rounded-lg p-4 text-center text-gray-400">
                      No billing history available
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 