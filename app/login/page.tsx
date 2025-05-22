'use client';

import Navigation from '../components/Navigation/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSignIn, useClerk, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '../components/Footer';

// Forgot Password Modal Component
function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verification' | 'complete'>('email');

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

  // Reset the modal state when closed
  const handleClose = () => {
    setEmail('');
    setCode('');
    setNewPassword('');
    setErrorMessage('');
    setStep('email');
    onClose();
  };

  // Function to send password reset code
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Use Clerk's reset password flow
      await signIn?.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      
      setStep('verification');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err?.errors?.[0]?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify code and set new password
  const handleVerifyCodeAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    // Check all requirements are met
    const allRequirementsMet = 
      requirements.length && 
      requirements.uppercase && 
      requirements.lowercase && 
      requirements.number && 
      requirements.symbol;
      
    if (!allRequirementsMet) {
      setErrorMessage('Password does not meet all requirements');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Verify the code and set the new password
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      
      if (result?.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        setStep('complete');
        
        // Auto redirect after successful password reset
        setTimeout(() => {
          handleClose();
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err?.errors?.[0]?.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'email' && (
          <>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSendResetCode}>
              <div className="mb-4">
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-70"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'verification' && (
          <>
            <p className="text-gray-600 mb-4">
              We've sent a verification code to <span className="font-medium">{email}</span>. Please enter the code and set your new password.
            </p>
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleVerifyCodeAndReset}>
              <div className="mb-4">
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verification-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Enter the code from your email"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    updatePasswordRequirements(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Create a new password"
                  required
                />
                
                {newPassword.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                    <p className={`text-sm ${requirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                      {requirements.length ? '✓' : '○'} At least 8 characters
                    </p>
                    <p className={`text-sm ${requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {requirements.uppercase ? '✓' : '○'} Uppercase letter
                    </p>
                    <p className={`text-sm ${requirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {requirements.lowercase ? '✓' : '○'} Lowercase letter
                    </p>
                    <p className={`text-sm ${requirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                      {requirements.number ? '✓' : '○'} Number
                    </p>
                    <p className={`text-sm ${requirements.symbol ? 'text-green-600' : 'text-gray-500'}`}>
                      {requirements.symbol ? '✓' : '○'} Special character
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-70"
                >
                  {isLoading ? 'Verifying...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'complete' && (
          <div className="text-center py-4">
            <div className="mb-4 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">Your password has been reset successfully!</p>
            <p className="text-gray-500 mb-4">You'll be redirected to the dashboard momentarily...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component that uses searchParams, wrapped in Suspense
function LoginForm() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Check if user is already signed in and redirect to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && !isRedirecting && !isSigningOut) {
      console.log("User is already signed in, redirecting to dashboard");
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router, isRedirecting, isSigningOut]);

  // Check if we need to force sign out the user
  useEffect(() => {
    const forceSignOut = searchParams?.get('forceSignOut');
    
    if (forceSignOut === 'true' && isLoaded && !isSigningOut) {
      const performSignOut = async () => {
        try {
          setIsSigningOut(true);
          await signOut();
          // Clear query params but stay on login page
          const url = new URL(window.location.href);
          url.searchParams.delete('forceSignOut');
          window.history.replaceState({}, '', url);
        } catch {
          // Quietly handle signout errors
        } finally {
          setIsSigningOut(false);
        }
      };
      
      performSignOut();
    }
  }, [isLoaded, searchParams, signOut, isSigningOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || isSigningOut || isRedirecting) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Start the sign-in process
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        // User has been authenticated
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard'); // Redirect to dashboard page after successful login
      }
    } catch (err: unknown) {
      const errorMsg = err && typeof err === 'object' && 'errors' in err && 
        Array.isArray((err as any).errors) && (err as any).errors[0]?.message ? 
        (err as any).errors[0].message : 
        'Something went wrong. Please try again.';
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/main_logo.png"
              alt="GradeGenius Logo"
              width={48}
              height={48}
              className="w-auto h-12"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Signing In</h1>
          <p className="text-neutral-600 mt-2">Redirecting to dashboard...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image 
            src="/images/main_logo.png"
            alt="GradeGenius Logo"
            width={48}
            height={48}
            className="w-auto h-12"
          />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Welcome</h1>
        <p className="text-neutral-600 mt-2">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {isSigningOut && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded">
          Signing out previous session...
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black placeholder-neutral-600"
            placeholder="Enter your email"
            required
            disabled={isSigningOut}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black placeholder-neutral-600"
            placeholder="Enter your password"
            required
            disabled={isSigningOut}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-neutral-300 rounded"
              disabled={isSigningOut}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <button 
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isLoaded || isSigningOut || isRedirecting}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70"
        >
          {isLoading ? 'Signing in...' : isSigningOut ? 'Please wait...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
}

// Loading fallback for Suspense
function LoginFormFallback() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Welcome</h1>
        <p className="text-neutral-600 mt-2">Sign in to your account</p>
      </div>
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}

// Mobile Detection Component
function MobileDetectionWrapper({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      const userAgent = 
        typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isClient) return null;

  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/main_logo.png"
              alt="GradeGenius Logo"
              width={48}
              height={48}
              className="w-auto h-12"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Desktop Only</h1>
          <p className="text-neutral-600 mt-2">GradeGenius requires a desktop browser for optimal performance. Please access from a laptop or desktop computer.</p>
          <div className="mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

// Main page component
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<LoginFormFallback />}>
            <MobileDetectionWrapper>
              <LoginForm />
            </MobileDetectionWrapper>
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
} 