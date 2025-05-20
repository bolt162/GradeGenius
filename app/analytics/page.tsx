'use client';

import { BarChart3 } from 'lucide-react';
import Layout from '../components/Layout';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  // Get current date in a user-friendly format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Layout activePage="analytics">
      {/* Welcome Banner */}
      <div className={styles.banner}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl ${styles.bannerTitle}`}>Analytics Dashboard</h2>
              <p className={styles.bannerDate}>{currentDate}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className={styles.contentSection}>
        <div className="flex flex-col items-center justify-center text-center py-8">
          <BarChart3 className={styles.icon} size={80} />
          <h2 className={styles.title}>Analytics Coming Soon</h2>
          <p className={styles.description}>
            We&apos;re working on powerful analytics tools to help you track student performance,
            identify trends, and gain insights into your grading process.
          </p>
          <div className={styles.featuresBox}>
            <h3 className={styles.featuresTitle}>What to Expect</h3>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <BarChart3 size={16} />
                </span>
                <span>Performance tracking across assignments</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <BarChart3 size={16} />
                </span>
                <span>Detailed grading statistics and insights</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <BarChart3 size={16} />
                </span>
                <span>Trend analysis to improve teaching methods</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <BarChart3 size={16} />
                </span>
                <span>Exportable reports for academic planning</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
} 