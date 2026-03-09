import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { upsertUser, query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Optimal posting times per platform (24h)
const PLATFORM_HOURS: Record<string, number> = {
  twitter:   9,
  instagram: 17,
  linkedin:  8,
  tiktok:    19,
  facebook:  12,
  youtube:   18,
}

interface ScheduleItem {
  imageUrl: string
  platform: string
  caption: string
  dayOffset: number // 0 = today, 1 = tomorrow, etc.
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { items } = await req.json() as { items: ScheduleItem[] }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to schedule' }, { status: 400 })
    }

    // Ensure user exists
    const email = user.emailAddresses?.[0]?.emailAddress || ''
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    await upsertUser(user.id, email, name)

    const now = new Date()
    const scheduled: { id: string; scheduledFor: string; platform: string }[] = []

    for (const item of items) {
      const postDate = new Date(now)
      postDate.setDate(postDate.getDate() + (item.dayOffset || 0))
      const hour = PLATFORM_HOURS[item.platform] ?? 9
      postDate.setHours(hour, 0, 0, 0)

      const rows = await query<{ id: string; scheduled_for: string }>(
        `INSERT INTO scheduled_tweets (clerk_id, content, scheduled_for, status, platform, image_url)
         VALUES ($1, $2, $3, 'pending', $4, $5)
         RETURNING id, scheduled_for`,
        [user.id, item.caption, postDate, item.platform, item.imageUrl]
      )

      if (rows[0]) {
        scheduled.push({
          id: rows[0].id,
          scheduledFor: rows[0].scheduled_for,
          platform: item.platform,
        })
      }
    }

    return NextResponse.json({ success: true, scheduled, count: scheduled.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
