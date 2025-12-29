/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Cloudflare Pages configuration
  // When Framework preset is set to "Next.js" in Cloudflare, this works automatically
  
  images: {
    unoptimized: false,
    remotePatterns: [
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
  
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
