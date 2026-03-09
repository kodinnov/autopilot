import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY!
const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV || 'stage'

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!SHOTSTACK_API_KEY) {
      return NextResponse.json({ error: 'Shotstack API key not configured' }, { status: 500 })
    }

    const res = await fetch(`https://api.shotstack.io/${SHOTSTACK_ENV}/render/${params.jobId}`, {
      headers: { 'x-api-key': SHOTSTACK_API_KEY },
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Shotstack status error:', err)
      return NextResponse.json({ error: 'Failed to get render status' }, { status: 500 })
    }

    const data = await res.json()
    const response = data.response || {}

    return NextResponse.json({
      status: response.status, // queued, fetching, rendering, saving, done, failed
      progress: response.progress || 0,
      url: response.url, // Final video URL when done
      poster: response.poster, // Thumbnail
      error: response.error,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
