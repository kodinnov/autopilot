'use client'

import { useState, useEffect } from 'react'

interface DailyUsage {
  date: string
  cost: number
}

interface TopUser {
  userId: string
  totalCost: number
  callCount: number
}

interface UsageStats {
  daily: DailyUsage[]
  topUsers: TopUser[]
  byService: Record<string, number>
  projectedMonthly: number
}

const SERVICE_LABELS: Record<string, string> = {
  xai: 'xAI Grok',
  elevenlabs: 'ElevenLabs',
  shotstack: 'Shotstack',
  x_api: 'X API',
}

export default function AdminUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/usage')
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
    return <div style={{ color: '#f87171', padding: '40px' }}>Failed to load usage stats</div>
  }

  const maxDailyCost = Math.max(...stats.daily.map(d => d.cost), 1)

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 32px' }}>
        📊 Usage Analytics
      </h1>

      {/* Daily chart */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
            Daily AI Spend (Last 30 Days)
          </h3>
          <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 700 }}>
            Projected: ${stats.projectedMonthly.toFixed(2)}/mo
          </span>
        </div>

        {/* Simple bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px' }}>
          {stats.daily.map((day, i) => (
            <div
              key={i}
              title={`${day.date}: $${day.cost.toFixed(2)}`}
              style={{
                flex: 1,
                background: 'linear-gradient(180deg, #a855f7 0%, #6366f1 100%)',
                height: `${Math.max((day.cost / maxDailyCost) * 100, 2)}%`,
                borderRadius: '2px 2px 0 0',
                minWidth: '4px',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>30 days ago</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Today</span>
        </div>
      </div>

      {/* Cost by service */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Cost by Service
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {Object.entries(stats.byService).map(([service, cost]) => {
            const totalCost = Object.values(stats.byService).reduce((a, b) => a + b, 0)
            const percent = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0
            return (
              <div key={service} style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
                  {SERVICE_LABELS[service] || service}
                </p>
                <p style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>
                  ${cost.toFixed(2)}
                </p>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '4px', marginTop: '8px' }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                    width: `${percent}%`,
                    height: '100%',
                    borderRadius: '4px',
                  }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '4px 0 0' }}>
                  {percent}% of total
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top users */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Top 10 Heaviest Users
        </h3>
        {stats.topUsers.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>No usage data yet</p>
        ) : (
          stats.topUsers.map((user, i) => (
            <div key={user.userId} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {i + 1}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'monospace' }}>
                  {user.userId.slice(0, 16)}...
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#a855f7', fontSize: '16px', fontWeight: 700 }}>
                  ${user.totalCost.toFixed(2)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '12px' }}>
                  {user.callCount} calls
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
