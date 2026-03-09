import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  return NextResponse.json({
    DATABASE_URL: dbUrl ? `SET (${dbUrl.slice(0, 60)}...)` : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  })
}
