'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const firstName = 'there'
  const [twitterConnected, setTwitterConnected] = useState(false)

  useEffect(() => {
    fetch('/api/auth/twitter/status')
      .then(r => r.json())
      .then(d => setTwitterConnected(d.connected))
  }, [])

  return (
    <div>
      <div className="welcome-header">
        <h2>Welcome back, {firstName}! 👋</h2>
        <p>Here&apos;s your social media overview</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Total Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">AI Generated</div>
        </div>
        <div className="stat-card">
          {twitterConnected ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
              ✓ Connected
            </div>
          ) : (
            <Link href="/dashboard/connections" className="connect-btn">Connect X</Link>
          )}
          <div className="stat-label" style={{ marginTop: '8px' }}>Twitter Status</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="section-title">Quick Actions</h3>
      <div className="actions-grid">
        <Link href="/dashboard/compose" className="action-card">
          <span className="action-icon">✍️</span>
          <div className="action-title">Compose Post</div>
          <div className="action-desc">Write and publish a new tweet</div>
        </Link>
        <Link href="/dashboard/schedule" className="action-card">
          <span className="action-icon">📅</span>
          <div className="action-title">Schedule Post</div>
          <div className="action-desc">Plan your content for later</div>
        </Link>
        <Link href="/dashboard/connections" className="action-card">
          <span className="action-icon">🔗</span>
          <div className="action-title">Connect X</div>
          <div className="action-desc">Link your Twitter account</div>
        </Link>
        <Link href="/dashboard/ai" className="action-card">
          <span className="action-icon">🤖</span>
          <div className="action-title">AI Generate</div>
          <div className="action-desc">Let AI write your content</div>
        </Link>
      </div>

      {/* Recent Posts */}
      <h3 className="section-title">Recent Posts</h3>
      <div className="empty-state">
        No posts yet. Connect your Twitter account to get started!
      </div>
    </div>
  )
}
