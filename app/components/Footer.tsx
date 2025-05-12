import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <div className={styles.logo}>
              <Link href="/">
                <Image 
                  src="/images/grade-genius-white.png" 
                  alt="GradeGenius" 
                  width={220} 
                  height={58} 
                  className="h-auto"
                />
              </Link>
            </div>
            <p className={styles.description}>Making grading smarter and faster with AI technology.</p>
          </div>
          <div>
            <h4 className={styles.heading}>PRODUCT</h4>
            <ul className={styles.linkList}>
              <li><Link href="/#features" className={styles.link}>Features</Link></li>
              <li><Link href="/#pricing" className={styles.link}>Pricing</Link></li>
              <li><Link href="/demo" className={styles.link}>Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.heading}>COMPANY</h4>
            <ul className={styles.linkList}>
              <li><Link href="/#about" className={styles.link}>About</Link></li>
              <li><Link href="/#contact" className={styles.link}>Contact</Link></li>
              <li><Link href="/#careers" className={styles.link}>Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.heading}>LEGAL</h4>
            <ul className={styles.linkList}>
              <li><Link href="/privacy" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={styles.link}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles['footer-bottom']}>
          <p className={styles.copyright}>© {new Date().getFullYear()} GradeGenius. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}