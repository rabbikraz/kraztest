'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'

export default function ConfigurePage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/diagnostic')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch status:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-6">
            Quick Configuration Guide
          </h1>

          {loading ? (
            <p className="text-gray-600">Loading status...</p>
          ) : (
            <div className="space-y-8">
              {/* Current Status */}
              <section className="bg-gray-50 rounded-lg p-6">
                <h2 className="font-serif text-xl font-semibold text-primary mb-4">
                  Current Status
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={status?.environment?.hasDatabaseUrl ? 'text-green-600' : 'text-red-600'}>
                      {status?.environment?.hasDatabaseUrl ? '✅' : '❌'}
                    </span>
                    <span>DATABASE_URL: {status?.environment?.hasDatabaseUrl ? 'SET' : 'NOT SET'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={status?.environment?.hasYoutubeApiKey ? 'text-green-600' : 'text-yellow-600'}>
                      {status?.environment?.hasYoutubeApiKey ? '✅' : '⚠️'}
                    </span>
                    <span>YOUTUBE_API_KEY: {status?.environment?.youtubeApiKeySet || 'NOT SET'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={status?.database?.connected ? 'text-green-600' : 'text-red-600'}>
                      {status?.database?.connected ? '✅' : '❌'}
                    </span>
                    <span>Database Connection: {status?.database?.connected ? 'CONNECTED' : status?.database?.error || 'NOT CONNECTED'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={status?.database?.shiurCount > 0 ? 'text-green-600' : 'text-gray-600'}>
                      {status?.database?.shiurCount > 0 ? '✅' : '⏳'}
                    </span>
                    <span>Shiurim in Database: {status?.database?.shiurCount || 0}</span>
                  </div>
                </div>
              </section>

              {/* Step 1: Get Database */}
              {!status?.environment?.hasDatabaseUrl && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                    Step 1: Get a Free Database (2 minutes)
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">Option A: Supabase (Recommended - Free)</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 mb-4">
                      <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">supabase.com/dashboard</a></li>
                      <li>Click "New Project"</li>
                      <li>Fill in:
                        <ul className="list-disc list-inside ml-6 mt-1">
                          <li>Name: "Rabbi Kraz Shiurim" (or any name)</li>
                          <li>Database Password: (create a strong password - save it!)</li>
                          <li>Region: Choose closest to you</li>
                        </ul>
                      </li>
                      <li>Click "Create new project" (takes 1-2 minutes)</li>
                      <li>Once created, go to: <strong>Project Settings → Database</strong></li>
                      <li>Scroll to "Connection string"</li>
                      <li>Click the dropdown and select <strong>"URI"</strong></li>
                      <li>Copy the connection string (it starts with <code className="bg-blue-100 px-1 rounded">postgresql://</code>)</li>
                    </ol>
                    
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-1">Your connection string will look like:</p>
                      <code className="text-xs break-all bg-gray-100 p-2 rounded block">
                        postgresql://postgres.xxxxx:[YOUR-PASSWORD]@xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true
                      </code>
                    </div>

                    <p className="text-sm text-blue-700 font-medium">
                      ⚠️ IMPORTANT: Replace <code className="bg-blue-100 px-1 rounded">[YOUR-PASSWORD]</code> with the password you created!
                    </p>
                  </div>
                </section>
              )}

              {/* Step 2: Set in Netlify */}
              {!status?.environment?.hasDatabaseUrl && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                    Step 2: Add to Netlify (1 minute)
                  </h2>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                      <li>Go to your <a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Netlify Dashboard</a></li>
                      <li>Click on your site</li>
                      <li>Go to <strong>Site settings</strong> (left sidebar)</li>
                      <li>Click <strong>Environment variables</strong> (under "Build & deploy")</li>
                      <li>Click <strong>"Add a variable"</strong></li>
                      <li>Enter:
                        <ul className="list-disc list-inside ml-6 mt-1">
                          <li><strong>Key:</strong> <code className="bg-green-100 px-1 rounded">DATABASE_URL</code></li>
                          <li><strong>Value:</strong> Paste your connection string from Step 1</li>
                        </ul>
                      </li>
                      <li>Click <strong>"Save"</strong></li>
                      <li>Go to <strong>Deploys</strong> tab → Click <strong>"Trigger deploy"</strong> → <strong>"Deploy site"</strong></li>
                    </ol>
                  </div>
                </section>
              )}

              {/* Step 3: Setup Database */}
              {status?.environment?.hasDatabaseUrl && !status?.database?.connected && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                    Step 3: Initialize Database Tables
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Your DATABASE_URL is set! Now let's create the database tables.
                  </p>
                  <a
                    href="/api/setup-db"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-medium"
                  >
                    Create Database Tables →
                  </a>
                </section>
              )}

              {/* Step 4: Sync RSS */}
              {status?.database?.connected && status?.database?.shiurCount === 0 && (
                <section>
                  <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
                    Step 4: Sync RSS Feed
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Database is connected! Now let's sync your shiurim.
                  </p>
                  <a
                    href="/api/rss/sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Sync RSS Feed →
                  </a>
                </section>
              )}

              {/* Success */}
              {status?.database?.connected && status?.database?.shiurCount > 0 && (
                <section className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="font-serif text-xl font-semibold text-green-900 mb-2">
                    ✅ Everything is Configured!
                  </h2>
                  <p className="text-green-800 mb-4">
                    Your database is connected and you have {status.database.shiurCount} shiurim synced.
                  </p>
                  <Link
                    href="/"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Go to Homepage →
                  </Link>
                </section>
              )}

              <div className="pt-6 border-t border-gray-200">
                <Link
                  href="/"
                  className="text-primary hover:text-secondary transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

