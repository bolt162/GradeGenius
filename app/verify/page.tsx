'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navigation from '../components/Navigation';

export default function VerifyPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle verification form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signUp) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Attempt to verify the email
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        // Set the user as active and redirect to the dashboard
        await setActive({ session: result.createdSessionId });
        router.push('/');
      } else {
        // The verification may need more steps
        console.log(result);
        setError('Verification incomplete. Please check your email for a new code.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resending the verification code
  const handleResendCode = async () => {
    if (!isLoaded || !signUp) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Resend the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      
      // Show success message
      alert('A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || 'Failed to resend code. Please try again.');
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
              <h1 className="text-3xl font-bold text-neutral-900">Verify Your Email</h1>
              <p className="text-neutral-600 mt-2">
                We've sent a verification code to your email address.
                Please enter it below to complete your registration.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-neutral-700">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-black placeholder-neutral-600"
                  placeholder="Enter your verification code"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded || !verificationCode}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Didn't receive a code?{' '}
                <button 
                  onClick={handleResendCode} 
                  disabled={isLoading}
                  className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-70"
                >
                  Resend Code
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 