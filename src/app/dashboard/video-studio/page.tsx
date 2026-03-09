'use client'

import { useState, useRef, useCallback } from 'react'

type Step = 'upload' | 'analyzing' | 'preview' | 'voice' | 'render' | 'done'

interface VideoFile {
  id: string
  file: File
  url: string
  duration: number
}

interface FrameAnalysis {
  timestamp: number
  rating: string
  score: number
  faces: boolean
  action: boolean
  emotion: string
  speech: boolean
  description: string
  selected: boolean
  base64?: string
}

const STEP_LABELS: Record<Step, string> = {
  upload: '1. Upload',
  analyzing: '2. Analyzing',
  preview: '3. Preview',
  voice: '4. Voice',
  render: '5. Render',
  done: '✅ Done',
}

const TONES = [
  { id: 'energetic', label: '⚡ Energetic', desc: 'Upbeat and exciting' },
  { id: 'calm', label: '🌊 Calm', desc: 'Relaxed and peaceful' },
  { id: 'storytelling', label: '📖 Storytelling', desc: 'Personal narrative' },
  { id: 'professional', label: '💼 Professional', desc: 'Clear and polished' },
]

const VOICES = [
  { id: 'rachel', label: 'Rachel', desc: 'Natural, clear (female)' },
  { id: 'adam', label: 'Adam', desc: 'Deep, warm (male)' },
  { id: 'bella', label: 'Bella', desc: 'Soft, calm (female)' },
  { id: 'josh', label: 'Josh', desc: 'Young, energetic (male)' },
]

