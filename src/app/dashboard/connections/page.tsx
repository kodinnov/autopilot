'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ConnectionsPage() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Check URL param first
    if (searchParams.get('connected') === 'true') {
      setConnected(true)
    }
    // Always verify with server
    fetch('/api/auth/twitter/status')
      .then(r => r.json())
      .then(data => setConnected(data.connected))
  }, [searchParams])

  return (
    <div>
      <div className="welcome-header">
        <h2>Connections</h2>
        <p>Manage your connected social accounts</p>
      </div>

      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '560px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: '#000',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: '900',
            color: '#fff',
            flexShrink: 0,
          }}>𝕏</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '17px', marginBottom: '4px' }}>X (Twitter)</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Post tweets and schedule content</div>
          </div>
        </div>

        {connected ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            flexShrink: 0,
          }}>
            ✓ Connected
          </div>
        ) : (
          <a href="/api/auth/twitter" style={{
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            flexShrink: 0,
            transition: 'opacity 0.2s',
          }}>
            Connect X
          </a>
        )}
      </div>

      <div style={{
        marginTop: '16px',
        color: 'rgba(255,255,255,0.25)',
        fontSize: '12px',
        maxWidth: '560px',
      }}>
        🔒 Your tokens are stored securely and never shared with third parties.
      </div>

      {/* Coming soon */}
      <div style={{ marginTop: '32px' }}>
        <h3 className="section-title">Coming Soon</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {['Instagram', 'LinkedIn', 'TikTok', 'YouTube'].map(platform => (
            <div key={platform} style={{
              background: '#1a1030',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '20px 28px',
              color: 'rgba(255,255,255,0.25)',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              {platform}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
