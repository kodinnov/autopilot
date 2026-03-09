import { query } from './db'

// Cost estimates per operation (USD)
export const COSTS = {
  xai_frame_analysis: 0.002,
  xai_caption: 0.001,
  xai_script: 0.002,
  elevenlabs_voiceover: 0.0003, // per character
  shotstack_render: 0.10,
  x_api_tweet: 0.001,
} as const

// Plan limits (monthly)
export const PLANS: Record<string, { videos: number; aiCalls: number; costCap: number }> = {
  free: { videos: 2, aiCalls: 50, costCap: 1 },
  starter: { videos: 10, aiCalls: 500, costCap: 15 },
  pro: { videos: -1, aiCalls: 2000, costCap: 40 }, // -1 = unlimited
  agency: { videos: -1, aiCalls: 10000, costCap: 150 },
}

export type PlanType = 'free' | 'starter' | 'pro' | 'agency'

export interface UsageLog {
  service: 'xai' | 'elevenlabs' | 'shotstack' | 'x_api'
  action: string
  tokensUsed?: number
  estimatedCostUsd: number
}

export async function logUsage(userId: string, log: UsageLog) {
  await query(
    `INSERT INTO usage_logs (user_id, service, action, tokens_used, estimated_cost_usd)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, log.service, log.action, log.tokensUsed || 0, log.estimatedCostUsd]
  )
}

export async function getMonthlyUsage(userId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const rows = await query<{
    service: string
    action: string
    total_cost: string
    call_count: string
  }>(
    `SELECT 
       service,
       action,
       SUM(estimated_cost_usd) as total_cost,
       COUNT(*) as call_count
     FROM usage_logs
     WHERE user_id = $1 AND created_at >= $2
     GROUP BY service, action`,
    [userId, startOfMonth]
  )

  const totalCost = rows.reduce((sum, r) => sum + parseFloat(r.total_cost || '0'), 0)
  const totalCalls = rows.reduce((sum, r) => sum + parseInt(r.call_count || '0'), 0)

  // Count videos (renders)
  const videoCount = rows
    .filter(r => r.action === 'render')
    .reduce((sum, r) => sum + parseInt(r.call_count || '0'), 0)

  return {
    totalCost: Math.round(totalCost * 1000000) / 1000000,
    totalCalls,
    videoCount,
    breakdown: rows.map(r => ({
      service: r.service,
      action: r.action,
      cost: parseFloat(r.total_cost),
      count: parseInt(r.call_count),
    })),
  }
}

export async function checkQuota(
  userId: string,
  plan: PlanType = 'free'
): Promise<{ allowed: boolean; reason?: string; usage: Awaited<ReturnType<typeof getMonthlyUsage>> }> {
  const usage = await getMonthlyUsage(userId)
  const limits = PLANS[plan]

  if (limits.videos !== -1 && usage.videoCount >= limits.videos) {
    return { allowed: false, reason: `Video limit reached (${limits.videos}/month). Upgrade your plan.`, usage }
  }

  if (usage.totalCalls >= limits.aiCalls) {
    return { allowed: false, reason: `AI call limit reached (${limits.aiCalls}/month). Upgrade your plan.`, usage }
  }

  if (usage.totalCost >= limits.costCap) {
    return { allowed: false, reason: `Cost cap reached ($${limits.costCap}/month). Upgrade your plan.`, usage }
  }

  return { allowed: true, usage }
}

export function getQuotaWarning(
  usage: Awaited<ReturnType<typeof getMonthlyUsage>>,
  plan: PlanType = 'free'
): string | null {
  const limits = PLANS[plan]
  const costPercent = (usage.totalCost / limits.costCap) * 100
  const callsPercent = (usage.totalCalls / limits.aiCalls) * 100

  if (costPercent >= 80 || callsPercent >= 80) {
    return `⚠️ You've used ${Math.round(Math.max(costPercent, callsPercent))}% of your monthly quota. Consider upgrading.`
  }

  return null
}