export default function VideoStudioPage() {
  const [step, setStep] = useState<Step>('upload')
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [frames, setFrames] = useState<FrameAnalysis[]>([])
  const [script, setScript] = useState('')
  const [tone, setTone] = useState('energetic')
  const [voice, setVoice] = useState('rachel')
  const [voiceoverUrl, setVoiceoverUrl] = useState('')
  const [finalVideoUrl, setFinalVideoUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Extract frames from video using canvas
  const extractFrames = useCallback(async (video: HTMLVideoElement, file: File): Promise<{ timestamp: number; base64: string }[]> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const duration = video.duration
    const frameInterval = 2 // Extract every 2 seconds
    const frames: { timestamp: number; base64: string }[] = []

    canvas.width = 640
    canvas.height = 360

    for (let t = 0; t < duration; t += frameInterval) {
      video.currentTime = t
      await new Promise(resolve => { video.onseeked = resolve })
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
      frames.push({ timestamp: t, base64 })
    }

    return frames
  }, [])

  const handleUpload = useCallback(async (rawFiles: FileList | File[]) => {
    const arr = Array.from(rawFiles).slice(0, 5)
    const videoFiles: VideoFile[] = []

    for (const file of arr) {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.src = url
      video.muted = true
      await new Promise<void>(resolve => { video.onloadedmetadata = () => resolve() })
      videoFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        url,
        duration: video.duration,
      })
    }

    setVideos(videoFiles)
    setStep('analyzing')
    setStatusMsg('Extracting frames from videos...')
    setProgress(0)

    // Extract and analyze frames
    const allFrames: { timestamp: number; base64: string; mimeType: string }[] = []
    let totalDuration = 0

    for (const v of videoFiles) {
      const video = document.createElement('video')
      video.src = v.url
      video.muted = true
      await new Promise<void>(resolve => { video.onloadedmetadata = () => resolve() })
      const extracted = await extractFrames(video, v.file)
      extracted.forEach(f => allFrames.push({ ...f, timestamp: f.timestamp + totalDuration, mimeType: 'image/jpeg' }))
      totalDuration += v.duration
    }

    setProgress(30)
    setStatusMsg('AI is watching your footage... finding the best moments')

    // Send to API for analysis (batch in groups of 5)
    const analysisResults: FrameAnalysis[] = []
    const batchSize = 5

    for (let i = 0; i < allFrames.length; i += batchSize) {
      const batch = allFrames.slice(i, i + batchSize)
      try {
        const res = await fetch('/api/video-studio/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frames: batch }),
        })
        if (res.ok) {
          const data = await res.json()
          data.analyses?.forEach((a: FrameAnalysis, idx: number) => {
            analysisResults.push({ ...a, base64: batch[idx].base64, selected: data.selected?.some((s: FrameAnalysis) => s.timestamp === a.timestamp) })
          })
        }
      } catch (e) {
        console.error('Analysis error:', e)
      }
      setProgress(30 + Math.round((i / allFrames.length) * 60))
    }

    setFrames(analysisResults)
    setProgress(100)
    setStatusMsg('')
    setStep('preview')

    // Auto-generate script
    const selectedFrames = analysisResults.filter(f => f.selected)
    if (selectedFrames.length > 0) {
      setStatusMsg('Generating narration script...')
      try {
        const scriptRes = await fetch('/api/video-studio/script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clips: selectedFrames.map(f => ({
              timestamp: f.timestamp,
              duration: 2,
              description: f.description,
              emotion: f.emotion,
            })),
            tone,
            totalDuration: selectedFrames.length * 2,
          }),
        })
        if (scriptRes.ok) {
          const scriptData = await scriptRes.json()
          setScript(scriptData.script || '')
        }
      } catch (e) {
        console.error('Script error:', e)
      }
      setStatusMsg('')
    }
  }, [extractFrames, tone])

  const toggleFrame = (timestamp: number) => {
    setFrames(prev => prev.map(f => f.timestamp === timestamp ? { ...f, selected: !f.selected } : f))
  }

  const generateVoiceover = async () => {
    if (!script) return
    setStep('voice')
    setStatusMsg('Generating AI voiceover...')
    setProgress(0)

    try {
      const res = await fetch('/api/video-studio/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, voice }),
      })

      if (res.ok) {
        const data = await res.json()
        setVoiceoverUrl(data.audioUrl)
        setProgress(100)
        setStatusMsg('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to generate voiceover')
      }
    } catch (e) {
      setError('Failed to generate voiceover')
    }
  }

  const renderVideo = async () => {
    setStep('render')
    setStatusMsg('Creating your story video...')
    setProgress(0)

    const selectedFrames = frames.filter(f => f.selected)

    try {
      // For now, use the first video's URL as a placeholder
      // In production, you'd upload clips to Vercel Blob first
      const res = await fetch('/api/video-studio/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: selectedFrames.map(f => ({
            url: videos[0]?.url || '',
            start: f.timestamp,
            duration: 2,
          })),
          voiceoverUrl,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const jobId = data.jobId

        // Poll for completion
        let attempts = 0
        const maxAttempts = 60
        const poll = async () => {
          const statusRes = await fetch(`/api/video-studio/render/${jobId}`)
          if (statusRes.ok) {
            const status = await statusRes.json()
            setProgress(status.progress || 0)

            if (status.status === 'done') {
              setFinalVideoUrl(status.url)
              setStep('done')
              return
            } else if (status.status === 'failed') {
              setError(status.error || 'Render failed')
              return
            }
          }

          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            setError('Render timed out')
          }
        }
        poll()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to start render')
      }
    } catch (e) {
      setError('Failed to render video')
    }
  }

  const ratingColor = (rating: string) => {
    if (rating === 'viral') return '#22c55e'
    if (rating === 'great') return '#10b981'
    if (rating === 'good') return '#f59e0b'
    if (rating === 'ok') return '#6b7280'
    return '#ef4444'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>🎬 Video Studio</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>
          Upload raw footage → AI creates a polished story video with voiceover
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

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', color: '#f87171' }}>
          ⚠️ {error}
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
            onClick={() => document.getElementById('video-input')?.click()}
            style={{
              background: '#1a1030',
              border: '2px dashed rgba(168,85,247,0.3)',
              borderRadius: '24px',
              padding: '80px 40px',
              textAlign: 'center',
              maxWidth: '640px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
              Drop your video clips here
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px' }}>
              MP4, MOV · Up to 5 clips · Max 2 minutes each
            </p>
            <div style={{
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              color: '#fff', borderRadius: '20px',
              padding: '12px 28px', display: 'inline-block',
              fontWeight: 700, fontSize: '14px',
            }}>
              Browse Videos
            </div>
            <input
              id="video-input"
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/webm"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files) handleUpload(e.target.files) }}
            />
          </div>
        </div>
      )}

      {/* STEP 2: Analyzing */}
      {step === 'analyzing' && (
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
            {statusMsg || 'Analyzing...'}
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', height: '8px', marginTop: '20px' }}>
            <div style={{ background: 'linear-gradient(90deg,#a855f7,#6366f1)', width: `${progress}%`, height: '100%', borderRadius: '8px', transition: 'width 0.3s' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px' }}>{progress}%</p>
        </div>
      )}

      {/* STEP 3: Preview */}
      {step === 'preview' && (
        <div style={{ maxWidth: '900px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>
            Selected Clips ({frames.filter(f => f.selected).length} / {frames.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '10px', marginBottom: '24px' }}>
            {frames.map(f => (
              <div
                key={f.timestamp}
                onClick={() => toggleFrame(f.timestamp)}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: f.selected ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  position: 'relative',
                  background: '#1a1030',
                }}
              >
                <img src={`data:image/jpeg;base64,${f.base64}`} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: ratingColor(f.rating),
                  color: '#fff', borderRadius: '8px',
                  padding: '2px 6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                }}>
                  {f.rating}
                </div>
                {f.selected && (
                  <div style={{
                    position: 'absolute', top: '6px', left: '6px',
                    background: '#10b981', borderRadius: '50%',
                    width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800, color: '#fff',
                  }}>✓</div>
                )}
                <p style={{ padding: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* Script */}
          <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              📝 Narration Script (editable)
            </label>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              rows={5}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px',
                resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
              }}
              placeholder="AI-generated script will appear here..."
            />
          </div>

          {/* Tone selector */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>TONE</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)} style={{
                  background: tone === t.id ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.06)',
                  color: tone === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer',
                }}>
                  <span style={{ fontWeight: 700 }}>{t.label}</span><br />
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateVoiceover} disabled={!script} style={{
            background: script ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.1)',
            color: '#fff', border: 'none', borderRadius: '20px',
            padding: '14px 32px', fontSize: '15px', fontWeight: 700,
            cursor: script ? 'pointer' : 'not-allowed',
          }}>
            🎙️ Generate Voiceover →
          </button>
        </div>
      )}

      {/* STEP 4: Voice */}
      {step === 'voice' && (
        <div style={{ maxWidth: '600px' }}>
          {statusMsg ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎙️</div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>{statusMsg}</h2>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', height: '8px', marginTop: '20px' }}>
                <div style={{ background: 'linear-gradient(90deg,#a855f7,#6366f1)', width: `${progress}%`, height: '100%', borderRadius: '8px' }} />
              </div>
            </div>
          ) : (
            <>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>🎙️ Voice Preview</h3>

              {/* Voice selector */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>SELECT VOICE</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setVoice(v.id)} style={{
                      background: voice === v.id ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.06)',
                      color: voice === v.id ? '#fff' : 'rgba(255,255,255,0.5)',
                      border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer',
                    }}>
                      <span style={{ fontWeight: 700 }}>{v.label}</span><br />
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {voiceoverUrl && (
                <div style={{ background: '#1a1030', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                  <audio controls src={voiceoverUrl} style={{ width: '100%' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep('preview')} style={{
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                  border: 'none', borderRadius: '20px', padding: '14px 24px', cursor: 'pointer',
                }}>
                  ← Back
                </button>
                {!voiceoverUrl && (
                  <button onClick={generateVoiceover} style={{
                    background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                    color: '#fff', border: 'none', borderRadius: '20px',
                    padding: '14px 28px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  }}>
                    🎙️ Generate with {VOICES.find(v => v.id === voice)?.label}
                  </button>
                )}
                {voiceoverUrl && (
                  <button onClick={renderVideo} style={{
                    background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                    color: '#fff', border: 'none', borderRadius: '20px',
                    padding: '14px 28px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  }}>
                    🎬 Render Final Video →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 5: Render */}
      {step === 'render' && (
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
            {statusMsg || 'Rendering your video...'}
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', height: '8px', marginTop: '20px' }}>
            <div style={{ background: 'linear-gradient(90deg,#a855f7,#6366f1)', width: `${progress}%`, height: '100%', borderRadius: '8px', transition: 'width 0.3s' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px' }}>{progress}% — This may take 30-60 seconds</p>
        </div>
      )}

      {/* STEP 6: Done */}
      {step === 'done' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
            <video controls src={finalVideoUrl} style={{ width: '100%', borderRadius: '12px', marginBottom: '16px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
              Your story video is ready! Download it or post directly to all platforms.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href={finalVideoUrl} download style={{
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              textDecoration: 'none', borderRadius: '20px', padding: '14px 24px',
              fontSize: '14px', fontWeight: 700,
            }}>
              ⬇️ Download Video
            </a>
            <button onClick={() => { setStep('upload'); setVideos([]); setFrames([]); setScript(''); setVoiceoverUrl(''); setFinalVideoUrl('') }} style={{
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              color: '#fff', border: 'none', borderRadius: '20px',
              padding: '14px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}>
              🎬 Create Another Video
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
