import React from 'react';
import styles from './AboutSection.module.css';
import Link from 'next/link';
import Image from 'next/image';

const AboutSection = () => {
  return (
    <section id="about" className={styles.aboutSection}>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <span className={styles.badge}>ABOUT</span>
            <h2 className={styles.title}>
              Empowering Educators<br />
              with AI-Powered Grading
            </h2>
            <p className={styles.description}>
              GradeGenius combines advanced AI technology with intuitive interfaces to revolutionize the way educators assess student work. Save time, improve consistency, and provide better feedback.
            </p>
          </div>
          <div className={styles.buttonContainer}>
            <Link href="/demo" className={styles.button}>
              Get Started
            </Link>
          </div>
        </div>

        <div className={styles.cardsContainer}>
          {/* First row */}
          <div className={`${styles.card} ${styles.darkCard} ${styles.widerCard}`}>
            <h3 className={styles.cardTitle}>Work with focus</h3>
            <p className={styles.cardDescription}>
              Create, upload, and categorize rubrics based on classes and specializations. Organize your grading workflow with our intuitive rubric management system.
            </p>
            <div className={styles.cardImageContainer}>
              <Image 
                src="/images/Rubrics.png" 
                alt="Rubrics management interface" 
                width={400} 
                height={230} 
                className={styles.cardImage}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Every detail matters</h3>
            <p className={styles.largerDescription}>
              Our powerful AI grading assistant helps teachers save countless hours while providing consistent, high-quality feedback to students. Designed by educators for educators, GradeGenius understands the nuances of student work across subjects and grade levels.
            </p>
            <div className={styles.cardImageContainer}>
              {/* Placeholder for image */}
              <div className={styles.cardImagePlaceholder}></div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.lightCard}`}>
            <h3 className={styles.cardTitle}>Zero to done</h3>
            <p className={styles.cardDescription}>
              Get started quickly with our pre-built templates for common assignments, rubrics and feedback patterns or upload your own. Categorize your rubrics based on classes.
            </p>
            <div className={styles.cardGridImages}>
              {/* Grid of small image placeholders */}
              <div className={styles.smallImagePlaceholder}>UPLOAD</div>
              <div className={styles.smallImagePlaceholder}>CATEGORIZE</div>
              <div className={styles.smallImagePlaceholder}>GRADE</div>
              <div className={styles.smallImagePlaceholder}>FEEDBACK</div>
            </div>
          </div>

          {/* Second row */}
          <div className={`${styles.card} ${styles.pinkCard}`}>
            <h3 className={styles.cardTitle}>Always connected</h3>
            <p className={styles.cardDescription}>
              We&apos;re always ready to help and provide support. Our easy mailing system for support is based on priority with a 24-hour turnaround time.
            </p>
            <div className={styles.cardImageContainer}>
              <Image 
                src="/images/support-contact.png" 
                alt="Support interface" 
                width={400} 
                height={230} 
                className={styles.cardImage}
              />
            </div>
          </div>

          <div className={`${styles.card} ${styles.darkCard}`}>
            <h3 className={styles.cardTitle}>Detailed Feedback</h3>
            <p className={styles.cardDescription}>
              Receive detailed, unbiased grading feedback along with comprehensive analysis of scores. Help students understand their strengths and areas for improvement with clarity and consistency.
            </p>
            <div className={styles.cardImageContainer}>
              <Image 
                src="/images/Feedback.png" 
                alt="Detailed feedback interface" 
                width={400} 
                height={230} 
                className={styles.cardImage}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection; 