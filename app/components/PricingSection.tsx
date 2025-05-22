'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import styles from './PricingSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faCheck, 
  faClock, 
  faSeedling, 
  faRocket, 
  faBuilding 
} from '@fortawesome/free-solid-svg-icons';

interface PricingSectionProps {
  scrollToContact: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ scrollToContact }) => {
  const { isSignedIn } = useUser();
  
  return (
    <section id="pricing" className={styles.pricingSection}>
      <div className={styles.container}>
        <p className={styles.preTitle}>Our Plans</p>
        <h2 className={styles.title}>Simple, Transparent Pricing</h2>
        <div className={styles.pricingGrid}>
          {/* Free Plan Card */}
          <div className={`${styles.pricingCard} ${styles.freemiumCard}`}>
            <div className={`${styles.iconContainer} ${styles.freeIcon}`}>
              <FontAwesomeIcon icon={faSeedling} />
            </div>
            <h3 className={styles.cardTitle}>Freemium</h3>
            <div className={styles.priceContainer}>
              <span className={styles.price}>$0</span>
              <span className={styles.pricePeriod}>/mo</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>12 assignments</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Long contextual grading</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Custom rubrics</span>
              </li>
            </ul>
            <Link 
              href={isSignedIn ? "/dashboard" : "/login"}
              className={styles.darkButton}
            >
              <span>Get Started</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>

          {/* Standard Plan Card */}
          <div className={`${styles.pricingCard} ${styles.standardCard}`}>
            <div className={`${styles.iconContainer} ${styles.standardIcon}`}>
              <FontAwesomeIcon icon={faRocket} />
            </div>
            <h3 className={styles.cardTitle}>Standard</h3>
            <div className={styles.priceContainer}>
              <span className={styles.price}>$19.99</span>
              <span className={styles.pricePeriod}>/mo</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>200 assignments</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Analytics</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Email support</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Batch grading</span>
              </li>
            </ul>
            <button 
              className={styles.lightButton}
              disabled
            >
              <span>Coming Soon</span>
              <FontAwesomeIcon icon={faClock} />
            </button>
          </div>

          {/* Enterprise Plan Card */}
          <div className={`${styles.pricingCard} ${styles.enterpriseCard}`}>
            <div className={`${styles.iconContainer} ${styles.enterpriseIcon}`}>
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <h3 className={styles.cardTitle}>Enterprise</h3>
            <div className={styles.priceContainer}>
              <span className={styles.price}>Custom</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Unlimited assignments</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>Custom integration</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>24/7 support</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureCheckmark}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureText}>API access</span>
              </li>
            </ul>
            <button 
              onClick={scrollToContact}
              className={styles.darkButton}
            >
              <span>Contact Sales</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;