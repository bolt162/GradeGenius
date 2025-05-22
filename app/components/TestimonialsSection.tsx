'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './TestimonialsSection.module.css';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: "Kalyani Parikh",
      role: "High School English Teacher",
      text: "GradeGenius has transformed how I grade assignments. The AI feedback is remarkably accurate, and my students receive more detailed feedback than ever before.",
      avatar: "/images/sarah.png"
    },
    {
      name: "Prof. Michael Chen",
      role: "Assistant Professor",
      text: "The consistency and speed of grading have improved significantly. Our department now saves countless hours while maintaining high grading standards.",
      avatar: "/images/michael.png"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Industrial Engineering Professor",
      text: "As a new faculty member, GradeGenius helped me establish consistent grading practices from day one. My students appreciate the thorough and timely feedback.",
      avatar: "/images/emily.png" // Replace with actual path
    },
    {
      name: "Dr. Diwakar Sharma",
      role: "Former Director of WWF, India",
      text: "Implementing GradeGenius across our department has led to a 40% reduction in grading time while helping me focus on providing quality session with my students.",
      avatar: "/images/dr-sharma.jpeg" // Replace with actual path
    },
    {
      name: "Lisa Thompson",
      role: "Graduate Researcher",
      text: "In my research on educational technology, GradeGenius stands out for its positive impact on both instructor workload and learning outcomes. The data speaks for itself.",
      avatar: "/images/lisa.png" // Replace with actual path
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Determine slides to show based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSlidesToShow(1);
      } else {
        setSlidesToShow(3);
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000); // Auto-scroll after 3 seconds
    
    return () => clearInterval(interval);
  }, [currentSlide, slidesToShow]);

  // Calculate maximum slide index
  const maxSlide = Math.max(0, testimonials.length - slidesToShow);

  const prevSlide = () => {
    setCurrentSlide(current => Math.max(0, current - 1));
  };

  const nextSlide = () => {
    setCurrentSlide(current => Math.min(maxSlide, current + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.min(maxSlide, index));
  };

  // Calculate slide width percentage
  const slideWidth = slidesToShow > 0 ? 100 / slidesToShow : 100;

  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        {/* Title section */}
        <div>
          <p className={styles.subtitle}>TESTIMONIALS</p>
          <h2 className={styles.title}>What Our Users Say</h2>
        </div>
        
        <div className={styles.carouselContainer}>
          {/* Carousel Navigation - Previous */}
          <button 
            onClick={prevSlide} 
            disabled={currentSlide === 0}
            className={`${styles.carouselButton} ${styles.carouselButtonPrev} ${currentSlide === 0 ? styles.carouselButtonDisabled : ''}`}
            aria-label="Previous testimonial"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          {/* Testimonials Carousel */}
          <div className={styles.carouselWrapper} ref={carouselRef}>
            <div 
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${currentSlide * slideWidth}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className={styles.carouselSlide}
                  style={{ width: `${slideWidth}%` }}
                >
                  <div className={styles.testimonialCard}>
                    <div className={styles.testimonialHeader}>
                      <div className={styles.avatarContainer}>
                        <Image 
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className={styles.avatar}
                        />
                      </div>
                      <div>
                        <h4 className={styles.testimonialName}>{testimonial.name}</h4>
                        <p className={styles.testimonialRole}>{testimonial.role}</p>
                      </div>
                    </div>
                    <p className={styles.testimonialText}>{testimonial.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Carousel Navigation - Next */}
          <button 
            onClick={nextSlide} 
            disabled={currentSlide >= maxSlide}
            className={`${styles.carouselButton} ${styles.carouselButtonNext} ${currentSlide >= maxSlide ? styles.carouselButtonDisabled : ''}`}
            aria-label="Next testimonial"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        {/* Pagination dots */}
        <div className={styles.carouselNav}>
          {Array.from({ length: maxSlide + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`${styles.carouselDot} ${currentSlide === index ? styles.carouselDotActive : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;