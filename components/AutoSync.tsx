'use client'

import { useEffect, useState } from 'react'

export default function AutoSync({ hasShiurim }: { hasShiurim: boolean }) {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    // Only sync if no shiurim are found and we haven't synced yet
    if (!hasShiurim && !synced && !syncing) {
      setSyncing(true)
      
      // Trigger RSS sync
      fetch('/api/rss/sync', { method: 'GET' })
        .then(async (response) => {
          const data = await response.json()
          console.log('Auto-sync result:', data)
          
          if (data.success && data.synced > 0) {
            setSynced(true)
            // Reload page after a short delay to show new shiurim
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            setSyncing(false)
            console.error('Auto-sync failed:', data)
          }
        })
        .catch((error) => {
          console.error('Auto-sync error:', error)
          setSyncing(false)
        })
    }
  }, [hasShiurim, synced, syncing])

  if (!hasShiurim && syncing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          🔄 Automatically syncing shiurim from RSS feed... This may take a minute.
        </p>
      </div>
    )
  }

  return null
}

