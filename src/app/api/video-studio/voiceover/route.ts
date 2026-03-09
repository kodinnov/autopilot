import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'
import { logUsage, checkQuota, COSTS } from '@/lib/usage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!

// Default voices - Rachel is natural and clear
const VOICES: Record<string, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',      // Rachel - natural, clear
  adam: 'pNInz6obpgDQGcFmaJgB',        // Adam - deep, warm
  bella: 'EXAVITQu4vr4xnSDxMaL',       // Bella - soft, calm
  josh: 'TxGEqnHWrfWFTfGW9XjX',        // Josh - young, energetic
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

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    const { script, voice = 'rachel' } = await req.json()

    if (!script) return NextResponse.json({ error: 'No script provided' }, { status: 400 })

    const voiceId = VOICES[voice] || VOICES.rachel

    // Call ElevenLabs TTS API
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('ElevenLabs error:', err)
      return NextResponse.json({ error: 'Failed to generate voiceover' }, { status: 500 })
    }

    // Get audio as buffer
    const audioBuffer = await res.arrayBuffer()

    // Upload to Vercel Blob
    const blob = await put(`voiceovers/${user.id}/${Date.now()}.mp3`, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
    })

    // Log usage (cost based on character count)
    await logUsage(user.id, {
      service: 'elevenlabs',
      action: 'voiceover',
      tokensUsed: script.length,
      estimatedCostUsd: script.length * COSTS.elevenlabs_voiceover,
    })

    return NextResponse.json({
      audioUrl: blob.url,
      voice,
      scriptLength: script.length,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
