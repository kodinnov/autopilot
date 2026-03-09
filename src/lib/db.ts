import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL!

// Singleton connection
const sql = postgres(DATABASE_URL, { ssl: 'require' })

export default sql

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(clerkId: string, email: string, name: string) {
  const [user] = await sql`
    INSERT INTO users (clerk_id, email, name)
    VALUES (${clerkId}, ${email}, ${name})
    ON CONFLICT (clerk_id) DO UPDATE
    SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
    RETURNING *
  `
  return user
}

export async function getUserByClerkId(clerkId: string) {
  const [user] = await sql`SELECT * FROM users WHERE clerk_id = ${clerkId}`
  return user || null
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
export async function saveUserTokens(
  clerkId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date
) {
  await sql`
    INSERT INTO tokens (clerk_id, access_token, refresh_token, expires_at)
    VALUES (${clerkId}, ${accessToken}, ${refreshToken}, ${expiresAt})
    ON CONFLICT (clerk_id) DO UPDATE
    SET access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
  `
}

export async function getUserTokens(clerkId: string) {
  const [row] = await sql`SELECT * FROM tokens WHERE clerk_id = ${clerkId}`
  return row || null
}

// ─── Scheduled Posts ──────────────────────────────────────────────────────────
export async function saveScheduledPost(
  clerkId: string,
  content: string,
  scheduledFor: Date
) {
  const [post] = await sql`
    INSERT INTO scheduled_tweets (clerk_id, content, scheduled_for, status)
    VALUES (${clerkId}, ${content}, ${scheduledFor}, 'pending')
    RETURNING *
  `
  return post
}

export async function getScheduledPosts(clerkId: string) {
  return sql`
    SELECT * FROM scheduled_tweets
    WHERE clerk_id = ${clerkId}
    ORDER BY scheduled_for ASC
  `
}

export async function updatePostStatus(id: string, status: 'pending' | 'posted' | 'failed', tweetId?: string) {
  await sql`
    UPDATE scheduled_tweets
    SET status = ${status}, tweet_id = ${tweetId || null}, updated_at = NOW()
    WHERE id = ${id}
  `
}
