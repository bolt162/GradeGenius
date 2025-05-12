'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Highlights.module.css';

const FeatureHighlights = () => {
  return (
    <section className={styles.highlightsContainer}>
      <div className={styles.twoColumnLayout}>
        <div className={styles.leftColumn}>
          <p className={styles.subtitle}>Why Choose Us</p>
          <h2 className={styles.title}>Transforming Education with AI</h2>
          <p className={styles.description}>
            We help educators focus on what matters most—teaching. Our platform streamlines the grading process, enhances feedback quality, and gives you back valuable time.
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/signup" className={styles.primaryButton}>
              Start Free Trial
            </Link>
            <Link href="/demo" className={styles.secondaryButton}>
              Try Demo
            </Link>
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <div className={styles.featureBox}>
            <div className={styles.featureContent}>
              <div className={styles.featureIcon}>⏱️</div>
              <h3 className={styles.featureTitle}>Save 5-10 Hours Weekly</h3>
              <p className={styles.featureText}>
                Reduce grading time by up to 70%, giving you back your evenings and weekends.
              </p>
            </div>
          </div>
          <div className={styles.featureBox}>
            <div className={styles.featureContent}>
              <div className={styles.featureIcon}>📝</div>
              <h3 className={styles.featureTitle}>Detailed Feedback</h3>
              <p className={styles.featureText}>
                Provide constructive feedback to help students improve.
              </p>
            </div>
          </div>
          <div className={styles.featureBox}>
            <div className={styles.featureContent}>
              <div className={styles.featureIcon}>🚀</div>
              <h3 className={styles.featureTitle}>Simple Learning Curve</h3>
              <p className={styles.featureText}>
                Intuitive interface requires minimal training—start grading smarter in minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;