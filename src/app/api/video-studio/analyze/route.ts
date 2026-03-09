import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const XAI_API_KEY = process.env.XAI_API_KEY!

export interface FrameAnalysis {
  timestamp: number
  rating: 'boring' | 'ok' | 'good' | 'great' | 'viral'
  score: number
  faces: boolean
  action: boolean
  emotion: string
  speech: boolean
  description: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { frames } = await req.json() as {
      frames: { timestamp: number; base64: string; mimeType: string }[]
    }

    if (!frames?.length) return NextResponse.json({ error: 'No frames provided' }, { status: 400 })

    const analyses: FrameAnalysis[] = []

    for (const frame of frames) {
      const prompt = `Analyze this video frame for social media content potential. Respond ONLY with a valid JSON object.

Rate the frame and detect:
- rating: "boring" | "ok" | "good" | "great" | "viral"
- score: 0-100 (overall interest/engagement potential)  
- faces: true/false (are human faces visible?)
- action: true/false (is there movement/action happening?)
- emotion: one word (happy/excited/calm/dramatic/neutral/etc)
- speech: true/false (does it look like someone is speaking?)
- description: 1 sentence describing the key moment

Example: {"rating":"great","score":82,"faces":true,"action":false,"emotion":"happy","speech":true,"description":"Person laughing while looking at camera in golden hour light"}`

      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'grok-2-vision-latest',
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${frame.mimeType};base64,${frame.base64}` } },
                { type: 'text', text: prompt },
              ],
            }],
            max_tokens: 200,
            temperature: 0,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data.choices?.[0]?.message?.content?.trim() || '{}'
          try {
            const parsed = JSON.parse(text)
            analyses.push({ timestamp: frame.timestamp, ...parsed })
          } catch {
            analyses.push({ timestamp: frame.timestamp, rating: 'ok', score: 50, faces: false, action: false, emotion: 'neutral', speech: false, description: 'Video frame' })
          }
        } else {
          analyses.push({ timestamp: frame.timestamp, rating: 'ok', score: 50, faces: false, action: false, emotion: 'neutral', speech: false, description: 'Video frame' })
        }
      } catch {
        analyses.push({ timestamp: frame.timestamp, rating: 'ok', score: 50, faces: false, action: false, emotion: 'neutral', speech: false, description: 'Video frame' })
      }
    }

    // Select best segments (top 30-60s of content)
    const sorted = [...analyses].sort((a, b) => b.score - a.score)
    const selectedTimestamps = new Set(sorted.slice(0, Math.min(15, sorted.length)).map(f => f.timestamp))

    return NextResponse.json({
      analyses,
      selected: analyses.filter(a => selectedTimestamps.has(a.timestamp)),
      totalScore: Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
