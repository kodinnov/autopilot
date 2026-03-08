import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    
    const prompt = `You are a social media expert helping a personal brand grow their following. 
Generate an engaging ${platform} post about: "${topic}"
- Tone: ${tone}
- Max length: ${maxLength} characters
- Include relevant hashtags if appropriate
- Make it engaging and authentic
- Write in first person as the personal brand

Generate 3 different options:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
