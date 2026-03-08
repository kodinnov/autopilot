# Autopilot - Personal Brand Autopilot

AI-powered social media management for personal brands. MVP focuses on Twitter/X automation.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Environment Variables

Create a `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Supabase/Neon)
DATABASE_URL=postgresql://...

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# X/Twitter API
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_TOKEN_SECRET=...

# AI (OpenAI or xAI/Grok)
OPENAI_API_KEY=sk-...
# OR
XAI_API_KEY=...
```

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Auth**: Clerk
- **Database**: PostgreSQL (Supabase/Neon)
- **Queue**: BullMQ + Redis
- **AI**: OpenAI or Grok

## Features

- Connect Twitter/X account via OAuth
- Post tweets immediately or schedule for later
- AI-powered content generation
- Dashboard with post history and analytics
