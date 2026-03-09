'use client'

import { useState, useEffect } from 'react'

interface UsageBreakdown {
  service: string
  action: string
  cost: number
  count: number
}

interface UsageData {
  plan: string
  limits: { videos: string | number; aiCalls: number; costCap: string }
  usage: { videos: number; aiCalls: number; totalCost: string }
  remaining: { videos: string | number; aiCalls: number; costBudget: string }
  quotaOk: boolean
  warning: string | null
  breakdown: UsageBreakdown[]
}

interface ActivityLog {
  id: string
  service: string
  action: string
  cost_usd: number
  units: number
  created_at: string
}

const SERVICE_ICONS: Record<string, string> = {
  xai: '🤖',
  elevenlabs: '🎙️',
  shotstack: '🎬',
  x_api: '🐦',
}

const SERVICE_LABELS: Record<string, string> = {
  xai: 'AI (xAI Grok)',
  elevenlabs: 'Voiceover (ElevenLabs)',
  shotstack: 'Video Render (Shotstack)',
  x_api: 'X API Posts',
}

const ACTION_LABELS: Record<string, string> = {
  frame_analysis: 'Frame analysis',
  caption: 'Captions',
  script: 'Script generation',
  voiceover: 'Voice generation',
  render: 'Video renders',
  tweet: 'Posts',
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/usage').then(r => r.json()),
      fetch('/api/usage/logs?limit=10').then(r => r.json()).catch(() => ({ logs: [] })),
    ]).then(([usageData, logsData]) => {
      setData(usageData)
      setLogs(logsData.logs || [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        Loading usage data...
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
        Failed to load usage data
      </div>
    )
  }

  const costNum = parseFloat(data.usage.totalCost.replace('$', ''))
  const capNum = parseFloat(data.limits.costCap.replace('$', ''))
  const percent = capNum > 0 ? Math.round((costNum / capNum) * 100) : 0

  // Group breakdown by service
  const byService: Record<string, { total: number; items: UsageBreakdown[] }> = {}
  data.breakdown.forEach(item => {
    if (!byService[item.service]) {
      byService[item.service] = { total: 0, items: [] }
    }
    byService[item.service].total += item.cost
    byService[item.service].items.push(item)
  })

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>
          📊 Your Usage — {currentMonth}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>
          Plan: <strong style={{ color: '#a855f7' }}>{data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}</strong>
          {data.plan !== 'free' && <span> · Renews next month</span>}
        </p>
      </div>

      {/* Warning banner */}
      {data.warning && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          color: '#fbbf24',
          fontSize: '14px',
        }}>
          {data.warning}
        </div>
      )}

      {/* Total spent card */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
              Total Spent This Month
            </p>
            <p style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '4px 0 0' }}>
              {data.usage.totalCost}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>Budget remaining</p>
            <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 700, margin: '2px 0 0' }}>
              {data.remaining.costBudget} / {data.limits.costCap}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
          <div style={{
            background: percent >= 80 ? '#f59e0b' : 'linear-gradient(90deg,#a855f7,#6366f1)',
            width: `${Math.min(percent, 100)}%`,
            height: '100%',
            borderRadius: '8px',
            transition: 'width 0.3s',
          }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px', textAlign: 'right' }}>
          {percent}% used
        </p>
      </div>

      {/* Breakdown by service */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 20px', textTransform: 'uppercase' }}>
          Breakdown by Service
        </h3>

        {Object.entries(byService).length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No usage yet this month</p>
        ) : (
          Object.entries(byService).map(([service, { total, items }]) => {
            const servicePercent = costNum > 0 ? Math.round((total / costNum) * 100) : 0
            return (
              <div key={service} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                    {SERVICE_ICONS[service] || '📦'} {SERVICE_LABELS[service] || service}
                  </span>
                  <span style={{ color: '#a855f7', fontSize: '15px', fontWeight: 700 }}>
                    ${total.toFixed(2)} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{servicePercent}%</span>
                  </span>
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0 6px 20px',
                    borderLeft: '2px solid rgba(255,255,255,0.1)',
                    marginLeft: '8px',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '13px',
                  }}>
                    <span>{ACTION_LABELS[item.action] || item.action}</span>
                    <span>{item.count} calls · ${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* Quota summary */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 16px', textTransform: 'uppercase' }}>
          Quota Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>Videos</p>
            <p style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>
              {data.usage.videos} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>/ {data.limits.videos}</span>
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>AI Calls</p>
            <p style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>
              {data.usage.aiCalls} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>/ {data.limits.aiCalls}</span>
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>Remaining</p>
            <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>
              {data.remaining.aiCalls}
            </p>
          </div>
        </div>
      </div>

      {/* Activity log */}
      {logs.length > 0 && (
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 16px', textTransform: 'uppercase' }}>
            Recent Activity
          </h3>
          {logs.map((log) => (
            <div key={log.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '13px',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ color: '#fff' }}>
                {SERVICE_ICONS[log.service]} {ACTION_LABELS[log.action] || log.action}
              </span>
              <span style={{ color: '#a855f7' }}>${log.cost_usd?.toFixed(4) || '0.00'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
