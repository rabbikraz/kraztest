# Cloudflare Pages Deployment

## Build Settings

Configure these in your Cloudflare Pages dashboard:

- **Build command:** `npm run build:cloudflare`
- **Build output directory:** `.next`
- **Framework:** Next.js
- **Root directory:** `./` (or leave empty)
- **Deploy command:** LEAVE EMPTY (do not set a deploy command)

⚠️ **IMPORTANT:** Do NOT set a deploy command in Cloudflare Pages. The build output will be automatically deployed. If you see a deploy command configured (like `npx wrangler deploy`), remove it.

## Environment Variables

Set these in Cloudflare Pages → Settings → Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `YOUTUBE_API_KEY`
- `RSS_FEED_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_BASE_URL`

