'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '🎛️', exact: true },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/usage', label: 'Usage', icon: '📊' },
  { href: '/admin/revenue', label: 'Revenue', icon: '💰' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/admin/stats')
      .then(r => {
        setAuthed(r.ok)
      })
      .catch(() => setAuthed(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const res = await fetch('/api/admin/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setAuthed(true)
    } else {
      setError('Invalid password')
    }
  }

  // Loading state
  if (authed === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
      }}>
        Loading...
      </div>
    )
  }

  // Login form
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '40px',
          width: '360px',
        }}>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>
            🔐 Admin Access
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px', textAlign: 'center' }}>
            Enter the admin password to continue
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              color: '#f87171',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#fff',
              fontSize: '15px',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <button type="submit" style={{
            width: '100%',
            background: 'linear-gradient(135deg,#a855f7,#6366f1)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            Login
          </button>
        </form>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a12' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: '#12101c',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 16px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: 0 }}>
              🎛️ Admin Panel
            </h2>
          </Link>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                background: isActive ? 'rgba(168,85,247,0.15)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
          <Link href="/dashboard" style={{
            display: 'block',
            padding: '10px 14px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
          }}>
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
