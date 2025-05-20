'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';

// Smooth scrolling function from the original Navigation component
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
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Add state to track if component is mounted (client-side only)
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state to true on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isLoginPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify';
  
  // Check if we're on the homepage
  const isHomePage = pathname === '/';

  const handleSignOut = () => {
    signOut();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // To avoid hydration mismatch, use client-side rendering for auth-dependent UI
  if (!isMounted) {
    // Return a simplified version for server-side rendering
    return (
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.navContent}>
            {/* Mobile Menu Button - Moved before logo */}
            <button 
              className={styles.mobileMenuButton} 
              aria-label="Toggle mobile menu"
            >
              <span className={styles.mobileMenuIcon}></span>
              <span className={styles.mobileMenuIcon}></span>
              <span className={styles.mobileMenuIcon}></span>
            </button>
            
            {/* Logo */}
            <Link href="/" className={styles.logo}>
              <Image
                src="/images/grade-genius.png"
                alt="GradeGenius Logo"
                width={180}
                height={40}
                className={styles.logoImage}
                priority
              />
            </Link>

            {/* Main Navigation */}
            <div className={styles.mainNav}>
              <Link href="/" className={pathname === '/' ? styles.activeNavLink : styles.navLink}>
                Home
              </Link>
              <Link href="/#features" className={styles.navLink}>Features</Link>
              <Link href="/demo" className={styles.navLink}>Demo</Link>
              <Link href="/#pricing" className={styles.navLink}>Pricing</Link>
              <Link href="/#contact" className={styles.navLink}>Contact</Link>
            </div>

            {/* Placeholder for auth container */}
            <div className={styles.rightNav}></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          {/* Mobile Menu Button - Moved before logo */}
          <button 
            className={styles.mobileMenuButton} 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={styles.mobileMenuIcon}></span>
            <span className={styles.mobileMenuIcon}></span>
            <span className={styles.mobileMenuIcon}></span>
          </button>
          
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/grade-genius.png"
              alt="GradeGenius Logo"
              width={180}
              height={40}
              className={styles.logoImage}
              priority
            />
          </Link>

          {/* Main Navigation - Conditionally render based on homepage or other pages */}
          <div className={`${styles.mainNav} ${isMobileMenuOpen ? styles.mainNavMobileOpen : ''}`}>
            <Link href="/" className={pathname === '/' ? styles.activeNavLink : styles.navLink}>
              Home
            </Link>
            
            {/* If on homepage, use smooth scrolling; otherwise use direct links */}
            {isHomePage ? (
              <>
                <a 
                  href="#features" 
                  onClick={(e) => smoothScroll(e, 'features')} 
                  className={styles.navLink}
                >
                  Features
                </a>
                <Link href="/demo" className={pathname.includes('/demo') ? styles.activeNavLink : styles.navLink}>
                  Demo
                </Link>
                <a 
                  href="#pricing" 
                  onClick={(e) => smoothScroll(e, 'pricing')} 
                  className={styles.navLink}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  onClick={(e) => smoothScroll(e, 'contact')} 
                  className={styles.navLink}
                >
                  Contact
                </a>
              </>
            ) : (
              <>
                <Link 
                  href="/#features" 
                  className={styles.navLink}
                >
                  Features
                </Link>
                <Link href="/demo" className={pathname.includes('/demo') ? styles.activeNavLink : styles.navLink}>
                  Demo
                </Link>
                <Link 
                  href="/#pricing" 
                  className={styles.navLink}
                >
                  Pricing
                </Link>
                <Link 
                  href="/#contact" 
                  className={styles.navLink}
                >
                  Contact
                </Link>
              </>
            )}
          </div>

          {/* Right Side - Auth Buttons or User Menu */}
          <div className={styles.rightNav}>
            {isSignedIn ? (
              <div className={styles.userMenuContainer}>
                <button 
                  onClick={toggleDropdown}
                  className={styles.userButton}
                >
                  <div className={styles.avatar}>
                    {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                  </div>
                  <span className={styles.userName}>{user?.firstName || user?.username}</span>
                </button>
                
                {isDropdownOpen && (
                  <div className={styles.dropdown}>
                    <Link 
                      href="/dashboard" 
                      className={styles.dropdownItem}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className={styles.dropdownItem}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !isLoginPage && (
                <div className={styles.authButtons} data-mobile-auth="true">
                  <Link href="/login" className={styles.loginButton}>
                    Login
                  </Link>
                  <Link href="/signup" className={`${styles.signupButton} mobile-only-signup`}>
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 