import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

export async function GET() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  if (adminAuth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get daily usage for last 30 days
    const daily = await query<{
      day: string
      total_cost: string
    }>(
      `SELECT 
         DATE(created_at) as day,
         SUM(COALESCE(cost_usd, estimated_cost_usd, 0)) as total_cost
       FROM usage_logs
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY day ASC`
    )

    // Fill in missing days with 0
    const dailyMap: Record<string, number> = {}
    daily.forEach(d => {
      dailyMap[d.day] = parseFloat(d.total_cost || '0')
    })

    const last30Days: { date: string; cost: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last30Days.push({
        date: dateStr,
        cost: dailyMap[dateStr] || 0,
      })
    }

    // Get cost by service for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const byServiceResult = await query<{
      service: string
      total_cost: string
    }>(
      `SELECT 
         service,
         SUM(COALESCE(cost_usd, estimated_cost_usd, 0)) as total_cost
       FROM usage_logs
       WHERE created_at >= $1
       GROUP BY service`,
      [startOfMonth]
    )

    const byService: Record<string, number> = {}
    byServiceResult.forEach(r => {
      byService[r.service] = parseFloat(r.total_cost || '0')
    })

    // Get top users
    const topUsers = await query<{
      user_id: string
      total_cost: string
      call_count: string
    }>(
      `SELECT 
         user_id,
         SUM(COALESCE(cost_usd, estimated_cost_usd, 0)) as total_cost,
         COUNT(*) as call_count
       FROM usage_logs
       WHERE created_at >= $1
       GROUP BY user_id
       ORDER BY total_cost DESC
       LIMIT 10`,
      [startOfMonth]
    )

    // Calculate projected monthly cost based on daily average
    const totalLast30 = last30Days.reduce((sum, d) => sum + d.cost, 0)
    const dailyAvg = totalLast30 / 30
    const projectedMonthly = dailyAvg * 30

    return NextResponse.json({
      daily: last30Days,
      byService,
      topUsers: topUsers.map(u => ({
        userId: u.user_id,
        totalCost: parseFloat(u.total_cost),
        callCount: parseInt(u.call_count),
      })),
      projectedMonthly,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
