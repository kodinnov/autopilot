import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserTokens, upsertUser, saveScheduledPost } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, scheduledAt } = await req.json()

    if (!content || content.length > 280) {
      return NextResponse.json({ error: 'Content must be 1-280 characters' }, { status: 400 })
    }

    // Ensure user exists in DB
    const email = user.emailAddresses?.[0]?.emailAddress || ''
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    await upsertUser(user.id, email, name)

    // Get tokens from DB
    const tokenRow = await getUserTokens(user.id)
    if (!tokenRow) {
      return NextResponse.json(
        { error: 'Twitter not connected. Please connect your X account first.' },
        { status: 400 }
      )
    }

    const accessToken = tokenRow.access_token

    // If scheduled for later — save to DB
    if (scheduledAt) {
      const scheduledTime = new Date(scheduledAt)
      if (scheduledTime.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
      }
      await saveScheduledPost(user.id, content, scheduledTime)
      return NextResponse.json({ success: true, scheduled: true, scheduledAt, message: 'Tweet scheduled!' })
    }

    // Post immediately via X API v2
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Tweet failed:', error)
      return NextResponse.json({ error: 'Failed to post tweet: ' + error }, { status: response.status })
    }

    const tweet = await response.json()

    return NextResponse.json({
      success: true,
      scheduled: false,
      tweetId: tweet.data?.id,
      message: 'Tweet posted successfully!',
    })
  } catch (error) {
    console.error('Post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
