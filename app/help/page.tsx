'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Mail, Send, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';

export default function HelpPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Populate form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
          email: user ? user.primaryEmailAddress?.emailAddress || '' : '',
          subject: '',
          message: ''
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
    <Layout activePage="help">
      {/* Page Header */}
      <div className={`${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-indigo-600 to-blue-500' 
          : ''
        } rounded-lg overflow-hidden shadow-lg mb-6`}
        style={theme === 'dark' ? {} : {
          backgroundImage: `radial-gradient(
            circle at 60% 40%,
            #e0e7ff 0%,
            #f3e8ff 40%, 
            #fce7f3 70%,
            #b9def9 100%
          )`
        }}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Help & Support</h2>
              <p className={`font-oswald ${theme === 'dark' ? 'text-indigo-100' : 'text-gray-600'}`}>We&apos;re here to help you with GradeGenius</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ Section */}
        <div className="lg:col-span-1">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h3 className={`text-xl font-semibold mb-4 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pb-4`}>
                <h4 className={`font-medium mb-2 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>How do tokens work?</h4>
                <p className={`font-oswald ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tokens are used to grade assignments. Each grading consumes tokens based on the length and complexity of the work.</p>
              </div>
              
              <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pb-4`}>
                <h4 className={`font-medium mb-2 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>How accurate is the grading?</h4>
                <p className={`font-oswald ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>GradeGenius uses advanced AI to provide accurate feedback, but we recommend reviewing the results for best outcomes.</p>
              </div>
              
              <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pb-4`}>
                <h4 className={`font-medium mb-2 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>What file formats are supported?</h4>
                <p className={`font-oswald ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>We support PDF, DOCX, TXT, and direct text input for grading assignments.</p>
              </div>
              
              <div className="pb-4">
                <h4 className={`font-medium mb-2 font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>How do I get more tokens?</h4>
                <p className={`font-oswald ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>You can purchase additional tokens from your dashboard or the tokens page.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <div className="flex items-center mb-6">
              <Mail className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mr-3`} size={24} />
              <h3 className={`text-xl font-semibold font-oswald ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Contact Support</h3>
            </div>

            {submitResult && (
              <div className={`p-4 mb-6 rounded-md ${submitResult.success 
                ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800' 
                : theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'}`}>
                {submitResult.success && <CheckCircle className="inline-block mr-2" size={16} />}
                {submitResult.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={`block mb-1 text-sm font-medium font-oswald ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 ${theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-oswald`}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className={`block mb-1 text-sm font-medium font-oswald ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 ${theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-oswald`}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className={`block mb-1 text-sm font-medium font-oswald ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 ${theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-oswald`}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Grading Problem">Grading Problem</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className={`block mb-1 text-sm font-medium font-oswald ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-3 py-2 ${theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-oswald`}
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center w-full md:w-auto px-6 py-2 ${theme === 'dark' 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-black hover:bg-gray-800'} transition-colors rounded-md font-medium disabled:opacity-70 text-white font-oswald`}
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="mr-2" size={16} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
} 