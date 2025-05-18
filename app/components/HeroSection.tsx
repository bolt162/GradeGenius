import React from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.columns}>
          <div className={styles.leftCol}>
            <h1 className={styles.title}>
              Grade <span className={styles.shineGradient}>Smarter</span>, Not Harder with AI
            </h1>
            <p className={styles.subtitle}>
              Transform your teaching workflow with our advanced AI grading platform. Automatically grade essays, assignments, and code with professional accuracy. Save hours of grading time while providing detailed, consistent feedback to your students.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/demo" className={styles.demoButton}>
                Get Started
              </Link>
              {/*
              <Link href="/dashboard" className={styles.dashboardButton}>
                Dashboard
              </Link>
              */}
            </div>
          </div>
          <div className={styles.rightCol}>
            <img 
              src="/images/hero-dashboard.png" 
              alt="AI Grading Assistant Dashboard - Automated Essay Grading Platform" 
              title="GradeGenius AI Grading Platform Interface"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 