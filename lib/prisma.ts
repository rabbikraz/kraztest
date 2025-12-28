import { PrismaClient } from '@prisma/client'

// Use pooler connection by default for serverless environments
// Project ID: tjywoiawsxrrepthgkqd (extracted from db.tjywoiawsxrrepthgkqd.supabase.co)
const FALLBACK_DATABASE_URL =
  'postgresql://postgres.tjywoiawsxrrepthgkqd:93mMKqR8xfQ3jPM!@tjywoiawsxrrepthgkqd.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true'

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
    // Check if it's a Supabase connection
    const isSupabase = dbUrl.includes('supabase.co') || dbUrl.includes('supabase.com')
    
    if (!isSupabase) return
    
    // Check if sslmode is already present
    if (dbUrl.includes('sslmode=')) {
      // sslmode already present, but ensure it's set to require
      const sslmodeMatch = dbUrl.match(/[?&]sslmode=([^&]*)/)
      if (sslmodeMatch && sslmodeMatch[1] !== 'require') {
        // Replace existing sslmode value with require
        process.env.DATABASE_URL = dbUrl.replace(/[?&]sslmode=[^&]*/, (match) => {
          return match.startsWith('?') ? '?sslmode=require' : '&sslmode=require'
        })
      }
      return
    }
    
    // Parse the connection string for pooler detection
    const url = new URL(dbUrl.replace(/^postgresql?:\/\//, 'https://'))
    const host = url.hostname
    const isPooler = url.port === '6543' || host.includes('pooler')
    
    // Fix username for pooler
    if (isPooler && projectId && !url.username.includes('.')) {
      // Extract existing query parameters
      const params = new URLSearchParams()
      if (url.search) {
        url.search.slice(1).split('&').forEach(param => {
          const [key, value] = param.split('=')
          if (key) params.set(key, decodeURIComponent(value || ''))
        })
      }
      
      // Add required params for pooler
      if (!params.has('pgbouncer')) params.set('pgbouncer', 'true')
      if (!params.has('sslmode')) params.set('sslmode', 'require')
      
      const password = url.password
      const port = url.port || '6543'
      const path = url.pathname
      
      let newUrl = `postgresql://postgres.${projectId}:${password}@${host}:${port}${path}`
      if (params.toString()) newUrl += '?' + params.toString()
      process.env.DATABASE_URL = newUrl
    } else {
      // For direct Supabase connections (port 5432), convert to pooler for serverless
      // Extract project ID from hostname (e.g., db.tjywoiawsxrrepthgkqd.supabase.co -> tjywoiawsxrrepthgkqd)
      const hostnameMatch = dbUrl.match(/@([^@]+)\.supabase\.(co|com)/)
      let extractedProjectId = null
      
      if (hostnameMatch) {
        const hostname = hostnameMatch[1]
        // Remove 'db.' prefix if present
        extractedProjectId = hostname.replace(/^db\./, '')
      }
      
      if (extractedProjectId && !projectId) {
        projectId = extractedProjectId
      }
      
      // For serverless environments (like Netlify), always use connection pooler
      // Pooler is more reliable and handles connection limits better
      if (projectId && (url.port === '5432' || !url.port || url.port === '')) {
        // Convert to pooler connection
        // Extract password from original URL to preserve special characters
        const passwordMatch = dbUrl.match(/:\/\/[^:]+:([^@]+)@/)
        const password = passwordMatch ? passwordMatch[1] : url.password
        
        // Supabase pooler format: {project-id}.pooler.supabase.com
        const poolerHost = `${projectId}.pooler.supabase.com`
        const poolerPort = '6543'
        const path = url.pathname || '/postgres'
        
        const params = new URLSearchParams()
        params.set('sslmode', 'require')
        params.set('pgbouncer', 'true')
        
        const poolerUrl = `postgresql://postgres.${projectId}:${password}@${poolerHost}:${poolerPort}${path}?${params.toString()}`
        process.env.DATABASE_URL = poolerUrl
        console.log('🔄 Converted direct connection to pooler:', poolerHost)
      } else if (!projectId) {
        // If we can't extract project ID, just ensure sslmode=require
        const separator = dbUrl.includes('?') ? '&' : '?'
        process.env.DATABASE_URL = `${dbUrl}${separator}sslmode=require`
      } else {
        // Already using pooler or other connection, just ensure sslmode=require
        const separator = dbUrl.includes('?') ? '&' : '?'
        process.env.DATABASE_URL = `${dbUrl}${separator}sslmode=require`
      }
    }
  } catch (e) {
    // If parsing fails, try to add sslmode=require directly
    if (dbUrl.includes('supabase.co') || dbUrl.includes('supabase.com')) {
      if (!dbUrl.includes('sslmode=')) {
        const separator = dbUrl.includes('?') ? '&' : '?'
        process.env.DATABASE_URL = `${dbUrl}${separator}sslmode=require`
      }
    }
  }
}

// Fix connection string before creating Prisma client
fixConnectionString()

// Get the final connection string (after fixing)
const finalDatabaseUrl = process.env.DATABASE_URL || FALLBACK_DATABASE_URL

// Log connection string (mask password for security)
const maskedUrl = finalDatabaseUrl.replace(/:([^:@]+)@/, ':****@')
console.log('🔌 Database connection string:', maskedUrl)
console.log('🔌 Using pooler:', finalDatabaseUrl.includes('pooler'))

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: finalDatabaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

