import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ connected: false })

  try {
    const rows = await query(
      'SELECT access_token FROM tokens WHERE clerk_id = $1 LIMIT 1',
      [user.id]
    )
    return NextResponse.json({ connected: rows.length > 0 && !!rows[0].access_token })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
