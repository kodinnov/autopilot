import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10')

    const rows = await query(
      `SELECT id, service, action, units, COALESCE(cost_usd, estimated_cost_usd, 0) as cost_usd, created_at
       FROM usage_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, Math.min(limit, 100)]
    )

    return NextResponse.json({ logs: rows })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
