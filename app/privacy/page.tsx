'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Privacy Policy Content */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">Privacy Policy</h1>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="space-y-6 text-neutral-800">
              <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">1. Introduction</h2>
              <p>Welcome to GradeGenius. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">2. Data We Collect</h2>
              <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
                <li><strong>Content Data</strong> includes information and content that you upload for grading purposes.</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">3. How We Use Your Data</h2>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>To register you as a new customer.</li>
                <li>To process and deliver your requested services.</li>
                <li>To manage our relationship with you.</li>
                <li>To improve our website, products/services, marketing or customer relationships.</li>
                <li>To make suggestions and recommendations to you about services that may be of interest to you.</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">4. Data Security</h2>
              <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">5. Data Retention</h2>
              <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">6. Your Legal Rights</h2>
              <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>Request erasure of your personal data.</li>
                <li>Object to processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
                <li>Request transfer of your personal data.</li>
                <li>Right to withdraw consent.</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">7. Changes to the Privacy Policy</h2>
              <p>We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date at the top of this privacy policy.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">8. Contact Us</h2>
              <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
              <p className="mt-2">Email: support@gradegenius.com</p>
              <p>Or visit our contact page: <Link href="/#contact" className="text-indigo-600 hover:text-indigo-800">Contact Us</Link></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GradeGenius</h3>
              <p className="text-indigo-200">Making grading smarter and faster with AI technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-indigo-200 hover:text-white">Features</Link></li>
                <li><Link href="/#pricing" className="text-indigo-200 hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="text-indigo-200 hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/#about" className="text-indigo-200 hover:text-white">About</Link></li>
                <li><Link href="/#contact" className="text-indigo-200 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-indigo-200 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-indigo-200 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-indigo-200">
            <p>© 2024 GradeGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 