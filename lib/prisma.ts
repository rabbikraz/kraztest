import { PrismaClient } from '@prisma/client'

const FALLBACK_DATABASE_URL =
  'postgresql://postgres:93mMKqR8xfQ3jPM!@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is always available even if env vars are missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DATABASE_URL
}

// Fix connection string at runtime (same logic as setup-env.js)
function fixConnectionString() {
  if (!process.env.DATABASE_URL) return
  
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl.startsWith('postgres')) return
  
  // Extract project ID from SUPABASE_DATABASE_URL
  let projectId = null
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match) projectId = match[1]
  }
  
  try {
    const url = new URL(dbUrl.replace(/^postgresql?:\/\//, 'https://'))
    const host = url.hostname
    const isSupabase = host.includes('supabase.co') || host.includes('supabase.com')
    const isPooler = url.port === '6543' || host.includes('pooler')
    
    // Fix username for pooler
    if (isPooler && projectId && !url.username.includes('.')) {
      const password = url.password
      const port = url.port || '6543'
      const path = url.pathname
      
      let newUrl = `postgresql://postgres.${projectId}:${password}@${host}:${port}${path}`
      
      // Add required params
      const params = new URLSearchParams()
      if (url.search) {
        url.search.slice(1).split('&').forEach(param => {
          const [key, value] = param.split('=')
          if (key) params.set(key, value || '')
        })
      }
      if (!params.has('pgbouncer')) params.set('pgbouncer', 'true')
      if (!params.has('sslmode') && isSupabase) {
        params.set('sslmode', 'require')
      }
      
      if (params.toString()) newUrl += '?' + params.toString()
      process.env.DATABASE_URL = newUrl
    } else if (isSupabase && !url.search.includes('sslmode')) {
      // For direct Supabase connections (port 5432), ensure sslmode=require is present
      const params = new URLSearchParams()
      if (url.search) {
        url.search.slice(1).split('&').forEach(param => {
          const [key, value] = param.split('=')
          if (key) params.set(key, value || '')
        })
      }
      if (!params.has('sslmode')) {
        params.set('sslmode', 'require')
      }
      
      const newUrl = dbUrl.split('?')[0] + (params.toString() ? '?' + params.toString() : '')
      process.env.DATABASE_URL = newUrl
    }
  } catch (e) {
    // Ignore parsing errors
  }
}

// Fix connection string before creating Prisma client
fixConnectionString()

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

