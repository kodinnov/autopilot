import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { logUsage, checkQuota, COSTS } from '@/lib/usage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY!
const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV || 'stage' // 'stage' for sandbox, 'v1' for production

interface RenderClip {
  url: string
  start: number
  duration: number
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check quota
    const quota = await checkQuota(user.id)
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 402 })
    }

    if (!SHOTSTACK_API_KEY) {
      return NextResponse.json({ error: 'Shotstack API key not configured' }, { status: 500 })
    }

    const { clips, voiceoverUrl, musicUrl } = await req.json() as {
      clips: RenderClip[]
      voiceoverUrl?: string
      musicUrl?: string
    }

    if (!clips?.length) return NextResponse.json({ error: 'No clips provided' }, { status: 400 })

    // Build Shotstack edit JSON
    const timeline = {
      soundtrack: {
        src: musicUrl || 'https://shotstack-assets.s3.amazonaws.com/music/unminus/ambisax.mp3',
        effect: 'fadeOut',
        volume: 0.3,
      },
      tracks: [
        // Voiceover track (on top)
        voiceoverUrl ? {
          clips: [{
            asset: { type: 'audio', src: voiceoverUrl, volume: 1 },
            start: 0,
            length: clips.reduce((sum, c) => sum + c.duration, 0),
          }],
        } : null,
        // Video clips track
        {
          clips: clips.map((clip, i) => ({
            asset: { type: 'video', src: clip.url, trim: clip.start },
            start: clips.slice(0, i).reduce((sum, c) => sum + c.duration, 0),
            length: clip.duration,
            transition: i > 0 ? { in: 'fade', out: 'fade' } : undefined,
          })),
        },
      ].filter(Boolean),
    }

    const edit = {
      timeline,
      output: {
        format: 'mp4',
        resolution: 'hd', // 1080p
        aspectRatio: '9:16', // Vertical for social
        fps: 30,
      },
    }

    // Submit render job to Shotstack
    const res = await fetch(`https://api.shotstack.io/${SHOTSTACK_ENV}/render`, {
      method: 'POST',
      headers: {
        'x-api-key': SHOTSTACK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(edit),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Shotstack render error:', err)
      return NextResponse.json({ error: 'Failed to start render' }, { status: 500 })
    }

    const data = await res.json()

    // Log usage
    await logUsage(user.id, {
      service: 'shotstack',
      action: 'render',
      estimatedCostUsd: COSTS.shotstack_render,
    })

    return NextResponse.json({
      jobId: data.response?.id,
      message: data.response?.message || 'Render job submitted',
      status: 'queued',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
