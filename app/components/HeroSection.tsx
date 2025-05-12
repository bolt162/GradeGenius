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
              Revolutionize your grading process with our AI-powered platform. Grade essays, articles, assignments, and code instantly with professional accuracy.
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
            <img src="/images/hero-dashboard.png" alt="Dashboard Preview"  />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 