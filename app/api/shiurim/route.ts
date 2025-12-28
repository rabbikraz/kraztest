import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  if (!session) return false
  
  const user = await prisma.user.findUnique({
    where: { id: session.value },
  })
  return !!user
}

export async function GET() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const shiurim = await prisma.shiur.findMany({
      orderBy: { pubDate: 'desc' },
      include: {
        platformLinks: true,
      },
    })
    return NextResponse.json(shiurim)
  } catch (error: any) {
    console.error('Error fetching shiurim:', error)
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

    const data = await request.json()
    const shiur = await prisma.shiur.create({
      data: {
        guid: data.guid,
        title: data.title,
        description: data.description,
        blurb: data.blurb,
        audioUrl: data.audioUrl,
        sourceDoc: data.sourceDoc,
        pubDate: new Date(data.pubDate),
        duration: data.duration,
        link: data.link,
        platformLinks: data.platformLinks
          ? {
              create: data.platformLinks,
            }
          : undefined,
      },
      include: {
        platformLinks: true,
      },
    })

    return NextResponse.json(shiur)
  } catch (error) {
    console.error('Error creating shiur:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

