'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface UserDetail {
  id: string
  clerk_id: string
  email: string
  name: string
  created_at: string
  plan: string
  usage: {
    totalCost: number
    totalCalls: number
    breakdown: Array<{ service: string; action: string; cost: number; count: number }>
  }
  recentLogs: Array<{
    id: string
    service: string
    action: string
    cost_usd: number
    created_at: string
  }>
}

const SERVICE_LABELS: Record<string, string> = {
  xai: 'xAI Grok',
  elevenlabs: 'ElevenLabs',
  shotstack: 'Shotstack',
  x_api: 'X API',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
  }, [userId])

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '40px' }}>Loading...</div>
  }

  if (!user) {
    return <div style={{ color: '#f87171', padding: '40px' }}>User not found</div>
  }

  return (
    <div>
      <Link href="/admin/users" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        ← Back to Users
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>
            {user.name || user.email || 'Unknown User'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
            {user.email} · Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <span style={{
          padding: '6px 14px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          background: user.plan === 'pro' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.1)',
          color: user.plan === 'pro' ? '#a855f7' : 'rgba(255,255,255,0.5)',
        }}>
          {user.plan}
        </span>
      </div>

      {/* Usage summary */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          This Month
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>AI Spend</p>
            <p style={{ color: '#f59e0b', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>
              ${user.usage.totalCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>API Calls</p>
            <p style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>
              {user.usage.totalCalls}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {user.usage.breakdown.length > 0 && (
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
            Usage Breakdown
          </h3>
          {user.usage.breakdown.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                {SERVICE_LABELS[item.service] || item.service} — {item.action}
              </span>
              <span style={{ color: '#a855f7', fontSize: '14px', fontWeight: 600 }}>
                ${item.cost.toFixed(4)} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({item.count} calls)</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      {user.recentLogs.length > 0 && (
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
            Recent Activity
          </h3>
          {user.recentLogs.map(log => (
            <div key={log.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '13px',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                {new Date(log.created_at).toLocaleString()}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                {log.service} — {log.action}
              </span>
              <span style={{ color: '#a855f7' }}>
                ${log.cost_usd?.toFixed(4) || '0.00'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Actions
        </h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px',
            padding: '10px 18px',
            color: '#10b981',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Upgrade Plan
          </button>
          <button style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            padding: '10px 18px',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Block User
          </button>
        </div>
      </div>
    </div>
  )
}
