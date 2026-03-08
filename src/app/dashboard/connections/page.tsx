'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ConnectionsPage() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const status = searchParams.get('connected')
    if (status === 'true') {
      setConnected(true)
    }
  }, [searchParams])

  return (
    <div className="connections-page">
      <h1>Connections</h1>
      <p className="subtitle">Manage your connected accounts</p>

      <div className="connection-card">
        <div className="connection-header">
          <span className="connection-icon">𝕏</span>
          <div className="connection-info">
            <h3>X (Twitter)</h3>
            <p>Post tweets and schedule content</p>
          </div>
        </div>

        {connected ? (
          <div className="connected-badge">
            ✓ Connected
          </div>
        ) : (
          <a href="/api/auth/twitter" className="connect-button">
            Connect X Account
          </a>
        )}
      </div>
    </div>
  )
}
