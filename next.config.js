/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for improved error handling
  reactStrictMode: true,
  
  // Configure image domains for Next.js Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  
  // Add any experimental features here if needed
  experimental: {
    // Next.js 15 specific experimental features
  },
};

module.exports = nextConfig; 