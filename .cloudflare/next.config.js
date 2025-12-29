// Cloudflare Pages specific Next.js configuration
// This file is for reference - the main next.config.js should be used

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // For Cloudflare Pages:
  // - Framework preset MUST be set to "Next.js" in Cloudflare dashboard
  // - Build output directory: .next
  // - Deploy command: EMPTY (Cloudflare handles it automatically)
  
  // Image optimization
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
    ],
  },
  
  // Server components external packages
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig

