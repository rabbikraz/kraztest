// Script to sync RSS feed directly
// Try to load .env if it exists
try {
  require('dotenv').config()
} catch (e) {
  // dotenv not installed, that's okay
}
const { PrismaClient } = require('@prisma/client')
const Parser = require('rss-parser')

// Fix connection string at runtime (same logic as lib/prisma.ts)
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
    const isPooler = url.port === '6543' || url.hostname.includes('pooler')
    
    // Fix username for pooler
    if (isPooler && projectId && !url.username.includes('.')) {
      const password = url.password
      const host = url.hostname
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
      if (!params.has('sslmode') && (host.includes('supabase.co') || host.includes('supabase.com'))) {
        params.set('sslmode', 'require')
      }
      
      if (params.toString()) newUrl += '?' + params.toString()
      process.env.DATABASE_URL = newUrl
    }
  } catch (e) {
    // Ignore parsing errors
  }
}

// Fix connection string before creating Prisma client
fixConnectionString()

const prisma = new PrismaClient()
const parser = new Parser()

const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://anchor.fm/s/d89491c4/podcast/rss'

// Extract source sheet URL from description HTML
function extractSourceSheet(description) {
  if (!description) return undefined
  
  const patterns = [
    /<a[^>]*href=["']([^"']*(?:source|sheet|Source|Sheet)[^"']*)["'][^>]*>.*?Source\s+Sheet.*?<\/a>/i,
    /<a[^>]*href=["']([^"']+)["'][^>]*>.*?Source\s+Sheet.*?<\/a>/i,
    /<a[^>]*href=["']([^"']+)["'][^>]*>.*?Source\s+Sheet/i,
    /href=["']([^"']*(?:drive\.google\.com|rabbikraz\.com|RabbiKraz\.com)[^"']*)["']/i,
  ]
  
  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      let url = match[1]
      if (url.startsWith('RabbiKraz.com/') || url.startsWith('rabbikraz.com/')) {
        url = `https://${url}`
      }
      return url
    }
  }
  
  return undefined
}

// Extract blurb
function extractBlurb(description) {
  if (!description) return undefined
  
  let text = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
  
  const firstSentence = text.split(/[.!?]\s+/)[0]
  if (firstSentence && firstSentence.length > 20 && firstSentence.length < 300) {
    return firstSentence
  }
  
  if (text.length > 200) {
    return text.substring(0, 200).trim() + '...'
  }
  
  return text || undefined
}

async function syncRSSFeed() {
  try {
    console.log(`📡 Fetching RSS feed from: ${RSS_FEED_URL}`)
    const feed = await parser.parseURL(RSS_FEED_URL)
    
    if (!feed.items || feed.items.length === 0) {
      console.log('❌ No items found in RSS feed')
      return
    }

    console.log(`✅ Found ${feed.items.length} items in RSS feed`)
    
    const synced = []
    const errors = []

    for (const item of feed.items) {
      try {
        const enclosure = item.enclosure
        const audioUrl = enclosure?.url || item.link || ''
        const duration = item.itunes?.duration || ''
        const fullDescription = item.content || item['content:encoded'] || item.description || ''
        const descriptionText = item.contentSnippet || item.description || ''
        
        let guid = ''
        if (typeof item.guid === 'string') {
          guid = item.guid
        } else if (item.guid && typeof item.guid === 'object') {
          guid = item.guid.$?.text || item.guid._ || String(item.guid)
        }
        guid = guid || item.id || item.link || ''
        
        if (!guid) {
          console.warn(`⚠️  No GUID found for: ${item.title}`)
          guid = `temp-${Date.now()}-${Math.random()}`
        }

        const sourceDoc = extractSourceSheet(fullDescription)
        const blurb = extractBlurb(descriptionText)

        // Check if shiur already exists
        const existing = await prisma.shiur.findUnique({
          where: { guid: String(guid) },
        })

        if (existing) {
          await prisma.shiur.update({
            where: { guid: String(guid) },
            data: {
              title: item.title || '',
              description: fullDescription || descriptionText,
              blurb,
              audioUrl,
              sourceDoc,
              pubDate: new Date(item.pubDate || item.isoDate || new Date()),
              duration,
              link: item.link || '',
            },
          })
          console.log(`🔄 Updated: ${item.title}`)
        } else {
          await prisma.shiur.create({
            data: {
              guid: String(guid),
              title: item.title || '',
              description: fullDescription || descriptionText,
              blurb,
              audioUrl,
              sourceDoc,
              pubDate: new Date(item.pubDate || item.isoDate || new Date()),
              duration,
              link: item.link || '',
            },
          })
          console.log(`✨ Created: ${item.title}`)
        }
        synced.push(guid)
      } catch (error) {
        console.error(`❌ Error syncing "${item.title}":`, error.message)
        errors.push(item.guid || item.title)
      }
    }

    console.log('\n📊 Sync Summary:')
    console.log(`   ✅ Synced: ${synced.length}`)
    console.log(`   ❌ Errors: ${errors.length}`)
    console.log(`   📦 Total: ${feed.items.length}`)
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:')
      errors.forEach(err => console.log(`   - ${err}`))
    }
  } catch (error) {
    console.error('❌ Error syncing RSS feed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  console.error('')
  console.error('Please set DATABASE_URL in your environment or .env file.')
  console.error('Example:')
  console.error('  DATABASE_URL=postgresql://user:password@host:port/database')
  console.error('')
  console.error('Alternatively, you can sync via the API endpoint:')
  console.error('  Visit: https://your-domain.com/api/rss/sync')
  console.error('  Or run: curl https://your-domain.com/api/rss/sync')
  process.exit(1)
}

// Run the sync
syncRSSFeed()
  .then(() => {
    console.log('\n✅ RSS sync completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

