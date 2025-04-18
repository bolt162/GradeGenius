import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import Navigation from './components/Navigation';

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
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-neutral-900 mb-6">
              Grade Smarter, Not Harder with AI
            </h1>
            <p className="text-xl text-neutral-800 mb-8">
              Revolutionize your grading process with our AI-powered platform. Grade essays, articles, assignments, and code instantly with professional accuracy.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/demo" className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700">
                Try Demo
              </Link>
              <Link href="/dashboard" className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-md hover:bg-indigo-50">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 flex flex-wrap justify-center gap-2">
            <span className="bg-gradient-to-r from-blue-400 to-blue-800 bg-clip-text text-transparent">Why</span>
            <span className="bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-400 bg-clip-text text-transparent">choose</span>
            <span className="bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">Grade</span>
            <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Genius</span>
            <span className="text-red-600">?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-blue-500/20 rounded-lg hover:shadow-lg transition bg-white">
              <div className="text-blue-600 text-2xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2 text-blue-800">Lightning Fast</h3>
              <p className="text-blue-900">Grade hundreds of assignments in minutes, not hours.</p>
            </div>
            <div className="p-6 border border-purple-500/20 rounded-lg hover:shadow-lg transition bg-white">
              <div className="text-purple-600 text-2xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-800">Accurate & Consistent</h3>
              <p className="text-purple-900">AI-powered grading that maintains high accuracy and consistency.</p>
            </div>
            <div className="p-6 border border-pink-500/20 rounded-lg hover:shadow-lg transition bg-white">
              <div className="text-pink-600 text-2xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-2 text-pink-800">Detailed Feedback</h3>
              <p className="text-pink-900">Provide constructive feedback to help students improve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-indigo-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-indigo-600/30 flex flex-col">
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#111827' }}>Freemium</h3>
              <div className="text-4xl font-bold mb-4">
                <span className="text-indigo-600">$0</span>
                <span className="text-lg text-neutral-700">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>5 assignments/month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Email support</span>
                </li>
              </ul>
              <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                Get Started
              </button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-indigo-600/30 flex flex-col">
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#111827' }}>Professional</h3>
              <div className="text-4xl font-bold mb-4">
                <span className="text-indigo-600">$19</span>
                <span className="text-lg text-neutral-700">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>100 assignments/month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Priority support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Custom rubrics</span>
                </li>
              </ul>
              <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                Get Started
              </button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-indigo-600/30 flex flex-col">
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#111827' }}>Enterprise</h3>
              <div className="text-4xl font-bold mb-4 text-indigo-600">Custom</div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Unlimited assignments</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>Custom integration</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>24/7 support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span style={{ color: '#4B5563' }}>API access</span>
                </li>
              </ul>
              <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-indigo-50 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full mr-4 overflow-hidden">
                  <Image 
                    src="/images/sarah.png"
                    alt="Dr. Sarah Johnson"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-600">Dr. Sarah Johnson</h4>
                  <p className="text-neutral-900">Professor at Stanford University</p>
                </div>
              </div>
              <p className="text-neutral-900">"GradeGenius has transformed how I grade assignments. The AI feedback is remarkably accurate, and my students receive more detailed feedback than ever before."</p>
            </div>
            <div className="p-6 bg-indigo-50 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full mr-4 overflow-hidden">
                  <Image 
                    src="/images/michael.png"
                    alt="Prof. Michael Chen"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-600">Prof. Michael Chen</h4>
                  <p className="text-neutral-900">Department Head, MIT</p>
                </div>
              </div>
              <p className="text-neutral-900">"The consistency and speed of grading have improved significantly. Our department now saves countless hours while maintaining high grading standards."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-indigo-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Get in Touch</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-neutral-900 mb-2">Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-black/30 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-neutral-900 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border border-black/30 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-neutral-900 mb-2">Message</label>
              <textarea 
                className="w-full px-4 py-2 border border-black/30 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" 
                rows={4}
              ></textarea>
            </div>
            <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
              Send Message
            </button>
          </form>
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
                <li><Link href="/#careers" className="text-indigo-200 hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#privacy" className="text-indigo-200 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#terms" className="text-indigo-200 hover:text-white">Terms of Service</Link></li>
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