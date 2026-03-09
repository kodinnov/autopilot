'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Incorrect password')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a1a', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1030', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '40px', width: '360px',
      }}>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>🎛️ Admin Access</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 24px' }}>Autopilot Admin Panel</p>

        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            padding: '12px 16px', color: '#fff', fontSize: '14px',
            boxSizing: 'border-box', marginBottom: '12px',
          }}
        />
        {error && <p style={{ color: '#f87171', fontSize: '12px', margin: '0 0 12px' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !password}
          style={{
            width: '100%',
            background: password ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.06)',
            color: '#fff', border: 'none', borderRadius: '12px',
            padding: '12px', fontSize: '14px', fontWeight: 700,
            cursor: password && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Checking...' : 'Enter Admin Panel'}
        </button>
      </div>
    </div>
  )
}
