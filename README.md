# Autopilot - Personal Brand Autopilot

AI-powered social media management for personal brands. MVP focuses on Twitter/X automation.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

Create a `.env.local` file with these keys:

### Required Keys

| Variable | Description | Get from |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | [clerk.com](https://clerk.com) → Applications → Your App → API Keys |
| `CLERK_SECRET_KEY` | Clerk secret key | Same as above |
| `X_OAUTH_CLIENT_ID` | X OAuth Client ID | [developer.x.com](https://developer.x.com) → Your App → OAuth ID |
| `X_OAUTH_CLIENT_SECRET` | X OAuth Client Secret | [developer.x.com](https://developer.x.com) → Your App → OAuth Client Secret |
| `XAI_API_KEY` | xAI (Grok) API key | [console.x.ai](https://console.x.ai) → API Keys |

### Optional Keys

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app URL | http://localhost:3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/generate/       # AI content generation
│   │   ├── auth/twitter/      # X OAuth flow
│   │   └── tweets/post/       # Post/schedule tweets
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── compose/           # Write tweets
│   │   ├── schedule/          # View scheduled posts
│   │   ├── connections/       # Connect X account
│   │   └── ai/                # AI content generator
│   ├── layout.tsx             # Root layout with Clerk
│   └── page.tsx               # Landing page
├── lib/
│   ├── queue.ts               # BullMQ scheduling
│   └── utils.ts               # Utility functions
└── middleware.ts              # Clerk auth protection
```

## Features

1. **Connect X Account** - OAuth 2.0 PKCE flow via `/api/auth/twitter`
2. **Post Now** - Immediate tweet posting via `/api/tweets/post`
3. **Schedule Posts** - Queue tweets for later via BullMQ + Redis
4. **AI Content Generation** - Generate tweet drafts via Grok (xAI)

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Auth**: Clerk
- **Database**: PostgreSQL (Supabase/Neon) - optional for MVP
- **Queue**: BullMQ + Redis - optional for MVP
- **AI**: Grok (xAI)

## Development

```bash
# Run tests
npm run test

# Lint
npm run lint

# Build for production
npm run build
```

## Deployment

Recommended: **Vercel** (frontend) + **Railway** (Redis)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Notes

- The dashboard (`/dashboard/*`) is protected by Clerk - requires authentication
- API routes currently check for valid Clerk session
- For local development without auth, you can temporarily modify middleware
