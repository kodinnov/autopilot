import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

export async function GET() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  if (adminAuth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user count by plan (for now, estimate from users table)
    const users = await query<{ count: string }>('SELECT COUNT(*) as count FROM users')
    const userCount = parseInt(users[0]?.count || '0')

    // Placeholder plan distribution (would come from subscriptions table)
    const planDistribution: Record<string, number> = {
      free: Math.max(0, userCount - 3),
      starter: Math.min(2, userCount),
      pro: Math.min(1, Math.max(0, userCount - 2)),
      agency: 0,
    }

    // Calculate MRR from plan distribution
    const planPrices: Record<string, number> = {
      free: 0,
      starter: 59,
      pro: 129,
      agency: 399,
    }

    const mrr = Object.entries(planDistribution).reduce(
      (sum, [plan, count]) => sum + count * (planPrices[plan] || 0),
      0
    )

    // Try to get real data from Stripe if available
    let recentPayments: Array<{
      id: string
      amount: number
      email: string
      date: string
      status: string
    }> = []

    let totalCollected = 0

    if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith('sk_')) {
      try {
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })

        // Get recent charges
        const charges = await stripe.charges.list({ limit: 20 })

        recentPayments = charges.data.map(charge => ({
          id: charge.id,
          amount: charge.amount,
          email: charge.billing_details?.email || charge.receipt_email || 'Unknown',
          date: new Date(charge.created * 1000).toISOString(),
          status: charge.status,
        }))

        // Get total collected (sum of successful charges)
        const allCharges = await stripe.charges.list({ limit: 100 })
        totalCollected = allCharges.data
          .filter(c => c.status === 'succeeded')
          .reduce((sum, c) => sum + c.amount, 0) / 100

      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        // Continue with placeholder data
      }
    }

    return NextResponse.json({
      mrr,
      arr: mrr * 12,
      totalCollected,
      planDistribution,
      recentPayments,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
