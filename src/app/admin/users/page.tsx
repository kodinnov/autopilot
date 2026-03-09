'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  clerk_id: string
  email: string
  name: string
  created_at: string
  plan: string
  mrr: number
  aiSpend: number
  aiCalls: number
  usagePercent: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '40px' }}>Loading users...</div>
  }

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 32px' }}>
        👥 All Users
      </h1>

      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
          padding: '14px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}>
          <span>User</span>
          <span>Plan</span>
          <span>MRR</span>
          <span>AI Spend</span>
          <span>Usage</span>
          <span>Joined</span>
        </div>

        {/* Rows */}
        {users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            No users yet
          </div>
        ) : (
          users.map(user => (
            <Link key={user.id} href={`/admin/users/${user.clerk_id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                    {user.name || 'Unknown'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>
                    {user.email || user.clerk_id.slice(0, 12) + '...'}
                  </p>
                </div>
                <div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: user.plan === 'pro' ? 'rgba(168,85,247,0.2)' : 
                               user.plan === 'agency' ? 'rgba(245,158,11,0.2)' : 
                               user.plan === 'starter' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                    color: user.plan === 'pro' ? '#a855f7' : 
                           user.plan === 'agency' ? '#f59e0b' : 
                           user.plan === 'starter' ? '#10b981' : 'rgba(255,255,255,0.5)',
                  }}>
                    {user.plan}
                  </span>
                </div>
                <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
                  ${user.mrr}
                </div>
                <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600 }}>
                  ${user.aiSpend.toFixed(2)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  {user.aiCalls} calls
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
