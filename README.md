# Rabbi Kraz Website

A modern Next.js website for Rabbi Kraz with admin panel, RSS feed integration, and YouTube playlist/video management.

## Features

- 🎙️ **RSS Feed Integration** - Automatically syncs shiurim from RSS feed
- 🎵 **Audio Player** - Custom audio player with playback controls and speed options
- 📄 **Source Sheet Viewer** - Embedded PDF/Document viewer for source sheets
- 🎬 **YouTube Integration** - Displays playlists and videos from YouTube channel
- 👨‍💼 **Admin Panel** - Manage shiurim, update titles, blurbs, links, and source documents
- 📱 **Mobile Responsive** - Fully responsive design for all devices
- 🎨 **Modern UI** - Clean, professional design matching rabbikraz.com

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM with PostgreSQL (production) / SQLite (development)
- **Tailwind CSS** - Utility-first CSS framework
- **YouTube Data API v3** - For playlist and video integration

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- YouTube API key (for playlists/videos pages)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/laibelb/krazy.git
   cd krazy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   RSS_FEED_URL=https://anchor.fm/s/d89491c4/podcast/rss
   YOUTUBE_API_KEY=your-youtube-api-key-here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Create an admin user:**
   ```bash
   npm run create-admin
   ```
   Follow the prompts to enter email and password.

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## YouTube API Setup

To enable the playlists and videos pages, you need a YouTube Data API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key and add it to `.env` as `YOUTUBE_API_KEY`

## Admin Panel

Access the admin panel at `/admin` and log in with your admin credentials.

### Features:
- **RSS Sync** - Sync shiurim from RSS feed
- **Edit Shiurim** - Update title, blurb, description, source document, and platform links
- **Delete Shiurim** - Remove shiurim from the database
- **Platform Links** - Manage links to YouTube, Spotify, Apple Podcasts, Amazon, Pocket Casts, 24Six, Castbox, and YouTube Music

## Project Structure

```
rabbikraz/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── shiur/             # Individual shiur pages
│   ├── playlists/         # YouTube playlists page
│   ├── videos/            # YouTube videos page
│   └── ...
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/                # Prisma schema
└── public/                # Static assets
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run create-admin` - Create admin user
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (production) or SQLite path (development) | Yes |
| `SUPABASE_DATABASE_URL` | Alternative database URL (used if DATABASE_URL not set) | Optional |
| `NEXTAUTH_URL` | Base URL for authentication | Yes |
| `NEXTAUTH_SECRET` | Secret key for JWT tokens | Yes |
| `RSS_FEED_URL` | RSS feed URL for shiurim | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API key | Optional (for playlists/videos) |
| `NEXT_PUBLIC_BASE_URL` | Public base URL | Optional |
| `ADMIN_SETUP_TOKEN` | Secret token for one-time admin user creation (can be removed after setup) | Optional (for initial setup) |

## Deployment to Cloudflare Pages

### Prerequisites

1. A GitHub repository with your code
2. A Cloudflare account
3. A PostgreSQL database (recommended: [Supabase](https://supabase.com) or [Neon](https://neon.tech))

### Step-by-Step Deployment

1. **Set up your PostgreSQL database:**
   - Create a PostgreSQL database (Supabase, Neon, or any PostgreSQL provider)
   - Get your connection string (it should look like: `postgresql://user:password@host:port/database`)
   - For Supabase, add `?sslmode=require` to the connection string if not already included

2. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Cloudflare Pages deployment"
   git push origin master
   ```

3. **Deploy to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   - Connect your GitHub repository
   - Configure build settings:
     - **Framework preset:** Next.js
     - **Build command:** `npm run build:cloudflare`
     - **Build output directory:** `.next`
     - **Deploy command:** LEAVE EMPTY (do not set this)
     - **Node version:** 18 or higher
     - **Root directory:** `./` (or leave empty)
   - ⚠️ **IMPORTANT:** Make sure the "Deploy command" field is empty. Cloudflare Pages automatically deploys the build output.
   - Click **Save and Deploy**

4. **Configure Environment Variables in Cloudflare:**
   - Go to your Pages project → **Settings** → **Environment variables**
   - Add the following variables for Production:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://tjywoiawsxrrepthgkqd.supabase.co
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_pRItmXYYLxWRHCyD0mMbqA_QdQIbqcS
     YOUTUBE_API_KEY=AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg
     RSS_FEED_URL=https://anchor.fm/s/d89491c4/podcast/rss
     NEXTAUTH_URL=https://your-site-name.pages.dev
     NEXTAUTH_SECRET=generate-a-random-secret-string-here
     NEXT_PUBLIC_BASE_URL=https://your-site-name.pages.dev
     ```
   - **Important:** Generate a secure random string for `NEXTAUTH_SECRET` (you can use: `openssl rand -base64 32`)

5. **Create Admin User:**
   After the first deployment, create an admin user using the setup API endpoint:
   
   **Step 1:** Add `ADMIN_SETUP_TOKEN` to your Cloudflare environment variables:
   - Generate a secure random token (e.g., `openssl rand -base64 32`)
   - Add it as `ADMIN_SETUP_TOKEN` in Netlify environment variables
   
   **Step 2:** Make a POST request to create the admin user:
   ```bash
   curl -X POST https://your-site-name.netlify.app/api/admin/create-user \
     -H "Content-Type: application/json" \
     -H "X-Setup-Token: your-admin-setup-token-here" \
     -d '{"email":"admin@example.com","password":"your-secure-password","name":"Admin"}'
   ```
   
   Or use any HTTP client (Postman, Insomnia, etc.) with:
   - URL: `https://your-site-name.pages.dev/api/admin/create-user`
   - Method: POST
   - Headers: 
     - `Content-Type: application/json`
     - `X-Setup-Token: your-admin-setup-token-here`
   - Body:
     ```json
     {
       "email": "admin@example.com",
       "password": "your-secure-password",
       "name": "Admin"
     }
     ```
   
   **Step 3:** After creating your admin user, you can optionally remove the `ADMIN_SETUP_TOKEN` environment variable to disable this endpoint for security.

6. **Trigger a new deployment:**
   - After setting environment variables, go to **Deployments** → **Retry deployment** or push a new commit
   - The build will run automatically on each push

### Post-Deployment Checklist

- [ ] Verify the site loads correctly
- [ ] Test the admin login at `/admin`
- [ ] Verify database migrations ran successfully (check build logs)
- [ ] Test RSS sync functionality
- [ ] Verify all API routes work correctly

### Troubleshooting

**Database connection errors:**
- Ensure connection string includes `?sslmode=require` for Supabase
- Check that your database allows connections from Cloudflare's IP ranges
- Verify the connection string is correct (uses pooler for serverless)

**Admin login not working:**
- Ensure you've created an admin user
- Check that the database has the User table
- Verify cookies are working (check browser console)

**Build failures:**
- Check build logs in Cloudflare Pages dashboard
- Ensure all environment variables are set
- Make sure build command is `npm run build:cloudflare`
- Verify the "Deploy command" field is empty (should not be set)

**Deployment errors:**
- If you see "Missing entry-point to Worker script" error, remove any deploy command from Cloudflare Pages settings
- Cloudflare Pages automatically deploys the build output - no deploy command needed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the repository owner.
