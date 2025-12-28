# Cloudflare Pages Deployment

## Build Settings

Configure these in your Cloudflare Pages dashboard:

- **Build command:** `npm run build:cloudflare`
- **Build output directory:** `.next`
- **Framework:** Next.js
- **Root directory:** `./` (or leave empty)

## Environment Variables

Set these in Cloudflare Pages → Settings → Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `YOUTUBE_API_KEY`
- `RSS_FEED_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_BASE_URL`

## CLI Deployment (Optional)

If deploying via CLI:

```bash
npm run build:cloudflare
npx wrangler pages deploy .vercel/output/static --project-name=rabbi-kraz-shiurim
```

