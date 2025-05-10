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
  
  // ESLint configuration to ignore errors during build
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration to ignore errors during build
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // Add any experimental features here if needed
  experimental: {
    // Next.js 15 specific experimental features
  },
  
  // Ensure middleware runs on every request
  skipMiddlewareUrlNormalize: false,
  skipTrailingSlashRedirect: false,
};

module.exports = nextConfig; 