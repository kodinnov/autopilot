'use client'

import { useState, useEffect } from 'react'

interface ScheduledPost {
  id: string
  content: string
  scheduledFor: string
}

export default function SchedulePage() {
  const [scheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)

  // In MVP, just show empty state
  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="schedule-page">
      <h1>Scheduled Posts</h1>
      <p className="subtitle">View and manage your scheduled content</p>

      {loading ? (
        <p>Loading...</p>
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
              <p className="scheduled-time">
                Scheduled for: {new Date(post.scheduledFor).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
