import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

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

    // Get user's X tokens from cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const tokensCookie = cookieHeader.match(/x_tokens=([^;]+)/)?.[1]

    if (!tokensCookie) {
      return NextResponse.json({ error: 'Twitter not connected. Please connect your X account first.' }, { status: 400 })
    }

    const tokens = JSON.parse(decodeURIComponent(tokensCookie))
    const accessToken = tokens.accessToken

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid Twitter tokens' }, { status: 400 })
    }

    // If scheduled for later
    if (scheduledAt) {
      const scheduledTime = new Date(scheduledAt).getTime()
      if (scheduledTime <= Date.now()) {
        return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
      }
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
      message: 'Tweet posted successfully!'
    })
  } catch (error) {
    console.error('Post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
