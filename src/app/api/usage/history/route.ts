import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await query<{
      month: string
      total_cost: string
      total_calls: string
    }>(
      `SELECT 
         TO_CHAR(DATE_TRUNC('month', created_at), 'Month YYYY') as month,
         SUM(COALESCE(cost_usd, estimated_cost_usd, 0)) as total_cost,
         COUNT(*) as total_calls
       FROM usage_logs
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '3 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) DESC`,
      [user.id]
    )

    return NextResponse.json({ history: rows })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
