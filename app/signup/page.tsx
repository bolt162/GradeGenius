'use client';

import Navigation from '../components/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password requirements state
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });

  // Check password requirements
  useEffect(() => {
    setRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
    
    // Check if passwords match when both are entered
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  // Check if all requirements are met
  const allRequirementsMet = 
    requirements.length && 
    requirements.uppercase && 
    requirements.lowercase && 
    requirements.number && 
    requirements.symbol && 
    passwordMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      return;
    }

    // Validate password
    if (!allRequirementsMet) {
      setError('Please ensure all password requirements are met and passwords match.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Start the sign-up process
      const result = await signUp.create({
        username,
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      router.push('/verify'); // Redirect to verification page

    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-bold text-neutral-900">Create an Account</h1>
              <p className="text-neutral-600 mt-2">Join GradeGenius today</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Add Clerk CAPTCHA element */}
              <div id="clerk-captcha"></div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black placeholder-neutral-600"
                  placeholder="Choose a username"
                  required
                />
              </div>

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
                  className="mt-1 block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black placeholder-neutral-600"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className={`text-sm ${requirements.length ? 'text-green-600' : 'text-red-500'}`}>
                      {requirements.length ? '✓' : '✗'} At least 8 characters
                    </p>
                    <p className={`text-sm ${requirements.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                      {requirements.uppercase ? '✓' : '✗'} At least one uppercase letter
                    </p>
                    <p className={`text-sm ${requirements.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                      {requirements.lowercase ? '✓' : '✗'} At least one lowercase letter
                    </p>
                    <p className={`text-sm ${requirements.number ? 'text-green-600' : 'text-red-500'}`}>
                      {requirements.number ? '✓' : '✗'} At least one number
                    </p>
                    <p className={`text-sm ${requirements.symbol ? 'text-green-600' : 'text-red-500'}`}>
                      {requirements.symbol ? '✓' : '✗'} At least one special character
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="mt-1 block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black placeholder-neutral-600"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword.length > 0 && (
                  <p className={`mt-1 text-sm ${passwordMatch ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-neutral-300 rounded"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-neutral-700">
                      I agree to the <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</Link>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="marketing"
                      name="marketing"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="marketing" className="text-neutral-700">
                      I want to receive updates about products, features and announcements
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GradeGenius</h3>
              <p className="text-indigo-200">Making grading smarter and faster with AI technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="/#features" className="text-indigo-200 hover:text-white">Features</a></li>
                <li><a href="/#pricing" className="text-indigo-200 hover:text-white">Pricing</a></li>
                <li><a href="/demo" className="text-indigo-200 hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/#about" className="text-indigo-200 hover:text-white">About</a></li>
                <li><a href="/#contact" className="text-indigo-200 hover:text-white">Contact</a></li>
                <li><a href="/#careers" className="text-indigo-200 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#privacy" className="text-indigo-200 hover:text-white">Privacy Policy</a></li>
                <li><a href="#terms" className="text-indigo-200 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-indigo-200">
            <p>© 2024 GradeGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 