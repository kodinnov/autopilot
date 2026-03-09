'use client'

import { useState, useCallback } from 'react'

const PLATFORMS = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'youtube']
const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏', instagram: '📷', linkedin: '💼', tiktok: '🎵', facebook: '📘', youtube: '▶️'
}

interface FileItem {
  id: string
  file: File
  previewUrl: string
  base64?: string
  mimeType: string
  // EXIF
  location?: string
  date?: string
  // AI scores
  score?: number
  lighting?: number
  sharpness?: number
  composition?: number
  faces?: boolean
  contentType?: string
  // State
  scoring?: boolean
  selected: boolean
  // Captions
  captions?: Record<string, string>
}

type Step = 'upload' | 'review' | 'captions' | 'confirm' | 'done'

const STEP_LABELS: Record<Step, string> = {
  upload: '1. Upload',
  review: '2. Review',
  captions: '3. Captions',
  confirm: '4. Schedule',
  done: '✅ Done',
}

export default function CameraRollPage() {
  const [step, setStep] = useState<Step>('upload')
  const [files, setFiles] = useState<FileItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'instagram'])
  const [scheduledCount, setScheduledCount] = useState(0)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // strip data:...;base64,
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFiles = useCallback(async (rawFiles: FileList | File[]) => {
    const arr = Array.from(rawFiles).slice(0, 100)
    const items: FileItem[] = arr.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      mimeType: f.type || 'image/jpeg',
      selected: false,
    }))
    setFiles(items)
    setStep('review')
    setProcessing(true)
    setProgress(0)

    // Load exifr lazily
    let exifr: typeof import('exifr') | null = null
    try { exifr = await import('exifr') } catch { /* no exif */ }

    const scored: FileItem[] = []

    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i] }
      setStatusMsg(`Analysing ${i + 1} / ${items.length}…`)

      // EXIF
      if (exifr && item.file.type.startsWith('image/')) {
        try {
          const exif = await exifr.parse(item.file, { gps: true, tiff: true }) as Record<string, unknown>
          if (exif?.GPSLatitude && exif?.GPSLongitude) {
            const lat = exif.GPSLatitude as number
            const lon = exif.GPSLongitude as number
            try {
              const geo = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
              ).then(r => r.json())
              item.location = geo?.address?.city || geo?.address?.town || geo?.address?.village || geo?.display_name?.split(',')[0]
            } catch { /* no geo */ }
          }
          if (exif?.DateTimeOriginal) {
            const d = new Date(exif.DateTimeOriginal as string)
            item.date = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          }
        } catch { /* no exif */ }
      }

      // Base64 for AI (resize to save bandwidth — use canvas)
      try {
        if (item.file.type.startsWith('image/')) {
          item.base64 = await toBase64(item.file)
          // AI score
          const res = await fetch('/api/camera-roll/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: item.base64, mimeType: item.mimeType }),
          })
          if (res.ok) {
            const s = await res.json()
            item.score = s.overall ?? 70
            item.lighting = s.lighting
            item.sharpness = s.sharpness
            item.composition = s.composition
            item.faces = s.faces
            item.contentType = s.contentType
          }
        } else {
          // Video — default score
          item.score = 70
          item.contentType = 'other'
        }
      } catch { item.score = 70 }

      scored.push(item)
      setProgress(Math.round(((i + 1) / items.length) * 100))
      setFiles([...scored, ...items.slice(i + 1)])
    }

    // Auto-select top 10
    const sorted = [...scored].sort((a, b) => (b.score || 0) - (a.score || 0))
    const top10Ids = new Set(sorted.slice(0, 10).map(f => f.id))
    const finalFiles = scored.map(f => ({ ...f, selected: top10Ids.has(f.id) }))
    setFiles(finalFiles)
    setProcessing(false)
    setStatusMsg('')
  }, [])

  const addFromUrl = async () => {
    const url = urlInput.trim()
    if (!url) return
    setUrlError('')
    setUrlLoading(true)
    try {
      // Detect type from URL or content-type
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || ''
      const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext)
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg'

      // Fetch as blob to create a File object
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
      const blob = await response.blob()
      const actualMime = blob.type || mimeType
      const fileName = url.split('/').pop()?.split('?')[0] || `url-media-${Date.now()}.jpg`
      const file = new File([blob], fileName, { type: actualMime })

      setUrlInput('')
      await handleFiles([file])
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'Failed to load URL')
    } finally {
      setUrlLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f))
  }

  const selectedFiles = files.filter(f => f.selected)

  const generateCaptions = async () => {
    setProcessing(true)
    setStatusMsg('Generating captions…')
    const updated = [...selectedFiles]
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i]
      setStatusMsg(`Generating captions ${i + 1} / ${updated.length}…`)
      try {
        const res = await fetch('/api/camera-roll/captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: item.location,
            date: item.date,
            contentType: item.contentType,
            platforms: selectedPlatforms,
            imageBase64: item.base64,
            mimeType: item.mimeType,
          }),
        })
        if (res.ok) {
          const captions = await res.json()
          updated[i] = { ...item, captions }
          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, captions } : f))
        }
      } catch { /* keep going */ }
    }
    setProcessing(false)
    setStatusMsg('')
    setStep('captions')
  }

  const updateCaption = (fileId: string, platform: string, value: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, captions: { ...f.captions, [platform]: value } } : f
    ))
  }

  const scheduleAll = async () => {
    setProcessing(true)
    setStatusMsg('Scheduling posts…')

    const sel = files.filter(f => f.selected)
    let dayOffset = 0
    const items: { imageUrl: string; platform: string; caption: string; dayOffset: number }[] = []

    for (let i = 0; i < sel.length; i++) {
      const f = sel[i]
      for (const platform of selectedPlatforms) {
        items.push({
          imageUrl: f.previewUrl, // In production, this would be the Vercel Blob URL
          platform,
          caption: f.captions?.[platform] || `Check out this ${f.contentType || 'photo'}!`,
          dayOffset: dayOffset++,
        })
      }
    }

    try {
      const res = await fetch('/api/camera-roll/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.success) {
        setScheduledCount(data.count)
        setStep('done')
      }
    } catch (e) {
      console.error(e)
    }
    setProcessing(false)
    setStatusMsg('')
  }

  const scoreColor = (s?: number) => {
    if (!s) return '#6b7280'
    if (s >= 80) return '#10b981'
    if (s >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>📸 Camera Roll</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>
          Upload up to 100 photos — AI picks the best 10 and schedules them automatically
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {(Object.keys(STEP_LABELS) as Step[]).map(s => (
          <div key={s} style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: step === s ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.05)',
            color: step === s ? '#fff' : 'rgba(255,255,255,0.3)',
          }}>
            {STEP_LABELS[s]}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && (
        <div>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          style={{
            background: '#1a1030',
            border: '2px dashed rgba(168,85,247,0.3)',
            borderRadius: '24px',
            padding: '80px 40px',
            textAlign: 'center',
            maxWidth: '640px',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📸</div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
            Drop your photos & videos here
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px' }}>
            JPG, PNG, WEBP, HEIC, MP4, MOV · Up to 100 files
          </p>
          <div style={{
            background: 'linear-gradient(135deg,#a855f7,#6366f1)',
            color: '#fff',
            borderRadius: '20px',
            padding: '12px 28px',
            display: 'inline-block',
            fontWeight: 700,
            fontSize: '14px',
          }}>
            Browse Files
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files) handleFiles(e.target.files) }}
          />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '640px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* URL input */}
        <div style={{ maxWidth: '640px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, margin: '0 0 10px' }}>
            🔗 Add from URL
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
              onKeyDown={e => { if (e.key === 'Enter') addFromUrl() }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${urlError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                padding: '11px 16px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={addFromUrl}
              disabled={urlLoading || !urlInput.trim()}
              style={{
                background: urlInput.trim() ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.06)',
                color: '#fff', border: 'none', borderRadius: '12px',
                padding: '11px 20px', fontSize: '14px', fontWeight: 700,
                cursor: urlInput.trim() && !urlLoading ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              {urlLoading ? '…' : '+ Add'}
            </button>
          </div>
          {urlError && <p style={{ color: '#f87171', fontSize: '12px', margin: '6px 0 0' }}>⚠️ {urlError}</p>}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '6px 0 0' }}>
            Supports direct image/video URLs (jpg, png, webp, mp4, etc.)
          </p>
        </div>
        </div>
      )}

      {/* ── STEP 2: Review ── */}
      {step === 'review' && (
        <div>
          {processing && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{statusMsg}</span>
                <span style={{ color: '#a855f7', fontSize: '14px', fontWeight: 700 }}>{progress}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', height: '6px' }}>
                <div style={{ background: 'linear-gradient(90deg,#a855f7,#6366f1)', width: `${progress}%`, height: '100%', borderRadius: '8px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px', marginBottom: '24px' }}>
            {files.map(f => (
              <div
                key={f.id}
                onClick={() => toggleSelect(f.id)}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: f.selected ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  position: 'relative',
                  background: '#1a1030',
                }}
              >
                <img src={f.previewUrl} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                {f.score !== undefined && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: scoreColor(f.score),
                    color: '#fff', borderRadius: '12px',
                    padding: '2px 8px', fontSize: '12px', fontWeight: 800,
                  }}>
                    {f.score}
                  </div>
                )}
                {f.selected && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: '#10b981', borderRadius: '50%',
                    width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800, color: '#fff',
                  }}>✓</div>
                )}
                {f.location && (
                  <div style={{ padding: '4px 8px', fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    📍 {f.location}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Platform selector */}
          <div style={{ background: '#1a1030', borderRadius: '16px', padding: '20px', marginBottom: '20px', maxWidth: '640px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>Publish to:</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setSelectedPlatforms(prev =>
                  prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                )} style={{
                  background: selectedPlatforms.includes(p) ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.06)',
                  color: selectedPlatforms.includes(p) ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: 'none', borderRadius: '20px',
                  padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                  {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {!processing && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={generateCaptions}
                disabled={selectedFiles.length === 0 || selectedPlatforms.length === 0}
                style={{
                  background: selectedFiles.length > 0 ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.1)',
                  color: '#fff', border: 'none', borderRadius: '20px',
                  padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: selectedFiles.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                ✨ Generate Captions ({selectedFiles.length} selected)
              </button>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                {files.length} files · Top 10 auto-selected
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Captions ── */}
      {step === 'captions' && (
        <div>
          {processing && <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>{statusMsg}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            {selectedFiles.map((f, idx) => (
              <div key={f.id} style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
                {/* Image + meta header */}
                <div style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src={f.previewUrl} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 4px', fontSize: '14px' }}>
                      Post {idx + 1} · Day {idx + 1}
                    </p>
                    {f.location && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 2px' }}>📍 {f.location}</p>}
                    {f.date && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>📅 {f.date}</p>}
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0' }}>
                      Score: {f.score} · {f.contentType} {f.faces ? '· 👤 faces' : ''}
                    </p>
                  </div>
                </div>

                {/* Captions per platform */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedPlatforms.map(p => (
                    <div key={p}>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                        {PLATFORM_ICONS[p]} {p}
                      </label>
                      <textarea
                        value={f.captions?.[p] || ''}
                        onChange={e => updateCaption(f.id, p, e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: '13px',
                          resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep('review')} style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer',
            }}>
              ← Back
            </button>
            <button onClick={() => setStep('confirm')} style={{
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              color: '#fff', border: 'none', borderRadius: '20px',
              padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}>
              📅 Preview Schedule →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Confirm ── */}
      {step === 'confirm' && (
        <div style={{ maxWidth: '640px' }}>
          <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 20px' }}>
              📅 Schedule Preview
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedFiles.map((f, idx) => {
                const postDate = new Date()
                postDate.setDate(postDate.getDate() + idx)
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={f.previewUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontSize: '13px', margin: 0, fontWeight: 600 }}>
                        Day {idx + 1} · {postDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                        {selectedPlatforms.map(p => PLATFORM_ICONS[p]).join(' ')}
                      </p>
                    </div>
                    <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700 }}>Score {f.score}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#c084fc', fontSize: '14px', margin: 0 }}>
              🚀 <strong>{selectedFiles.length * selectedPlatforms.length} posts</strong> will be scheduled across <strong>{selectedFiles.length} days</strong> on <strong>{selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep('captions')} style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer',
            }}>
              ← Back
            </button>
            <button onClick={scheduleAll} disabled={processing} style={{
              background: processing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#a855f7,#6366f1)',
              color: '#fff', border: 'none', borderRadius: '20px',
              padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
            }}>
              {processing ? statusMsg || 'Scheduling…' : `🚀 Schedule ${selectedFiles.length * selectedPlatforms.length} Posts`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Done ── */}
      {step === 'done' && (
        <div style={{
          background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px', padding: '60px 40px', maxWidth: '500px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>
            You&apos;re all set!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', margin: '0 0 8px' }}>
            <strong style={{ color: '#10b981' }}>{scheduledCount} posts</strong> have been scheduled
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '0 0 32px' }}>
            Autopilot will post them automatically at the optimal time for each platform.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/dashboard/schedule" style={{
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              color: '#fff', textDecoration: 'none',
              borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: 700,
            }}>
              View Schedule →
            </a>
            <button onClick={() => { setStep('upload'); setFiles([]) }} style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer',
            }}>
              Upload More
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
