import Header from '@/components/Header'
import Link from 'next/link'

export default function SetupGuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-6">
            Setup Guide
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                1. Database Setup (Required)
              </h2>
              <p className="text-gray-700 mb-4">
                You need to set up a PostgreSQL database. We recommend using <strong>Supabase</strong> (free tier available).
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Option A: Supabase (Recommended)</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> and create a free account</li>
                  <li>Create a new project</li>
                  <li>Go to Project Settings → Database</li>
                  <li>Copy the "Connection string" (use the "Pooler" connection for better performance)</li>
                  <li>It should look like: <code className="bg-blue-100 px-1 rounded">postgresql://postgres.xxxxx:password@xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true</code></li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Option B: Other PostgreSQL Provider</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Use any PostgreSQL database provider (Neon, Railway, AWS RDS, etc.)
                </p>
                <p className="text-sm text-gray-700">
                  Connection string format: <code className="bg-gray-100 px-1 rounded">postgresql://user:password@host:port/database?sslmode=require</code>
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                2. Set Environment Variables
              </h2>
              <p className="text-gray-700 mb-4">
                Add the following environment variables in your deployment platform:
              </p>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm">
{`DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
YOUTUBE_API_KEY=AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg
RSS_FEED_URL=https://anchor.fm/s/d89491c4/podcast/rss`}
                </pre>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Netlify:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Go to Site Settings → Environment Variables</li>
                    <li>Click "Add variable"</li>
                    <li>Add each variable above</li>
                    <li>Redeploy your site</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Vercel:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Go to Project Settings → Environment Variables</li>
                    <li>Add each variable</li>
                    <li>Redeploy your site</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                3. Initialize Database
              </h2>
              <p className="text-gray-700 mb-4">
                After setting DATABASE_URL, visit these endpoints to set up your database:
              </p>
              
              <div className="space-y-2">
                <a
                  href="/api/setup-db"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-center"
                >
                  Setup Database Tables
                </a>
                <a
                  href="/api/setup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
                >
                  Complete Setup (Database + Admin User)
                </a>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                4. Sync RSS Feed
              </h2>
              <p className="text-gray-700 mb-4">
                Once your database is set up, sync your shiurim from the RSS feed:
              </p>
              
              <a
                href="/api/rss/sync"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Sync RSS Feed
              </a>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                5. Check Status
              </h2>
              <a
                href="/api/diagnostic"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                View System Diagnostics
              </a>
            </section>

            <div className="pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="text-primary hover:text-secondary transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

