export function getYouTubeApiKey(): string | null {
  if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'your-youtube-api-key-here') {
    return process.env.YOUTUBE_API_KEY
  }
  
  // Fallback key
  return 'AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg'
}

export const YOUTUBE_CHANNEL_ID = 'UCMrMvXraTLhAtpb0JZQOKhQ'
