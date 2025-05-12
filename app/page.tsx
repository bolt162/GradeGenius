'use client';

import React from 'react';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Navigation from './components/Navigation/Navigation';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import Features from './components/Features';
import PricingSection from './components/PricingSection';
import Highlights from './components/Highlights';
import TestimonialsSection from './components/TestimonialsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

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

export default function Home() {
  const { isSignedIn } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Website Inquiry',
    message: ''
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
          subject: 'Website Inquiry',
          message: ''
        });
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'There was a problem sending your message. Please try again.'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'There was a problem connecting to the server. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToContact = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const headerOffset = 80;
      const elementPosition = contactSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <Features/>
      <Highlights/>
      <PricingSection scrollToContact={scrollToContact} />
      <ContactSection />
      <TestimonialsSection />
      
      <Footer />
    </div>
  );
}