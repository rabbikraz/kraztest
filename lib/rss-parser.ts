import Parser from 'rss-parser'
import { prisma } from './prisma'

// Configure parser to handle custom fields including guid
const parser = new Parser({
  customFields: {
    item: [
      ['guid', 'guid', { keepArray: false }],
    ],
  },
})

export interface RSSItem {
  guid: string
  title: string
  description?: string
  audioUrl: string
  pubDate: string
  duration?: string
  link?: string
  sourceDoc?: string
  blurb?: string
}

// Extract source sheet URL from description HTML
function extractSourceSheet(description: string | undefined): string | undefined {
  if (!description) return undefined
  
  // Look for source sheet links in various formats
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
      // Fix relative URLs
      if (url.startsWith('RabbiKraz.com/') || url.startsWith('rabbikraz.com/')) {
        url = `https://${url}`
      }
      return url
    }
  }
  
  return undefined
}

// Extract blurb (first paragraph or first line of description)
function extractBlurb(description: string | undefined): string | undefined {
  if (!description) return undefined
  
  // Remove HTML tags for blurb
  let text = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
  
  // Get first sentence or first 200 characters
  const firstSentence = text.split(/[.!?]\s+/)[0]
  if (firstSentence && firstSentence.length > 20 && firstSentence.length < 300) {
    return firstSentence
  }
  
  // Otherwise get first 200 characters
  if (text.length > 200) {
    return text.substring(0, 200).trim() + '...'
  }
  
  return text || undefined
}

export async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl)
    
    if (!feed.items) {
      return []
    }

    return feed.items.map((item: any) => {
      const enclosure = item.enclosure
      const audioUrl = enclosure?.url || item.link || ''
      
      // Extract duration from itunes:duration or content
      let duration = (item.itunes as any)?.duration || ''
      
      // Get full description with HTML for source sheet extraction
      const fullDescription = item.content || item['content:encoded'] || item.description || ''
      const descriptionText = item.contentSnippet || item.description || ''
      
      // Extract source sheet URL
      const sourceDoc = extractSourceSheet(fullDescription)
      
      // Extract blurb
      const blurb = extractBlurb(descriptionText)
      
      // Handle guid - rss-parser may return it as string or object
      let guid: string = ''
      
      // rss-parser can return guid as string or object with value property
      if (typeof item.guid === 'string') {
        guid = item.guid.trim()
      } else if (item.guid) {
        // Handle object format: { value: 'guid-value' } or similar
        const guidObj = item.guid as any
        guid = guidObj.value || guidObj.$?.text || guidObj._ || guidObj.toString() || ''
        guid = String(guid).trim()
      }
      
      // Fallback to id or link if guid is missing
      if (!guid) {
        guid = (item.id || item.link || '').toString().trim()
      }
      
      // Last resort: generate a stable GUID from title and pubDate
      if (!guid) {
        const titleHash = item.title ? btoa(item.title).substring(0, 20).replace(/[^a-zA-Z0-9]/g, '') : ''
        const dateHash = item.pubDate ? new Date(item.pubDate).getTime().toString(36) : ''
        guid = `${titleHash}-${dateHash}`.replace(/[^a-zA-Z0-9-]/g, '')
        console.warn(`Generated GUID for item: ${item.title} -> ${guid}`)
      }
      
      // Ensure GUID is not empty
      if (!guid || guid.length < 3) {
        guid = `guid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
      
      return {
        guid: String(guid),
        title: item.title || '',
        description: fullDescription || descriptionText,
        audioUrl,
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        duration,
        link: item.link || '',
        sourceDoc,
        blurb,
      }
    })
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    throw error
  }
}

export async function syncRSSFeed(feedUrl: string) {
  // Check database connection first
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not configured')
  }

  try {
    // Test database connection
    await prisma.$connect()
  } catch (error: any) {
    console.error('Database connection failed:', error?.message || error)
    throw new Error(`Database connection failed: ${error?.message || 'Unknown error'}`)
  }

  const items = await fetchRSSFeed(feedUrl)
  const synced: string[] = []
  const errors: Array<{ guid: string; error: string }> = []

  console.log(`Starting sync of ${items.length} items from RSS feed`)

  for (const item of items) {
    try {
      // Validate required fields
      if (!item.guid) {
        errors.push({ guid: item.title || 'unknown', error: 'Missing GUID' })
        continue
      }

      if (!item.title) {
        errors.push({ guid: item.guid, error: 'Missing title' })
        continue
      }

      if (!item.audioUrl) {
        errors.push({ guid: item.guid, error: 'Missing audioUrl' })
        continue
      }

      // Check if shiur already exists
      const existing = await prisma.shiur.findUnique({
        where: { guid: item.guid },
      })

      if (existing) {
        // Update existing shiur
        await prisma.shiur.update({
          where: { guid: item.guid },
          data: {
            title: item.title,
            description: item.description || null,
            blurb: item.blurb || null,
            audioUrl: item.audioUrl,
            sourceDoc: item.sourceDoc || null,
            pubDate: new Date(item.pubDate),
            duration: item.duration || null,
            link: item.link || null,
          },
        })
        synced.push(item.guid)
      } else {
        // Create new shiur
        await prisma.shiur.create({
          data: {
            guid: item.guid,
            title: item.title,
            description: item.description || null,
            blurb: item.blurb || null,
            audioUrl: item.audioUrl,
            sourceDoc: item.sourceDoc || null,
            pubDate: new Date(item.pubDate),
            duration: item.duration || null,
            link: item.link || null,
          },
        })
        synced.push(item.guid)
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      console.error(`Error syncing item "${item.title}" (${item.guid}):`, errorMsg)
      errors.push({ guid: item.guid, error: errorMsg })
    }
  }

  console.log(`Sync complete: ${synced.length} synced, ${errors.length} errors`)

  return { synced, errors, total: items.length }
}

