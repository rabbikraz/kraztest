import Parser from 'rss-parser'
import { prisma } from './prisma'

const parser = new Parser()

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

    return feed.items.map((item) => {
      const enclosure = item.enclosure
      const audioUrl = enclosure?.url || item.link || ''
      
      // Extract duration from itunes:duration or content
      let duration = item.itunes?.duration || ''
      
      // Get full description with HTML for source sheet extraction
      const fullDescription = item.content || item['content:encoded'] || item.description || ''
      const descriptionText = item.contentSnippet || item.description || ''
      
      // Extract source sheet URL
      const sourceDoc = extractSourceSheet(fullDescription)
      
      // Extract blurb
      const blurb = extractBlurb(descriptionText)
      
      // Handle guid - rss-parser should return it as string, but be safe
      let guid: string = ''
      if (typeof item.guid === 'string') {
        guid = item.guid
      } else if (item.guid && typeof item.guid === 'object') {
        // Handle if it's an object (shouldn't happen with rss-parser, but be safe)
        guid = (item.guid as any).$?.text || (item.guid as any)._ || String(item.guid)
      }
      guid = guid || item.id || item.link || ''
      
      // Ensure we have a valid GUID
      if (!guid) {
        console.warn('No GUID found for item:', item.title)
        guid = `temp-${Date.now()}-${Math.random()}`
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
  const items = await fetchRSSFeed(feedUrl)
  const synced: string[] = []
  const errors: string[] = []

  for (const item of items) {
    try {
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
            description: item.description,
            blurb: item.blurb,
            audioUrl: item.audioUrl,
            sourceDoc: item.sourceDoc,
            pubDate: new Date(item.pubDate),
            duration: item.duration,
            link: item.link,
          },
        })
        synced.push(item.guid)
      } else {
        // Create new shiur
        await prisma.shiur.create({
          data: {
            guid: item.guid,
            title: item.title,
            description: item.description,
            blurb: item.blurb,
            audioUrl: item.audioUrl,
            sourceDoc: item.sourceDoc,
            pubDate: new Date(item.pubDate),
            duration: item.duration,
            link: item.link,
          },
        })
        synced.push(item.guid)
      }
    } catch (error) {
      console.error(`Error syncing item ${item.guid}:`, error)
      errors.push(item.guid)
    }
  }

  return { synced, errors, total: items.length }
}

