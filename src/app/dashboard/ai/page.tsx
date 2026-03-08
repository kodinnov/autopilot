'use client'

import { useState } from 'react'

export default function AIGeneratePage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone }),
      })
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.suggestions)
      }
    } catch (e) {
      console.error(e)
    }
    setIsGenerating(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="ai-page">
      <h1>AI Content Generator</h1>
      <p className="subtitle">Let AI create engaging content for your audience</p>

      <div className="ai-form">
        <div className="form-group">
          <label>What do you want to post about?</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., My thoughts on AI, productivity tips, new product launch..."
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="form-select">
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="humorous">Humorous</option>
            <option value="inspirational">Inspirational</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        <button onClick={generate} disabled={!topic.trim() || isGenerating} className="generate-button">
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h2>Suggested Posts</h2>
          {suggestions.map((suggestion, i) => (
            <div key={i} className="suggestion-card">
              <p>{suggestion}</p>
              <div className="suggestion-actions">
                <button onClick={() => copyToClipboard(suggestion)} className="copy-btn">
                  Copy
                </button>
                <button 
                  onClick={() => {
                    // Navigate to compose with this content
                    window.location.href = `/dashboard/compose?content=${encodeURIComponent(suggestion)}`
                  }}
                  className="use-btn"
                >
                  Use in Compose
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
