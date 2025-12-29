# Rabbi Kraz Shiurim - Cloudflare Pages

A Next.js application for Rabbi Kraz's shiurim, built from scratch and optimized for Cloudflare Pages.

## Features

- 🎙️ RSS Feed Integration
- 🎵 Audio Player
- 📄 Source Sheet Viewer
- 🎬 YouTube Integration
- 👨‍💼 Admin Panel
- 📱 Mobile Responsive

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

### Cloudflare Pages Deployment

1. **Connect to GitHub** in Cloudflare Pages
2. **Configure Build Settings:**
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Deploy command: **LEAVE EMPTY**

3. **Set Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key
   YOUTUBE_API_KEY=your-youtube-key
   RSS_FEED_URL=your-rss-feed-url
   DATABASE_URL=your-database-url
   NEXTAUTH_URL=your-site-url
   NEXTAUTH_SECRET=your-secret
   ```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma (PostgreSQL)
- Tailwind CSS
- Cloudflare Pages

## Project Structure

```
app/
  ├── api/          # API routes
  ├── admin/        # Admin panel
  ├── shiur/        # Individual shiur pages
  └── ...
components/         # React components
lib/                # Utilities
prisma/             # Database schema
```

## License

Private and proprietary.
