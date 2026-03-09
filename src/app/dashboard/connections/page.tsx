'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', icon: '𝕏', iconBg: '#000', desc: 'Post tweets and schedule content' },
  { id: 'instagram', label: 'Instagram', icon: '📸', iconBg: '#e1306c', desc: 'Share photos and reels', soon: true },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', iconBg: '#0077b5', desc: 'Grow your professional network', soon: true },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', iconBg: '#010101', desc: 'Short-form video content', soon: true },
  { id: 'youtube', label: 'YouTube', icon: '▶️', iconBg: '#ff0000', desc: 'Publish video content', soon: true },
  { id: 'facebook', label: 'Facebook', icon: '👥', iconBg: '#1877f2', desc: 'Reach your audience', soon: true },
]

const AI_SERVICES = [
  { id: 'xai', label: 'xAI Grok', icon: '🤖', desc: 'AI content generation & frame analysis', connected: true, account: 'API Key Active' },
  { id: 'elevenlabs', label: 'ElevenLabs', icon: '🎙️', desc: 'AI voiceover generation', connected: true, account: 'API Key Active' },
  { id: 'shotstack', label: 'Shotstack', icon: '🎬', desc: 'Cloud video rendering', connected: true, account: 'Sandbox Active' },
  { id: 'ideogram', label: 'Ideogram', icon: '🎨', desc: 'AI image generation', connected: true, account: 'kodinnov@gmail.com' },
]

function ConnectionsContent() {
  const searchParams = useSearchParams()
  const [twitterConnected, setTwitterConnected] = useState(false)
  const [twitterHandle, setTwitterHandle] = useState('')

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setTwitterConnected(true)
    }
    fetch('/api/auth/twitter/status')
      .then(r => r.json())
      .then(data => {
        setTwitterConnected(data.connected)
        if (data.handle) setTwitterHandle(data.handle)
      })
  }, [searchParams])

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>🔗 Connections</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>
          Manage your connected social accounts and AI services
        </p>
      </div>

      {/* Social Platforms */}
      <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
        Social Platforms
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '620px', marginBottom: '36px' }}>
        {SOCIAL_PLATFORMS.map(platform => {
          const isConnected = platform.id === 'twitter' ? twitterConnected : false
          return (
            <div key={platform.id} style={{
              background: '#1a1030',
              border: `1px solid ${isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: platform.iconBg,
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 900, color: '#fff', flexShrink: 0,
                }}>
                  {platform.icon}
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>{platform.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '2px 0 0' }}>
                    {platform.id === 'twitter' && twitterHandle ? `@${twitterHandle}` : platform.desc}
                  </p>
                </div>
              </div>

              {platform.soon ? (
                <span style={{
                  padding: '6px 14px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)',
                }}>
                  Coming Soon
                </span>
              ) : isConnected ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                  color: '#22c55e', padding: '8px 18px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 600, flexShrink: 0,
                }}>
                  ✓ Connected
                </span>
              ) : (
                <a href="/api/auth/twitter" style={{
                  background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                  color: '#fff', padding: '10px 22px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 600, textDecoration: 'none', flexShrink: 0,
                }}>
                  Connect
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* AI Services */}
      <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
        AI Services
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxWidth: '620px' }}>
        {AI_SERVICES.map(service => (
          <div key={service.id} style={{
            background: '#1a1030',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{service.icon}</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>{service.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>{service.desc}</p>
                </div>
              </div>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#22c55e', flexShrink: 0, marginTop: '4px',
                boxShadow: '0 0 6px rgba(34,197,94,0.6)',
              }} />
            </div>
            <p style={{
              color: '#22c55e', fontSize: '11px', fontWeight: 600,
              margin: '12px 0 0', paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              ✓ {service.account}
            </p>
          </div>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '24px' }}>
        🔒 All credentials are stored securely and never shared with third parties.
      </p>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.5)', padding: '40px' }}>Loading...</div>}>
      <ConnectionsContent />
    </Suspense>
  )
}
