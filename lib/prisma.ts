import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Generate DATABASE_URL from Supabase environment variables for Cloudflare Pages
function getDatabaseUrl(): string {
  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Generate from NEXT_PUBLIC_SUPABASE_URL for Cloudflare Pages
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl)
      const projectId = url.hostname.split('.')[0]
      const password = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '93mMKqR8xfQ3jPM!'
      
      // Use pooler connection for Cloudflare Pages (serverless)
      return `postgresql://postgres.${projectId}:${password}@${projectId}.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
    } catch (e) {
      console.error('Error generating DATABASE_URL from Supabase URL:', e)
    }
  }
  
  // Fallback for known project
  return 'postgresql://postgres.tjywoiawsxrrepthgkqd:93mMKqR8xfQ3jPM!@tjywoiawsxrrepthgkqd.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true'
}

const databaseUrl = getDatabaseUrl()

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
