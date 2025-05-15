'use client';

import React, { useState } from 'react';
import styles from './ContactSection.module.css';

const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    subject: 'Contact Form Submission'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: 'Your message has been sent successfully!'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          message: '',
          subject: 'Contact Form Submission'
        });
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'There was a problem sending your message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitResult({
        success: false,
        message: 'There was a problem connecting to the server. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className={styles.contactSection}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <span className={styles.subtitle}>Contact Us</span>
            <h2 className={styles.title}>Get In Touch</h2>
            <p className={styles.description}>
              Have questions or want to learn more about our services? 
              Fill out the form and our team will get back to you as soon as possible.
            </p>
          </div>
          
          <div className={styles.formWrapper}>
            {/* Add a more accurate message about required fields */}
            <div className={styles.requiredFieldsNote}>
              <p>Fields marked with <span className={styles.requiredMark}>*</span> are required</p>
            </div>
            
            {submitResult && (
              <div className={`${styles.alert} ${submitResult.success ? styles.alertSuccess : styles.alertError}`}>
                {submitResult.message}
              </div>
            )}
            
            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Name <span className={styles.requiredMark}>*</span>
                </label>
                <input 
                  type="text" 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email <span className={styles.requiredMark}>*</span>
                </label>
                <input 
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange} 
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <input 
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange} 
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="company" className={styles.label}>
                  Company/School Name (Optional)
                </label>
                <input 
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange} 
                  className={styles.input}
                />
              </div>
              {/* Hidden subject field - required by the API endpoint */}
              <input type="hidden" name="subject" value={formData.subject} />
              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>
                  Message <span className={styles.requiredMark}>*</span>
                </label>
                <textarea 
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={4}
                  required
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;