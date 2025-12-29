# Cloudflare Pages Setup for Next.js

## Critical Configuration

Your Cloudflare Pages project **MUST** be configured with these exact settings:

### Build Settings

1. **Framework preset:** `Next.js` ⚠️ **CRITICAL - Must be "Next.js", not "None"**
2. **Build command:** `npm run build:cloudflare`
3. **Build output directory:** `.next`
4. **Deploy command:** **LEAVE EMPTY** (do not set this)
5. **Root directory:** `./` (or leave empty)
6. **Node version:** 18 or higher

### Why This Matters

- **Framework preset = Next.js**: This tells Cloudflare Pages to use their Next.js runtime, which handles server-side rendering automatically
- **No deploy command**: Cloudflare Pages automatically deploys Next.js when the framework preset is set correctly
- **Build output = .next**: This is where Next.js outputs the build

### Environment Variables

Set these in Cloudflare Pages → Settings → Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tjywoiawsxrrepthgkqd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_pRItmXYYLxWRHCyD0mMbqA_QdQIbqcS
YOUTUBE_API_KEY=AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg
RSS_FEED_URL=https://anchor.fm/s/d89491c4/podcast/rss
NEXTAUTH_URL=https://your-site.pages.dev
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_BASE_URL=https://your-site.pages.dev
```

### Troubleshooting

**If the site is stuck on "Loading...":**
- ✅ Check that Framework preset is set to **"Next.js"** (not "None")
- ✅ Verify build output directory is `.next`
- ✅ Ensure deploy command is **EMPTY**
- ✅ Check build logs for errors

**If build fails:**
- Check that all environment variables are set
- Verify Node.js version is 18+
- Check build logs for specific errors

### How It Works

When Framework preset is set to "Next.js":
1. Cloudflare Pages detects Next.js during build
2. It automatically configures the Next.js runtime
3. Server-side rendering works automatically
4. API routes work automatically
5. No manual configuration needed

The app will work correctly once the Framework preset is set to "Next.js"!

