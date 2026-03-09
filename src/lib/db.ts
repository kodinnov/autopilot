import { Pool } from 'pg'

// Lazy pool — created on first use so DATABASE_URL is guaranteed to be loaded
let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    _pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    })
  }
  return _pool
}

async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await getPool().connect()
  try {
    const result = await client.query(text, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(clerkId: string, email: string, name: string) {
  const rows = await query(
    `INSERT INTO users (clerk_id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (clerk_id) DO UPDATE
     SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
     RETURNING *`,
    [clerkId, email, name]
  )
  return rows[0]
}

export async function getUserByClerkId(clerkId: string) {
  const rows = await query('SELECT * FROM users WHERE clerk_id = $1', [clerkId])
  return rows[0] || null
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
export async function saveUserTokens(
  clerkId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date
) {
  await query(
    `INSERT INTO tokens (clerk_id, access_token, refresh_token, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_id) DO UPDATE
     SET access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()`,
    [clerkId, accessToken, refreshToken, expiresAt]
  )
}

export async function getUserTokens(clerkId: string) {
  const rows = await query('SELECT * FROM tokens WHERE clerk_id = $1', [clerkId])
  return rows[0] || null
}

// ─── Scheduled Posts ──────────────────────────────────────────────────────────
export async function saveScheduledPost(
  clerkId: string,
  content: string,
  scheduledFor: Date
) {
  const rows = await query(
    `INSERT INTO scheduled_tweets (clerk_id, content, scheduled_for, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [clerkId, content, scheduledFor]
  )
  return rows[0]
}

export async function getScheduledPosts(clerkId: string) {
  return query(
    `SELECT * FROM scheduled_tweets
     WHERE clerk_id = $1
     ORDER BY scheduled_for ASC`,
    [clerkId]
  )
}

export async function updatePostStatus(
  id: string,
  status: 'pending' | 'posted' | 'failed',
  tweetId?: string
) {
  await query(
    `UPDATE scheduled_tweets
     SET status = $1, tweet_id = $2, updated_at = NOW()
     WHERE id = $3`,
    [status, tweetId || null, id]
  )
}
