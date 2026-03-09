'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ComposeForm() {
  const searchParams = useSearchParams()
  const [content, setContent] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const contentParam = searchParams.get('content')
    if (contentParam) {
      setContent(decodeURIComponent(contentParam))
    }
  }, [searchParams])

  const handlePost = async () => {
    if (!content.trim()) return
    setIsPosting(true)
    try {
      const res = await fetch('/api/tweets/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, scheduledAt: scheduled || null }),
      })
      if (res.ok) {
        setContent('')
        setScheduled('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to post tweet')
        setTimeout(() => setError(''), 4000)
      }
    } catch {
      setError('Error posting tweet')
      setTimeout(() => setError(''), 4000)
    }
    setIsPosting(false)
  }

  const charCount = content.length
  const maxChars = 280
  const isOver = charCount > maxChars
  const pct = Math.min((charCount / maxChars) * 100, 100)

  return (
    <div>
      <div className="welcome-header">
        <h2>Compose Tweet</h2>
        <p>Write and publish your content</p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', padding: '14px 20px', borderRadius: '12px',
          marginBottom: '24px', fontSize: '14px', fontWeight: '600',
        }}>⚠️ {error}</div>
      )}

      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e',
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          ✓ {scheduled ? 'Tweet scheduled!' : 'Tweet posted successfully!'}
        </div>
      )}

      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '640px',
      }}>
        {/* Avatar + Textarea */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            flexShrink: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px',
          }}>✍️</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxChars + 10))}
            placeholder="What's happening?"
            rows={5}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '17px', lineHeight: '1.6', resize: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Char ring */}
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
              <circle cx="16" cy="16" r="13" fill="none"
                stroke={isOver ? '#ef4444' : charCount > 240 ? '#f59e0b' : '#a855f7'}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 13}`}
                strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 16 16)"
              />
            </svg>
            {charCount > 240 && (
              <span style={{ fontSize: '13px', color: isOver ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                {maxChars - charCount}
              </span>
            )}

            {/* Schedule */}
            <div style={{ position: 'relative' }}>
              <input
                type="datetime-local"
                value={scheduled}
                min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                onChange={(e) => setScheduled(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${scheduled ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px', color: scheduled ? '#fff' : 'rgba(255,255,255,0.4)',
                  padding: '8px 14px', fontSize: '13px', outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          <button
            onClick={handlePost}
            disabled={!content.trim() || isOver || isPosting}
            style={{
              background: !content.trim() || isOver || isPosting
                ? 'rgba(168,85,247,0.3)'
                : 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: '#fff', border: 'none', borderRadius: '20px',
              padding: '10px 28px', fontSize: '15px', fontWeight: '700',
              cursor: !content.trim() || isOver || isPosting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isPosting ? 'Posting...' : scheduled ? '📅 Schedule' : '🚀 Post Now'}
          </button>
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '12px' }}>
        💡 Use the AI Writer to generate tweet ideas first
      </p>
    </div>
  )
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComposeForm />
    </Suspense>
  )
}
