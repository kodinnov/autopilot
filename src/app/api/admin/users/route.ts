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
    // Get all users with their usage stats
    const users = await query<{
      id: string
      clerk_id: string
      email: string
      name: string
      created_at: string
    }>('SELECT id, clerk_id, email, name, created_at FROM users ORDER BY created_at DESC')

    // Get usage per user for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usage = await query<{
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
       GROUP BY user_id`,
      [startOfMonth]
    )

    const usageMap: Record<string, { cost: number; calls: number }> = {}
    usage.forEach(u => {
      usageMap[u.user_id] = {
        cost: parseFloat(u.total_cost || '0'),
        calls: parseInt(u.call_count || '0'),
      }
    })

    const enrichedUsers = users.map(u => ({
      ...u,
      plan: 'free', // TODO: Get from subscription
      mrr: 0,
      aiSpend: usageMap[u.clerk_id]?.cost || 0,
      aiCalls: usageMap[u.clerk_id]?.calls || 0,
      usagePercent: 0, // TODO: Calculate based on plan
    }))

    return NextResponse.json({ users: enrichedUsers })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
