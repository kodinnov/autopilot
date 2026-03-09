import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const getOpenAI = () => new OpenAI({
  apiKey: process.env.XAI_API_KEY || 'placeholder',
  baseURL: 'https://api.x.ai/v1',
})

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, tone = 'professional', platform = 'twitter' } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const maxLength = platform === 'twitter' ? 280 : 2200
    
    const prompt = `You are a social media expert. Generate exactly 3 tweets about: "${topic}"
- Tone: ${tone}
- Max ${maxLength} characters each
- Include relevant hashtags
- Write in first person
- Output ONLY the 3 tweets separated by blank lines
- No numbering, no markdown, no labels, no character counts, no "Option X"
- Just the raw tweet text`

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: 'You are a social media expert.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content || ''
    
    // Parse the response to extract individual tweets
    const tweets = content
      .split(/\n\d+\.|\n---|\n\n/)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0 && t.length <= maxLength)
      .slice(0, 3)

    return NextResponse.json({
      success: true,
      suggestions: tweets,
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
