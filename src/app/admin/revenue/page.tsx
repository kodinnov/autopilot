'use client'

import { useState, useEffect } from 'react'

interface RevenueStats {
  mrr: number
  arr: number
  totalCollected: number
  planDistribution: Record<string, number>
  recentPayments: Array<{
    id: string
    amount: number
    email: string
    date: string
    status: string
  }>
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#10b981',
  pro: '#a855f7',
  agency: '#f59e0b',
  free: '#6b7280',
}

export default function AdminRevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/revenue')
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
    return <div style={{ color: '#f87171', padding: '40px' }}>Failed to load revenue</div>
  }

  const totalPlans = Object.values(stats.planDistribution).reduce((a, b) => a + b, 0)

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 32px' }}>
        💰 Revenue
      </h1>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
            MRR
          </p>
          <p style={{ color: '#10b981', fontSize: '36px', fontWeight: 800, margin: '8px 0 0' }}>
            ${stats.mrr.toLocaleString()}
          </p>
        </div>
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
            ARR
          </p>
          <p style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '8px 0 0' }}>
            ${stats.arr.toLocaleString()}
          </p>
        </div>
        <div style={{
          background: '#1a1030',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
            Total Collected
          </p>
          <p style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '8px 0 0' }}>
            ${stats.totalCollected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Plan distribution */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 20px' }}>
          Plan Distribution
        </h3>

        {/* Simple pie chart representation */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: `conic-gradient(
              ${Object.entries(stats.planDistribution).map(([plan, count], i, arr) => {
                const start = arr.slice(0, i).reduce((sum, [, c]) => sum + (c / totalPlans) * 100, 0)
                const end = start + (count / totalPlans) * 100
                return `${PLAN_COLORS[plan] || '#6b7280'} ${start}% ${end}%`
              }).join(', ')}
            )`,
          }} />

          <div style={{ flex: 1 }}>
            {Object.entries(stats.planDistribution).map(([plan, count]) => {
              const percent = totalPlans > 0 ? Math.round((count / totalPlans) * 100) : 0
              return (
                <div key={plan} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: PLAN_COLORS[plan] || '#6b7280',
                  }} />
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, textTransform: 'capitalize', width: '80px' }}>
                    {plan}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                    {count} users
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    ({percent}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div style={{
        background: '#1a1030',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Recent Payments
        </h3>

        {stats.recentPayments.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            No payments yet. Connect Stripe to see real payment data.
          </p>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}>
              <span>Customer</span>
              <span>Amount</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {stats.recentPayments.map(payment => (
              <div key={payment.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '14px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                alignItems: 'center',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  {payment.email}
                </span>
                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 700 }}>
                  ${(payment.amount / 100).toFixed(2)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  {new Date(payment.date).toLocaleDateString()}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: payment.status === 'succeeded' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: payment.status === 'succeeded' ? '#10b981' : '#f59e0b',
                  display: 'inline-block',
                }}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
