'use client';

import Navigation from '../components/Navigation/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSignIn, useClerk, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '../components/Footer';

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
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </a>
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

// Main page component
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
} 