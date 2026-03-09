import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getMonthlyUsage, checkQuota, getQuotaWarning, PLANS, PlanType } from '@/lib/usage'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // TODO: Get plan from user metadata or subscription table
    const plan: PlanType = 'free'
    const limits = PLANS[plan]

    const usage = await getMonthlyUsage(user.id)
    const { allowed } = await checkQuota(user.id, plan)
    const warning = getQuotaWarning(usage, plan)

    return NextResponse.json({
      plan,
      limits: {
        videos: limits.videos === -1 ? 'Unlimited' : limits.videos,
        aiCalls: limits.aiCalls,
        costCap: `$${limits.costCap}`,
      },
      usage: {
        videos: usage.videoCount,
        aiCalls: usage.totalCalls,
        totalCost: `$${usage.totalCost.toFixed(4)}`,
      },
      remaining: {
        videos: limits.videos === -1 ? 'Unlimited' : Math.max(0, limits.videos - usage.videoCount),
        aiCalls: Math.max(0, limits.aiCalls - usage.totalCalls),
        costBudget: `$${Math.max(0, limits.costCap - usage.totalCost).toFixed(2)}`,
      },
      quotaOk: allowed,
      warning,
      breakdown: usage.breakdown,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
