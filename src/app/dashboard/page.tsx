'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ScheduledPost {
  id: number
  content: string
  platform: string
  scheduled_for: string
}

export default function DashboardPage() {
  const [twitterConnected, setTwitterConnected] = useState(false)
  const [scheduledCount, setScheduledCount] = useState(0)
  const [recentPosts, setRecentPosts] = useState<ScheduledPost[]>([])

  useEffect(() => {
    fetch('/api/auth/twitter/status')
      .then(r => r.json())
      .then(d => setTwitterConnected(d.connected))

    fetch('/api/tweets/scheduled')
      .then(r => r.json())
      .then(d => {
        const posts = d.scheduledTweets || []
        setScheduledCount(posts.length)
        setRecentPosts(posts.slice(0, 3))
      })
      .catch(() => {})
  }, [])

  const PLATFORM_ICONS: Record<string, string> = {
    twitter: '𝕏',
    instagram: '📸',
    linkedin: '💼',
    tiktok: '🎵',
    youtube: '▶️',
    facebook: '👥',
  }

  const AI_SERVICES = [
    { icon: '🤖', label: 'xAI Grok', status: 'Active' },
    { icon: '🎙️', label: 'ElevenLabs', status: 'Active' },
    { icon: '🎬', label: 'Shotstack', status: 'Active' },
    { icon: '🎨', label: 'Ideogram', status: 'Active' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
          📊 Dashboard
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>
          Your personal brand autopilot
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Scheduled</p>
          <p style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>{scheduledCount}</p>
        </div>
        <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>AI Services</p>
          <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>4</p>
        </div>
        <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>X Account</p>
          <p style={{ color: twitterConnected ? '#22c55e' : '#f59e0b', fontSize: '14px', fontWeight: 700, margin: '8px 0 0' }}>
            {twitterConnected ? '✓ @kodi_ai' : '⚠ Not connected'}
          </p>
        </div>
        <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Platforms</p>
          <p style={{ color: '#a855f7', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>6</p>
        </div>
      </div>

      {/* AI Services */}
      <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 14px' }}>
        AI Services
      </h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {AI_SERVICES.map(s => (
          <div key={s.label} style={{
            background: '#1a1030',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>{s.icon}</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{s.label}</span>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.6)',
            }} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 14px' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {[
          { href: '/dashboard/compose', icon: '✍️', title: 'Compose', desc: 'Write a new post' },
          { href: '/dashboard/schedule', icon: '📅', title: 'Schedule', desc: 'Plan your content' },
          { href: '/dashboard/camera-roll', icon: '📸', title: 'Camera Roll', desc: 'Batch upload & caption' },
          { href: '/dashboard/video-studio', icon: '🎬', title: 'Video Studio', desc: 'AI video stories' },
          { href: '/dashboard/ai', icon: '🤖', title: 'AI Writer', desc: 'Generate content' },
          { href: '/dashboard/usage', icon: '📈', title: 'Usage', desc: 'View your stats' },
        ].map(action => (
          <Link key={action.href} href={action.href} style={{
            background: '#1a1030',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px 16px',
            textDecoration: 'none',
            display: 'block',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>{action.icon}</span>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>{action.title}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0' }}>{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent scheduled posts */}
      {recentPosts.length > 0 && (
        <>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 14px' }}>
            Upcoming Posts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentPosts.map(post => (
              <div key={post.id} style={{
                background: '#1a1030',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <span style={{ fontSize: '20px' }}>{PLATFORM_ICONS[post.platform] || '📝'}</span>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.content}
                </p>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', flexShrink: 0 }}>
                  {new Date(post.scheduled_for).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {recentPosts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.25)', fontSize: '14px', background: '#1a1030', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          No scheduled posts yet. Use Camera Roll or Compose to get started!
        </div>
      )}
    </div>
  )
}
