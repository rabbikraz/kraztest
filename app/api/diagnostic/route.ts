import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYouTubeApiKey } from '@/lib/youtube-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const youtubeApiKey = getYouTubeApiKey()
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasYoutubeApiKey: !!youtubeApiKey,
      hasRssFeedUrl: !!process.env.RSS_FEED_URL,
      youtubeApiKeySet: youtubeApiKey ? 'SET' : 'NOT SET',
    },
    database: {
      connected: false,
      shiurCount: 0,
      error: null,
    },
    rss: {
      feedUrl: process.env.RSS_FEED_URL || 'https://anchor.fm/s/d89491c4/podcast/rss',
    },
  }

  // Test database connection
  try {
    if (process.env.DATABASE_URL) {
      const shiurCount = await prisma.shiur.count()
      diagnostics.database.connected = true
      diagnostics.database.shiurCount = shiurCount
    } else {
      diagnostics.database.error = 'DATABASE_URL not set'
    }
  } catch (error: any) {
    diagnostics.database.error = error?.message || 'Database connection failed'
    diagnostics.database.connected = false
  }

  return NextResponse.json(diagnostics, { status: 200 })
}

