import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { logUsage, checkQuota, COSTS } from '@/lib/usage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const XAI_API_KEY = process.env.XAI_API_KEY!

const PLATFORM_RULES: Record<string, string> = {
  twitter:   'X/Twitter: max 280 chars, casual tone, max 1 hashtag, punchy and engaging',
  instagram: 'Instagram: 150-300 chars, warm tone, 3-5 relevant hashtags, location tag if available',
  linkedin:  'LinkedIn: professional tone, 200-400 chars, no hashtag spam, insightful',
  tiktok:    'TikTok: casual/fun, 3-5 hashtags, trending language, short and energetic',
  facebook:  'Facebook: warm and personal, 100-200 chars, conversational',
  youtube:   'YouTube Shorts: descriptive, 100 chars, clear subject',
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

    const { location, date, contentType, platforms, imageBase64, mimeType } = await req.json()

    const contextInfo = [
      location ? `Location: ${location}` : null,
      date ? `Date: ${date}` : null,
      contentType ? `Content type: ${contentType}` : null,
    ].filter(Boolean).join('\n')

    const platformList = (platforms || Object.keys(PLATFORM_RULES)).map((p: string) => ({
      key: p,
      rule: PLATFORM_RULES[p] || p,
    }))

    const prompt = `You are a social media content expert. Generate captions for the provided image for multiple platforms.

Context:
${contextInfo || 'No metadata available'}

Generate one caption per platform following these rules:
${platformList.map((p: {key: string, rule: string}) => `- ${p.key}: ${p.rule}`).join('\n')}

Respond ONLY with a valid JSON object where keys are platform names and values are caption strings. No markdown, no explanation. Example:
{"twitter":"caption here","instagram":"caption here","linkedin":"caption here","tiktok":"caption here","facebook":"caption here","youtube":"caption here"}`

    const messages: {role: string, content: ({type: string, image_url?: {url: string}, text?: string})[]}[] = [
      {
        role: 'user',
        content: [],
      }
    ]

    if (imageBase64 && mimeType) {
      messages[0].content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } })
    }
    messages[0].content.push({ type: 'text', text: prompt })

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageBase64 ? 'grok-2-vision-latest' : 'grok-3-latest',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('xAI captions error:', err)
      const fallback: Record<string, string> = {}
      platformList.forEach((p: {key: string}) => { fallback[p.key] = `Check out this ${contentType || 'photo'}! ${location ? `📍 ${location}` : ''}` })
      return NextResponse.json(fallback)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'

    // Log usage
    await logUsage(user.id, {
      service: 'xai',
      action: 'caption',
      estimatedCostUsd: COSTS.xai_caption,
    })

    try {
      const captions = JSON.parse(text)
      return NextResponse.json(captions)
    } catch {
      const fallback: Record<string, string> = {}
      platformList.forEach((p: {key: string}) => { fallback[p.key] = `Check out this ${contentType || 'photo'}!` })
      return NextResponse.json(fallback)
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
