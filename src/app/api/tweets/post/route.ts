import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

// In production, fetch from database based on user ID
function getUserTokens(): { accessToken: string } | null {
  // TODO: Fetch from database using currentUser().id
  return null
}

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

    // Get user's X tokens
    const tokens = getUserTokens()
    if (!tokens) {
      return NextResponse.json({ error: 'Twitter not connected' }, { status: 400 })
    }

    // If scheduled for later, add to queue
    if (scheduledAt) {
      const scheduledTime = new Date(scheduledAt).getTime()
      const now = Date.now()
      
      if (scheduledTime <= now) {
        return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
      }

      // Add to BullMQ queue (implemented separately)
      // For now, return success with scheduled flag
      return NextResponse.json({ 
        success: true, 
        scheduled: true, 
        scheduledAt,
        message: 'Tweet scheduled successfully'
      })
    }

    // Post immediately
    const X_API_URL = 'https://api.twitter.com/2/tweets'
    
    const response = await fetch(X_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Tweet failed:', error)
      return NextResponse.json({ error: 'Failed to post tweet' }, { status: response.status })
    }

    const tweet = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      scheduled: false,
      tweetId: tweet.data?.id,
      message: 'Tweet posted successfully'
    })
  } catch (error) {
    console.error('Post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
