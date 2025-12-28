// YouTube API configuration with fallback
export function getYouTubeApiKey(): string | null {
  // First try environment variable
  if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'your-youtube-api-key-here') {
    return process.env.YOUTUBE_API_KEY
  }
  
  // Fallback to hardcoded key (provided by user)
  // This ensures the API works even if env var isn't set
  const FALLBACK_API_KEY = 'AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg'
  
  // Use fallback if env var not set (user provided this key)
  return FALLBACK_API_KEY
}

export const YOUTUBE_CHANNEL_ID = 'UCMrMvXraTLhAtpb0JZQOKhQ'

