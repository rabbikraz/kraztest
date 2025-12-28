import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

export const dynamic = 'force-dynamic'

const parser = new Parser()

export async function GET() {
  try {
    const feedUrl = 'https://anchor.fm/s/d89491c4/podcast/rss'
    const feed = await parser.parseURL(feedUrl)
    
    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ error: 'No items found' }, { status: 400 })
    }

    // Get first item and show its structure
    const firstItem = feed.items[0]
    
    return NextResponse.json({
      totalItems: feed.items.length,
      firstItem: {
        title: firstItem.title,
        guid: firstItem.guid,
        guidType: typeof firstItem.guid,
        guidValue: typeof firstItem.guid === 'object' ? JSON.stringify(firstItem.guid) : firstItem.guid,
        link: firstItem.link,
        pubDate: firstItem.pubDate,
        enclosure: firstItem.enclosure,
        itunes: firstItem.itunes,
        description: firstItem.description?.substring(0, 200),
      },
      sampleGuids: feed.items.slice(0, 5).map(item => ({
        title: item.title,
        guid: item.guid,
        guidType: typeof item.guid,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to parse RSS' },
      { status: 500 }
    )
  }
}

