'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
  e.preventDefault();
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    const headerOffset = 80; // Height of your fixed header
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  
  const isLoginPage = pathname === '/login' || pathname === '/signup';
  const isDemoPage = pathname === '/demo';
  
  // For pages other than the homepage (/)
  const isNotHomePage = pathname !== '/';

  return (
    <nav className="bg-white shadow-lg fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="sparkle-effect">
                <Image 
                  src="/images/main_logo.png"
                  alt="GradeGenius Logo"
                  width={32}
                  height={32}
                  className="w-auto h-8 transition-transform duration-300 ease-in-out transform group-hover:scale-110 group-hover:-translate-y-1 relative z-10"
                />
              </div>
              <span className="text-2xl font-bold text-indigo-600">GradeGenius</span>
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            {isNotHomePage ? (
              <>
                <Link href="/#features" className="text-neutral-900 hover:text-indigo-600 relative group">
                  <span>Features</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link href="/#pricing" className="text-neutral-900 hover:text-indigo-600 relative group">
                  <span>Pricing</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link href="/demo" className="text-neutral-900 hover:text-indigo-600 relative group">
                  <span>Demo</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link href="/#contact" className="text-neutral-900 hover:text-indigo-600 relative group">
                  <span>Contact</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </>
            ) : (
              <>
                <a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="text-neutral-900 hover:text-indigo-600 relative group cursor-pointer">
                  <span>Features</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#pricing" onClick={(e) => smoothScroll(e, 'pricing')} className="text-neutral-900 hover:text-indigo-600 relative group cursor-pointer">
                  <span>Pricing</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <Link href="/demo" className="text-neutral-900 hover:text-indigo-600 relative group">
                  <span>Demo</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <a href="#contact" onClick={(e) => smoothScroll(e, 'contact')} className="text-neutral-900 hover:text-indigo-600 relative group cursor-pointer">
                  <span>Contact</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </>
            )}
            
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-neutral-900 hover:text-indigo-600 relative group">
                  <span>Dashboard</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              !isLoginPage && (
                <div className="flex items-center space-x-4">
                  <SignInButton mode="modal">
                    <button className="text-indigo-600 hover:text-indigo-800">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 