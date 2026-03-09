'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tweets/scheduled')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setScheduledPosts(data.posts || [])
      })
      .catch(() => setError('Failed to load scheduled posts'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/tweets/scheduled/${id}`, { method: 'DELETE' })
      if (res.ok) setScheduledPosts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const statusStyle = (status: ScheduledPost['status']) => {
    const map = {
      pending:  { label: '⏳ Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      posted:   { label: '✅ Posted',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      failed:   { label: '❌ Failed',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    }
    return map[status]
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Scheduled Posts</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>
            View and manage your scheduled content
          </p>
        </div>
        <Link href="/dashboard/compose" style={{
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          color: '#fff',
          border: 'none',
          borderRadius: '20px',
          padding: '10px 22px',
          fontSize: '14px',
          fontWeight: 700,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}>
          ✏️ New Post
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '15px',
        }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '16px',
          padding: '24px',
          color: '#f87171',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          ⚠️ {error}
        </div>
      ) : scheduledPosts.length === 0 ? (
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '640px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>
            No scheduled posts yet
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: '0 0 24px' }}>
            Schedule your first tweet and it will appear here
          </p>
          <Link href="/dashboard/compose" style={{
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '20px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'inline-block',
          }}>
            📅 Schedule a post →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '720px' }}>
          {scheduledPosts.map((post) => {
            const s = statusStyle(post.status)
            return (
              <div key={post.id} style={{
                background: '#1a1030',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}>
                <p style={{ color: '#fff', fontSize: '15px', lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
                    📅 {new Date(post.scheduled_for).toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      background: s.bg,
                      color: s.color,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {s.label}
                    </span>
                    {post.tweet_id && (
                      <a href={`https://x.com/i/web/status/${post.tweet_id}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
                        View on X →
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        color: deleting === post.id ? 'rgba(239,68,68,0.4)' : '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: deleting === post.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deleting === post.id ? '...' : '🗑 Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
