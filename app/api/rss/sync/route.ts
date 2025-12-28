import { NextRequest, NextResponse } from 'next/server'
import { syncRSSFeed } from '@/lib/rss-parser'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  if (!session) return false
  
  const user = await prisma.user.findUnique({
    where: { id: session.value },
  })
  return !!user
}

// Allow GET for easier syncing, POST requires auth
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feedUrl = searchParams.get('feedUrl')
    const url = feedUrl || process.env.RSS_FEED_URL || 'https://anchor.fm/s/d89491c4/podcast/rss'

    if (!url) {
      return NextResponse.json(
        { error: 'RSS feed URL is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting RSS sync from: ${url}`)
    const result = await syncRSSFeed(url)

    // Log results
    console.log(`✅ Sync complete: ${result.synced.length} synced, ${result.errors.length} errors out of ${result.total} total`)
    
    if (result.errors.length > 0) {
      console.error('❌ Sync errors (first 5):', result.errors.slice(0, 5))
    }
    
    if (result.synced.length > 0) {
      console.log(`✨ Successfully synced: ${result.synced.slice(0, 3).join(', ')}${result.synced.length > 3 ? '...' : ''}`)
    }

    return NextResponse.json({
      success: result.synced.length > 0,
      synced: result.synced.length,
      errors: result.errors.length,
      total: result.total,
      message: result.synced.length > 0 
        ? `Successfully synced ${result.synced.length} of ${result.total} shiurim`
        : `Failed to sync: ${result.errors.length} errors out of ${result.total} items`,
      errorDetails: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      syncedGuids: result.synced.slice(0, 5), // Show first 5 synced GUIDs
    })
  } catch (error: any) {
    console.error('Error syncing RSS feed:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feedUrl } = await request.json()
    const url = feedUrl || process.env.RSS_FEED_URL || 'https://anchor.fm/s/d89491c4/podcast/rss'

    if (!url) {
      return NextResponse.json(
        { error: 'RSS feed URL is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting RSS sync from: ${url}`)
    const result = await syncRSSFeed(url)

    // Log results
    console.log(`✅ Sync complete: ${result.synced.length} synced, ${result.errors.length} errors out of ${result.total} total`)
    
    if (result.errors.length > 0) {
      console.error('❌ Sync errors (first 5):', result.errors.slice(0, 5))
    }
    
    if (result.synced.length > 0) {
      console.log(`✨ Successfully synced: ${result.synced.slice(0, 3).join(', ')}${result.synced.length > 3 ? '...' : ''}`)
    }

    return NextResponse.json({
      success: result.synced.length > 0,
      synced: result.synced.length,
      errors: result.errors.length,
      total: result.total,
      message: result.synced.length > 0 
        ? `Successfully synced ${result.synced.length} of ${result.total} shiurim`
        : `Failed to sync: ${result.errors.length} errors out of ${result.total} items`,
      errorDetails: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      syncedGuids: result.synced.slice(0, 5), // Show first 5 synced GUIDs
    })
  } catch (error: any) {
    console.error('Error syncing RSS feed:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

