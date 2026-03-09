'use client'

import { useState, useEffect } from 'react'

interface AdminStats {
  revenue: {
    mrr: number
    activeUsers: number
    churned: number
  }
  usage: {
    totalCost: number
    avgPerUser: number
    margin: number
    byService: Record<string, number>
  }
  recentUsers: Array<{
    id: string
    email: string
    name: string
    created_at: string
  }>
  topUsers: Array<{
    userId: string
    totalCost: number
    callCount: number
  }>
}

const SERVICE_LABELS: Record<string, string> = {
  xai: 'xAI Grok',
  elevenlabs: 'ElevenLabs',
  shotstack: 'Shotstack',
  x_api: 'X API',
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '40px' }}>Loading...</div>
  }

  if (!stats) {
    return <div style={{ color: '#f87171', padding: '40px' }}>Failed to load stats</div>
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 32px' }}>
        🎛️ Admin Overview
      </h1>

      {/* Revenue card */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Revenue
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>MRR</p>
            <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>
              ${stats.revenue.mrr.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Active Users</p>
            <p style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>
              {stats.revenue.activeUsers}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Churned</p>
            <p style={{ color: stats.revenue.churned > 0 ? '#f87171' : '#fff', fontSize: '32px', fontWeight: 800, margin: '4px 0 0' }}>
              {stats.revenue.churned}
            </p>
          </div>
        </div>
      </div>

      {/* Usage card */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Usage — {currentMonth}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Total AI Spend</p>
            <p style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>
              ${stats.usage.totalCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Avg per User</p>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>
              ${stats.usage.avgPerUser.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Margin</p>
            <p style={{ color: '#10b981', fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>
              {stats.usage.margin}%
            </p>
          </div>
        </div>

        <h4 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>
          AI Costs Breakdown
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {Object.entries(stats.usage.byService).map(([service, cost]) => (
            <div key={service} style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px',
              padding: '12px',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>
                {SERVICE_LABELS[service] || service}
              </p>
              <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '4px 0 0' }}>
                ${cost.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Recent Signups
        </h3>
        {stats.recentUsers.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No users yet</p>
        ) : (
          stats.recentUsers.map(user => (
            <div key={user.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  {user.name || user.email || 'Unknown'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>
                  {user.email}
                </p>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Top users by spend */}
      {stats.topUsers.length > 0 && (
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
            Top Users by AI Spend
          </h3>
          {stats.topUsers.map((user, i) => (
            <div key={user.userId} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {i + 1}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'monospace' }}>
                  {user.userId.slice(0, 12)}...
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#a855f7', fontSize: '14px', fontWeight: 700 }}>
                  ${user.totalCost.toFixed(2)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '8px' }}>
                  {user.callCount} calls
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
