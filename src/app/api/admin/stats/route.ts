import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

export async function GET() {
  // Check admin auth
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  if (adminAuth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get total users
    const usersResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM users')
    const totalUsers = parseInt(usersResult[0]?.count || '0')

    // Get current month usage stats
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usageResult = await query<{
      service: string
      total_cost: string
      total_calls: string
    }>(
      `SELECT 
         service,
         SUM(COALESCE(cost_usd, estimated_cost_usd, 0)) as total_cost,
         COUNT(*) as total_calls
       FROM usage_logs
       WHERE created_at >= $1
       GROUP BY service`,
      [startOfMonth]
    )

    const totalCost = usageResult.reduce((sum, r) => sum + parseFloat(r.total_cost || '0'), 0)
    const costByService: Record<string, number> = {}
    usageResult.forEach(r => {
      costByService[r.service] = parseFloat(r.total_cost || '0')
    })

    // Get recent signups
    const recentUsers = await query<{
      id: string
      email: string
      name: string
      created_at: string
    }>(
      `SELECT id, email, name, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 5`
    )

    // Get top users by spend
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

    // Placeholder MRR (would come from Stripe in production)
    // For now, estimate based on active users
    const estimatedMRR = totalUsers * 59 // Assuming starter plan average

    return NextResponse.json({
      revenue: {
        mrr: estimatedMRR,
        activeUsers: totalUsers,
        churned: 0,
      },
      usage: {
        totalCost: Math.round(totalCost * 100) / 100,
        avgPerUser: totalUsers > 0 ? Math.round((totalCost / totalUsers) * 100) / 100 : 0,
        margin: totalCost > 0 ? Math.round((1 - totalCost / estimatedMRR) * 100) : 100,
        byService: costByService,
      },
      recentUsers,
      topUsers: topUsers.map(u => ({
        userId: u.user_id,
        totalCost: parseFloat(u.total_cost),
        callCount: parseInt(u.call_count),
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST for admin login
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ ok: true })
      response.cookies.set('admin_auth', ADMIN_PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      return response
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
