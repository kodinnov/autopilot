import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  if (adminAuth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId } = await params

  try {
    // Get user info
    const users = await query<{
      id: string
      clerk_id: string
      email: string
      name: string
      created_at: string
    }>(
      'SELECT id, clerk_id, email, name, created_at FROM users WHERE clerk_id = $1',
      [userId]
    )

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]

    // Get usage for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usageBreakdown = await query<{
      service: string
      action: string
      total_cost: string
      call_count: string
    }>(
      `SELECT 
         service,
         action,
         SUM(COALESCE(cost_usd, estimated_cost_usd, 0)) as total_cost,
         COUNT(*) as call_count
       FROM usage_logs
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY service, action`,
      [userId, startOfMonth]
    )

    const totalCost = usageBreakdown.reduce((sum, r) => sum + parseFloat(r.total_cost || '0'), 0)
    const totalCalls = usageBreakdown.reduce((sum, r) => sum + parseInt(r.call_count || '0'), 0)

    // Get recent logs
    const recentLogs = await query<{
      id: string
      service: string
      action: string
      cost_usd: string
      created_at: string
    }>(
      `SELECT id, service, action, COALESCE(cost_usd, estimated_cost_usd, 0) as cost_usd, created_at
       FROM usage_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    )

    return NextResponse.json({
      ...user,
      plan: 'free', // TODO: Get from subscription
      usage: {
        totalCost,
        totalCalls,
        breakdown: usageBreakdown.map(u => ({
          service: u.service,
          action: u.action,
          cost: parseFloat(u.total_cost),
          count: parseInt(u.call_count),
        })),
      },
      recentLogs: recentLogs.map(l => ({
        ...l,
        cost_usd: parseFloat(l.cost_usd),
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
