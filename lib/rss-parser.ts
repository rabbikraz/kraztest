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
      
      // Handle guid - rss-parser returns it as string for standard RSS feeds
      let guid: string = ''
      
      // Try to get GUID - rss-parser should return it as string
      if (item.guid) {
        if (typeof item.guid === 'string') {
          guid = item.guid.trim()
        } else if (typeof item.guid === 'object') {
          // Sometimes it's an object, extract the value
          const guidObj = item.guid as any
          guid = guidObj.value || guidObj.$?.text || guidObj._ || String(guidObj) || ''
          guid = String(guid).trim()
        } else {
          guid = String(item.guid).trim()
        }
      }
      
      // Fallback: use id or link
      if (!guid || guid.length < 3) {
        guid = (item.id || item.link || '').toString().trim()
      }
      
      // Last resort: extract from link URL or generate from title/pubDate
      if (!guid || guid.length < 3) {
        // Try to extract ID from link (e.g., episodes/From-Majorca-to-Algeria-The-Genius-of-the-Rashbatz-e3cpqkj)
        if (item.link) {
          const linkMatch = item.link.match(/episodes\/([^\/]+)$/)
          if (linkMatch) {
            guid = linkMatch[1]
          }
        }
      }
      
      // Final fallback: generate stable GUID
      if (!guid || guid.length < 3) {
        const titleHash = item.title ? btoa(item.title).substring(0, 20).replace(/[^a-zA-Z0-9]/g, '') : ''
        const dateHash = item.pubDate ? new Date(item.pubDate).getTime().toString(36) : ''
        guid = `${titleHash}-${dateHash}`.replace(/[^a-zA-Z0-9-]/g, '')
        console.warn(`Generated GUID for item: ${item.title} -> ${guid}`)
      }
      
      // Log if we had to generate GUID (shouldn't happen with proper RSS feed)
      if (guid.includes('Generated') || guid.length < 10) {
        console.warn(`⚠️  Item "${item.title}" has suspicious GUID: ${guid}`)
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
    console.log('✅ Database connection successful')
  } catch (error: any) {
    console.error('❌ Database connection failed:', error?.message || error)
    throw new Error(`Database connection failed: ${error?.message || 'Unknown error'}`)
  }

  console.log(`📡 Fetching RSS feed from: ${feedUrl}`)
  const items = await fetchRSSFeed(feedUrl)
  const synced: string[] = []
  const errors: Array<{ guid: string; error: string }> = []

  console.log(`✅ Fetched ${items.length} items from RSS feed`)
  
  // Log first item for debugging
  if (items.length > 0) {
    console.log(`📝 First item sample:`, {
      guid: items[0].guid,
      title: items[0].title?.substring(0, 50),
      hasAudio: !!items[0].audioUrl,
    })
  }

  for (const item of items) {
    try {
      // Validate required fields
      if (!item.guid || item.guid.length < 3) {
        const errorMsg = `Invalid GUID: ${item.guid || 'empty'}`
        console.error(`❌ ${errorMsg} for item: ${item.title}`)
        errors.push({ guid: item.title || 'unknown', error: errorMsg })
        continue
      }

      if (!item.title || item.title.trim().length === 0) {
        const errorMsg = 'Missing or empty title'
        console.error(`❌ ${errorMsg} for GUID: ${item.guid}`)
        errors.push({ guid: item.guid, error: errorMsg })
        continue
      }

      if (!item.audioUrl || item.audioUrl.trim().length === 0) {
        const errorMsg = 'Missing or empty audioUrl'
        console.error(`❌ ${errorMsg} for item: ${item.title} (${item.guid})`)
        errors.push({ guid: item.guid, error: errorMsg })
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
        if (synced.length <= 3) {
          console.log(`🔄 Updated: ${item.title.substring(0, 50)}`)
        }
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
        if (synced.length <= 3) {
          console.log(`✨ Created: ${item.title.substring(0, 50)}`)
        }
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

