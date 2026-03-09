import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { upsertUser, saveUserTokens } from '@/lib/db'

const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'
const X_CLIENT_ID = (process.env.X_OAUTH_CLIENT_ID || '').trim()
const X_CLIENT_SECRET = (process.env.X_OAUTH_CLIENT_SECRET || '').trim()
const REDIRECT_URI = 'https://autopilot-self.vercel.app/api/auth/twitter/callback'

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || state !== user.id) {
    return NextResponse.json({ error: 'Invalid callback' }, { status: 400 })
  }

  // Get code verifier from cookie
  const cookieHeader = req.headers.get('cookie') || ''
  const codeVerifier = cookieHeader.match(/tv_code_verifier=([^;]+)/)?.[1]

  if (!codeVerifier) {
    return NextResponse.json({ error: 'Missing code verifier' }, { status: 400 })
  }

  try {
    // Exchange code for tokens
    const credentials = btoa(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`)

    const response = await fetch(X_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Token exchange failed:', error)
      const msg = encodeURIComponent(error.slice(0, 200))
      return NextResponse.redirect(new URL(`/dashboard/connections?error=${msg}`, req.url))
    }

    const tokens = await response.json()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Upsert user in DB
    const email = user.emailAddresses?.[0]?.emailAddress || ''
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    await upsertUser(user.id, email, name)

    // Store tokens in DB (not cookies)
    await saveUserTokens(user.id, tokens.access_token, tokens.refresh_token || null, expiresAt)

    // Set a simple "connected" flag cookie (no sensitive data)
    const response2 = NextResponse.redirect(new URL('/dashboard/connections?connected=true', req.url))
    response2.headers.set(
      'Set-Cookie',
      `x_connected=1; HttpOnly; Path=/; Max-Age=31536000; SameSite=Lax`
    )
    return response2
  } catch (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard/connections?error=auth_failed', req.url))
  }
}
