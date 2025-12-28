'use client'

import { useEffect, useState } from 'react'

export default function AutoSync({ hasShiurim }: { hasShiurim: boolean }) {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<any>(null)

  useEffect(() => {
    // Only sync once if no shiurim are found
    if (!hasShiurim && !synced && !syncing && !error) {
      setSyncing(true)
      setError(null)
      
      console.log('🔄 Starting auto-sync...')
      
      // Trigger RSS sync
      fetch('/api/rss/sync', { method: 'GET' })
        .then(async (response) => {
          const data = await response.json()
          console.log('Auto-sync result:', data)
          setSyncResult(data)
          
          if (data.success && data.synced > 0) {
            setSynced(true)
            setSyncing(false)
            // Reload page after a short delay to show new shiurim
            setTimeout(() => {
              window.location.reload()
            }, 3000)
          } else if (data.error) {
            setError(data.error)
            setSyncing(false)
            setSynced(true) // Mark as attempted so we don't retry
          } else {
            // Sync completed but no items synced - might be database issue
            setError(data.message || 'Sync completed but no shiurim were added. Check server logs for details.')
            setSyncing(false)
            setSynced(true) // Mark as attempted so we don't retry
          }
        })
        .catch((error) => {
          console.error('Auto-sync error:', error)
          setError(`Failed to sync: ${error.message || 'Network error'}`)
          setSyncing(false)
          setSynced(true) // Mark as attempted so we don't retry
        })
    }
  }, [hasShiurim, synced, syncing, error])

  if (!hasShiurim && syncing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm font-medium mb-2">
          🔄 Automatically syncing shiurim from RSS feed...
        </p>
        <p className="text-blue-600 text-xs">
          This may take a minute. Please wait...
        </p>
      </div>
    )
  }

  if (!hasShiurim && error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-800 text-sm font-medium mb-2">
          ❌ Auto-sync failed
        </p>
        <p className="text-red-600 text-xs mb-3">
          {error}
        </p>
        {syncResult && (
          <div className="text-xs text-red-600 mb-3">
            <p>Total items: {syncResult.total || 0}</p>
            <p>Synced: {syncResult.synced || 0}</p>
            <p>Errors: {syncResult.errors || 0}</p>
            {syncResult.errorDetails && syncResult.errorDetails.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(syncResult.errorDetails.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        <a
          href="/api/rss/sync"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-red-700 hover:text-red-900 underline"
        >
          Try manual sync →
        </a>
      </div>
    )
  }

  return null
}

