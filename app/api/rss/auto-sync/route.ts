import { NextResponse } from 'next/server'
import { syncRSSFeed } from '@/lib/rss-parser'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Auto-sync endpoint that runs on app startup or can be called periodically
export async function GET() {
  try {
    // Only run if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not configured',
      }, { status: 500 })
    }

    // Check if we need to sync (if database is empty)
    const shiurCount = await prisma.shiur.count()
    
    // Only sync if database is empty or if forced
    if (shiurCount === 0) {
      const feedUrl = process.env.RSS_FEED_URL || 'https://anchor.fm/s/d89491c4/podcast/rss'
      
      // Run sync in background (don't wait for it to complete)
      syncRSSFeed(feedUrl).catch((error) => {
        console.error('Background RSS sync failed:', error)
      })

      return NextResponse.json({
        success: true,
        message: 'RSS sync started in background (database was empty)',
        shiurCount: 0,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database already has shiurim, skipping auto-sync',
      shiurCount,
    })
  } catch (error: any) {
    console.error('Error starting RSS sync:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

