# IdeaRank

Group idea voting with cumulative votes. Each participant gets **5 tokens** to allocate freely across ideas — stack them all on one, or spread them out.

## Features

- **Rooms** — share a room code, everyone joins the same session
- **Add ideas** — anyone can submit ideas at any time
- **5-token voting** — allocate up to 5 votes per person, repeats allowed
- **Live dashboard** — results update every 5 seconds, ranked by total votes

---

## Setup

### 1. Run the SQL migration in Supabase

Go to **Supabase Dashboard → SQL Editor → New Query**, paste and run:

```
supabase/migrations/20240001_init.sql
```

This creates `rooms`, `ideas`, and `votes` tables with Row Level Security enabled.

### 2. Set environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in the values from **Supabase Dashboard → Settings → API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `anon` / publishable key |

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy

### Deploy to Vercel (recommended for Next.js + Supabase)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy — Vercel auto-detects Next.js, no extra config needed.

> **Tip:** Use the [Supabase Vercel Integration](https://vercel.com/integrations/supabase) to sync env vars automatically from your Supabase project.

---

## How voting works

Each user has **5 tokens**. They can:
- Put all 5 on one idea (`5, 0, 0 …`)
- Spread them (`2, 2, 1 …`)
- Leave some unspent

The dashboard ranks ideas by **total tokens received** across all voters.
