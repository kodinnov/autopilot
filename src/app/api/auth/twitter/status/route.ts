import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ connected: false })

  const cookieHeader = req.headers.get('cookie') || ''
  const tokensCookie = cookieHeader.match(/x_tokens=([^;]+)/)?.[1]

  if (!tokensCookie) return NextResponse.json({ connected: false })

  try {
    const tokens = JSON.parse(decodeURIComponent(tokensCookie))
    const connected = !!tokens.accessToken
    return NextResponse.json({ connected })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
