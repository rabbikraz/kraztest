import Parser from 'rss-parser'
import { prisma } from './prisma'

const parser = new Parser()

export interface RSSItem {
  guid: string
  title: string
  description?: string
  pubDate?: string
  enclosure?: {
    url: string
    length?: string
    type?: string
  }
  link?: string
  itunes?: {
    summary?: string
    duration?: string
  }
}

export async function parseRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl)
    return (feed.items || []).map((item) => ({
      guid: item.guid || item.id || '',
      title: item.title || '',
      description: item.contentSnippet || item.content || item.itunes?.summary || '',
      pubDate: item.pubDate || item.isoDate || '',
      enclosure: item.enclosure ? {
        url: item.enclosure.url || '',
        length: item.enclosure.length,
        type: item.enclosure.type,
      } : undefined,
      link: item.link,
      itunes: item.itunes ? {
        summary: item.itunes.summary,
        duration: item.itunes.duration,
      } : undefined,
    }))
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
    throw error
  }
}

export async function syncRSSFeed(feedUrl: string) {
  const items = await parseRSSFeed(feedUrl)
  const results = {
    total: items.length,
    synced: [] as string[],
    errors: [] as Array<{ guid: string; error: string }>,
  }

  for (const item of items) {
    try {
      if (!item.guid || !item.title || !item.enclosure?.url) {
        results.errors.push({
          guid: item.guid || 'unknown',
          error: 'Missing required fields (guid, title, or audioUrl)',
        })
        continue
      }

      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
      const blurb = item.itunes?.summary || item.description || null
      const duration = item.itunes?.duration || null

      await prisma.shiur.upsert({
        where: { guid: item.guid },
        update: {
          title: item.title,
          description: item.description || null,
          blurb,
          audioUrl: item.enclosure.url,
          pubDate,
          duration,
          link: item.link || null,
        },
        create: {
          guid: item.guid,
          title: item.title,
          description: item.description || null,
          blurb,
          audioUrl: item.enclosure.url,
          pubDate,
          duration,
          link: item.link || null,
        },
      })

      results.synced.push(item.guid)
    } catch (error: any) {
      results.errors.push({
        guid: item.guid || 'unknown',
        error: error?.message || 'Unknown error',
      })
    }
  }

  return results
}
