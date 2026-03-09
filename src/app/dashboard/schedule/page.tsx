'use client'

import { useState, useEffect } from 'react'

interface ScheduledPost {
  id: string
  content: string
  scheduled_for: string
  status: 'pending' | 'posted' | 'failed'
  tweet_id?: string
}

export default function SchedulePage() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tweets/scheduled')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setScheduledPosts(data.posts || [])
        }
      })
      .catch(() => setError('Failed to load scheduled posts'))
      .finally(() => setLoading(false))
  }, [])

  const statusBadge = (status: ScheduledPost['status']) => {
    const map = {
      pending: { label: '⏳ Pending', color: '#f59e0b' },
      posted: { label: '✅ Posted', color: '#10b981' },
      failed: { label: '❌ Failed', color: '#ef4444' },
    }
    const s = map[status]
    return (
      <span style={{ color: s.color, fontWeight: 600, fontSize: '0.85rem' }}>
        {s.label}
      </span>
    )
  }

  return (
    <div className="schedule-page">
      <h1>Scheduled Posts</h1>
      <p className="subtitle">View and manage your scheduled content</p>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#ef4444' }}>Error: {error}</p>
        </div>
      ) : scheduledPosts.length === 0 ? (
        <div className="empty-state">
          <p>No scheduled posts yet.</p>
          <a href="/dashboard/compose" className="schedule-link">
            Schedule a new post →
          </a>
        </div>
      ) : (
        <div className="scheduled-list">
          {scheduledPosts.map((post) => (
            <div key={post.id} className="scheduled-card">
              <p className="scheduled-content">{post.content}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <p className="scheduled-time">
                  📅 {new Date(post.scheduled_for).toLocaleString()}
                </p>
                {statusBadge(post.status)}
              </div>
              {post.tweet_id && (
                <a
                  href={`https://x.com/i/web/status/${post.tweet_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: '#60a5fa' }}
                >
                  View on X →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
