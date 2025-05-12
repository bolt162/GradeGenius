'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation/Navigation';
import Footer from '../components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Terms of Service Content */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">Terms of Service</h1>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="space-y-6 text-neutral-800">
              <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">1. Introduction</h2>
              <p>Welcome to GradeGenius. These Terms of Service govern your use of our website and services. By using GradeGenius, you agree to these terms. Please read them carefully.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">2. Definitions</h2>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>&quot;Service&quot;</strong> refers to the GradeGenius website and AI grading platform.</li>
                <li><strong>&quot;User&quot;</strong> refers to the individual or entity that registers with GradeGenius to use the Service.</li>
                <li><strong>&quot;Content&quot;</strong> refers to any text, documents, assignments, or other material uploaded to the Service.</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">3. Account Registration</h2>
              <p>To use certain features of the Service, you must register for an account. You agree to provide accurate information during the registration process and to update such information to keep it accurate. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">4. User Content</h2>
              <p>You retain all rights to any Content you submit, post, or display on or through the Service. By submitting Content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, process, and analyze the Content for the purpose of providing and improving the Service.</p>
              <p>You are solely responsible for the Content you upload and confirm that you have all necessary rights to grant us the license described above.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">5. Service Usage</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Violate any applicable laws or regulations.</li>
                <li>Infringe the intellectual property rights of others.</li>
                <li>Upload or transmit viruses, malware, or other harmful code.</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service.</li>
                <li>Engage in unauthorized scraping or data collection.</li>
                <li>Impersonate any person or entity.</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">6. Subscription and Billing</h2>
              <p>Some features of the Service require a paid subscription. You agree to pay all fees associated with your selected subscription plan. Subscription fees are billed in advance and are non-refundable. We reserve the right to change subscription fees upon reasonable notice.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">7. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are owned by GradeGenius and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">8. Disclaimer of Warranties</h2>
              <p>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">9. Limitation of Liability</h2>
              <p>In no event shall GradeGenius be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">10. Indemnification</h2>
              <p>You agree to indemnify and hold harmless GradeGenius and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from your use of the Service or your violation of these Terms.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">11. Termination</h2>
              <p>We may terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">12. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on the Service and updating the &quot;Last Updated&quot; date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">13. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>
              
              <h2 className="text-2xl font-semibold text-neutral-900 mt-8">14. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <p className="mt-2">Email: legal@gradegenius.com</p>
              <p>Or visit our contact page: <Link href="/#contact" className="text-indigo-600 hover:text-indigo-800">Contact Us</Link></p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 