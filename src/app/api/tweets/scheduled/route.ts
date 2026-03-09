import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getScheduledPosts, upsertUser } from '@/lib/db'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in DB
    const email = user.emailAddresses?.[0]?.emailAddress || ''
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    await upsertUser(user.id, email, name)

    const posts = await getScheduledPosts(user.id)

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Scheduled posts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
