'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ComposeForm() {
  const searchParams = useSearchParams()
  const [content, setContent] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    const contentParam = searchParams.get('content')
    if (contentParam) {
      setContent(decodeURIComponent(contentParam))
    }
  }, [searchParams])

  const handlePost = async () => {
    if (!content.trim()) return
    setIsPosting(true)
    // API call to post tweet
    try {
      const res = await fetch('/api/tweets/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          scheduledAt: scheduled || null 
        }),
      })
      if (res.ok) {
        setContent('')
        setScheduled('')
        alert('Tweet posted successfully!')
      } else {
        alert('Failed to post tweet')
      }
    } catch {
      alert('Error posting tweet')
    }
    setIsPosting(false)
  }

  const charCount = content.length
  const maxChars = 280

  return (
    <div className="compose-page">
      <h1>Compose Tweet</h1>
      <p className="subtitle">Write and publish your tweet</p>

      <div className="compose-form">
        <div className="compose-input-area">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
            placeholder="What's happening?"
            className="compose-textarea"
            rows={5}
          />
          <div className="char-count" data-over={charCount > maxChars}>
            {charCount}/{maxChars}
          </div>
        </div>

        <div className="compose-options">
          <label className="schedule-label">
            <span>Schedule for later (optional)</span>
            <input 
              type="datetime-local" 
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className="schedule-input"
            />
          </label>
        </div>

        <button 
          onClick={handlePost}
          disabled={!content.trim() || charCount > maxChars || isPosting}
          className="post-button"
        >
          {isPosting ? 'Posting...' : scheduled ? 'Schedule Tweet' : 'Post Now'}
        </button>
      </div>
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
