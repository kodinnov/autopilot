import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const XAI_API_KEY = process.env.XAI_API_KEY!

interface ClipInfo {
  timestamp: number
  duration: number
  description: string
  emotion: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { clips, tone = 'energetic', totalDuration = 30 } = await req.json() as {
      clips: ClipInfo[]
      tone: 'energetic' | 'calm' | 'storytelling' | 'professional'
      totalDuration: number
    }

    if (!clips?.length) return NextResponse.json({ error: 'No clips provided' }, { status: 400 })

    const clipDescriptions = clips.map((c, i) => `Clip ${i + 1} (${c.duration}s): ${c.description} [${c.emotion}]`).join('\n')

    const toneGuides: Record<string, string> = {
      energetic: 'Upbeat, exciting, fast-paced narration with energy and enthusiasm. Use punchy phrases.',
      calm: 'Relaxed, peaceful, soothing narration. Speak slowly and thoughtfully.',
      storytelling: 'Narrative style, like telling a friend about an experience. Personal and engaging.',
      professional: 'Clear, polished, confident narration suitable for business or educational content.',
    }

    const prompt = `You are a professional video narrator. Write a voiceover script for a ${totalDuration}-second video.

**Video clips in order:**
${clipDescriptions}

**Tone:** ${toneGuides[tone]}

**Rules:**
- Script should be ~${Math.round(totalDuration * 2.5)} words (about 150 words per minute speaking pace)
- Match the script timing to the clip sequence
- Don't describe what's happening literally — add value, emotion, or context
- End with a memorable closing line
- No stage directions or timestamps — just the spoken words

Write ONLY the voiceover script text, nothing else.`

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.8,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Script generation error:', err)
      return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 })
    }

    const data = await res.json()
    const script = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({
      script,
      wordCount: script.split(/\s+/).length,
      estimatedDuration: Math.round(script.split(/\s+/).length / 2.5),
      tone,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
