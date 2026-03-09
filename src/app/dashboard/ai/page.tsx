'use client'

import { useState } from 'react'

const tones = [
  { value: 'professional', label: '💼 Professional', desc: 'Formal and authoritative' },
  { value: 'casual', label: '😊 Casual', desc: 'Relaxed and friendly' },
  { value: 'humorous', label: '😄 Humorous', desc: 'Funny and entertaining' },
  { value: 'inspirational', label: '🔥 Inspirational', desc: 'Motivating and uplifting' },
  { value: 'educational', label: '🎓 Educational', desc: 'Informative and clear' },
]

export default function AIGeneratePage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('casual')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const generate = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone }),
      })
      const data = await res.json()
      if (data.success) setSuggestions(data.suggestions)
    } catch (e) {
      console.error(e)
    }
    setIsGenerating(false)
  }

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="welcome-header">
        <h2>AI Writer 🤖</h2>
        <p>Let Grok generate tweet ideas for you</p>
      </div>

      {/* Input */}
      <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', maxWidth: '640px', marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          What do you want to tweet about?
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="e.g. AI tools for founders, productivity tips, my morning routine..."
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', color: '#fff', padding: '14px 16px', fontSize: '15px',
            outline: 'none', boxSizing: 'border-box', marginBottom: '20px',
          }}
        />

        <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tone
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {tones.map(t => (
            <button key={t.value} onClick={() => setTone(t.value)} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
              background: tone === t.value ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.06)',
              color: tone === t.value ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        <button onClick={generate} disabled={!topic.trim() || isGenerating} style={{
          width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: !topic.trim() || isGenerating ? 'not-allowed' : 'pointer',
          background: !topic.trim() || isGenerating ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
          color: '#fff', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s',
        }}>
          {isGenerating ? '✨ Generating...' : '✨ Generate Tweets'}
        </button>
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <div style={{ maxWidth: '640px' }}>
          <h3 className="section-title">Generated Tweets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: '1.6', color: '#fff' }}>{s}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => copy(s, i)} style={{
                    padding: '7px 18px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                  }}>
                    {copied === i ? '✓ Copied' : 'Copy'}
                  </button>
                  <button onClick={() => window.location.href = `/dashboard/compose?content=${encodeURIComponent(s)}`} style={{
                    padding: '7px 18px', borderRadius: '20px', border: 'none',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                  }}>
                    🚀 Use in Compose
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
