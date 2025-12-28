'use client'

import { useState } from 'react'
import Header from '@/components/Header'

export default function FormatDbUrlPage() {
  const [password, setPassword] = useState('')
  const [formatted, setFormatted] = useState('')

  const baseUrl = 'postgresql://postgres:[YOUR-PASSWORD]@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres'

  const handleFormat = () => {
    if (!password) {
      alert('Please enter your database password')
      return
    }
    
    const formattedUrl = baseUrl.replace('[YOUR-PASSWORD]', encodeURIComponent(password)) + '?sslmode=require'
    setFormatted(formattedUrl)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatted)
    alert('Copied to clipboard! Now paste this into Netlify environment variables.')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="font-serif text-3xl font-bold text-primary mb-6">
            Format Your Database URL
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Supabase Database Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your database password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the password you set when creating your Supabase project
              </p>
            </div>

            <button
              onClick={handleFormat}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-medium"
            >
              Format Connection String
            </button>

            {formatted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="font-semibold text-green-900 mb-3">
                  ✅ Your Complete DATABASE_URL:
                </h2>
                <div className="bg-white rounded p-3 mb-3">
                  <code className="text-xs break-all block text-gray-800">
                    {formatted}
                  </code>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  📋 Copy to Clipboard
                </button>
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                    Next Steps:
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800">
                    <li>Go to <a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer" className="underline">Netlify Dashboard</a></li>
                    <li>Select your site → Site settings → Environment variables</li>
                    <li>Click "Add a variable"</li>
                    <li>Key: <code className="bg-blue-100 px-1 rounded">DATABASE_URL</code></li>
                    <li>Value: Paste the connection string above</li>
                    <li>Click "Save"</li>
                    <li>Go to Deploys → Trigger deploy → Deploy site</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <a
                href="/configure"
                className="text-primary hover:text-secondary transition-colors"
              >
                ← Back to Configuration
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

