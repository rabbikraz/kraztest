import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Extract project ID from Supabase URL
function getSupabaseProjectId(): string | null {
  // Try NEXT_PUBLIC_SUPABASE_URL first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_DATABASE_URL
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|com)/)
    if (match) return match[1]
  }
  return null
}

// Generate DATABASE_URL from Supabase environment variables
function generateDatabaseUrl(): string {
  const projectId = getSupabaseProjectId()
  const password = process.env.SUPABASE_DB_PASSWORD || '93mMKqR8xfQ3jPM!'
  
  if (projectId) {
    // Use pooler connection for serverless (recommended for Netlify)
    return `postgresql://postgres.${projectId}:${password}@${projectId}.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
  }
  
  // Fallback: use known project ID from NEXT_PUBLIC_SUPABASE_URL
  // Project ID: tjywoiawsxrrepthgkqd
  return 'postgresql://postgres.tjywoiawsxrrepthgkqd:93mMKqR8xfQ3jPM!@tjywoiawsxrrepthgkqd.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true'
}

// Ensure DATABASE_URL is always available
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = generateDatabaseUrl()
}

// Fix connection string at runtime (same logic as setup-env.js)
function fixConnectionString() {
  if (!process.env.DATABASE_URL) return
  
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl.startsWith('postgres')) return
  
  // Extract project ID from Supabase URL (prefer NEXT_PUBLIC_SUPABASE_URL)
  let projectId = getSupabaseProjectId()
  
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
      // Serverless environments like Netlify need pooler connections
      if (url.port === '5432' || !url.port) {
        // Extract project ID from hostname (e.g., db.tjywoiawsxrrepthgkqd.supabase.co -> tjywoiawsxrrepthgkqd)
        const hostnameMatch = host.match(/^db\.([^.]+)\.supabase\.(co|com)$/)
        let extractedProjectId = hostnameMatch ? hostnameMatch[1] : null
        
        if (extractedProjectId && !projectId) {
          projectId = extractedProjectId
        }
        
        if (projectId) {
          // Convert to pooler connection for serverless
          const passwordMatch = dbUrl.match(/:\/\/[^:]+:([^@]+)@/)
          const password = passwordMatch ? passwordMatch[1] : url.password
          const path = url.pathname || '/postgres'
          
          // Use pooler connection format
          // Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres
          const poolerHost = `${projectId}.pooler.supabase.com`
          const poolerPort = '6543'
          
          const params = new URLSearchParams()
          params.set('sslmode', 'require')
          params.set('pgbouncer', 'true')
          
          const poolerUrl = `postgresql://postgres.${projectId}:${password}@${poolerHost}:${poolerPort}${path}?${params.toString()}`
          process.env.DATABASE_URL = poolerUrl
          console.log('🔄 Converted direct connection to pooler for serverless:', poolerHost)
        } else {
          // Can't extract project ID, just add sslmode=require
          const separator = dbUrl.includes('?') ? '&' : '?'
          process.env.DATABASE_URL = `${dbUrl}${separator}sslmode=require`
          console.log('✅ Added sslmode=require to connection string')
        }
      } else {
        // Not a direct connection, just ensure sslmode=require
        if (!dbUrl.includes('sslmode=')) {
          const separator = dbUrl.includes('?') ? '&' : '?'
          process.env.DATABASE_URL = `${dbUrl}${separator}sslmode=require`
          console.log('✅ Added sslmode=require to connection string')
        }
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
const finalDatabaseUrl = process.env.DATABASE_URL || generateDatabaseUrl()

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

