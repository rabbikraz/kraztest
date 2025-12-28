import Header from '@/components/Header'
import { ExternalLink, Play, Clock, Eye, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import VideoFilters from '@/components/VideoFilters'
import VideosGrid from '@/components/VideosGrid'

// Mark as dynamic to ensure data is fetched on each request
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

async function getVideos() {
  try {
    const YOUTUBE_CHANNEL_ID = 'UCMrMvXraTLhAtpb0JZQOKhQ'
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your-youtube-api-key-here') {
      console.error('YouTube API key not configured for videos page')
      return []
    }

    // Get the channel's uploads playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 3600 } }
    )

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json().catch(() => ({}))
      console.error('Failed to fetch channel data:', errorData)
      return []
    }

    const channelData = await channelResponse.json()
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      console.error('Could not find uploads playlist ID')
      return []
    }

    // Fetch all videos using pagination
    let allVideoIds: string[] = []
    let nextPageToken: string | undefined = undefined
    
    do {
      let playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
      if (nextPageToken) {
        playlistUrl += `&pageToken=${nextPageToken}`
      }
      
      const videosResponse = await fetch(playlistUrl, { next: { revalidate: 3600 } })
      
      if (!videosResponse.ok) {
        const errorData = await videosResponse.json().catch(() => ({}))
        console.error('Failed to fetch videos from playlist:', errorData)
        break
      }
      
      const videosData = await videosResponse.json()
      const pageVideoIds = videosData.items.map((item: any) => item.contentDetails.videoId)
      allVideoIds = allVideoIds.concat(pageVideoIds)
      nextPageToken = videosData.nextPageToken
    } while (nextPageToken)

    // YouTube API limits video details to 50 IDs per request, so batch them
    const allVideos: any[] = []
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batchIds = allVideoIds.slice(i, i + 50)
      const videoIds = batchIds.join(',')

      // Get detailed video information for this batch
      const videoDetailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`,
        { next: { revalidate: 3600 } }
      )

      if (!videoDetailsResponse.ok) {
        const errorData = await videoDetailsResponse.json().catch(() => ({}))
        console.error('Failed to fetch video details:', errorData)
        continue
      }

      const videoDetailsData = await videoDetailsResponse.json()
      allVideos.push(...videoDetailsData.items)
    }

    // Format all videos and mark them as shiurim or shorts
    const videos = allVideos
      .map((video: any) => {
        const duration = video.contentDetails.duration
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        const hours = parseInt(match[1] || '0')
        const minutes = parseInt(match[2] || '0')
        const seconds = parseInt(match[3] || '0')
        const totalSeconds = hours * 3600 + minutes * 60 + seconds
        
        let durationStr = ''
        if (hours > 0) {
          durationStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        } else {
          durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
        }

        // Shorts are videos shorter than 3 minutes (180 seconds)
        const isShort = totalSeconds < 180
        
        return {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
          publishedAt: video.snippet.publishedAt,
          duration: durationStr,
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
          type: isShort ? 'short' : 'shiur',
        }
      })
      .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return videos
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const allVideos = await getVideos()
  const page = parseInt(searchParams.page || '1', 10)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">
            Videos
          </h1>
          <p className="text-muted-foreground">
            Watch shiurim and shorts on YouTube ({allVideos.length} videos)
          </p>
        </div>

        {allVideos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
            <p className="text-gray-600 mb-4">No videos available at the moment.</p>
            <p className="text-sm text-gray-500 mb-4">
              {!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'your-youtube-api-key-here' 
                ? 'YouTube API key not configured. Please set YOUTUBE_API_KEY in your environment variables.'
                : 'This could be due to API rate limits or network issues.'}
            </p>
            <a
              href="https://www.youtube.com/@RabbiKraz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View videos on YouTube
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <VideosGrid initialVideos={allVideos} currentPage={page} />
        )}
      </main>
    </div>
  )
}
