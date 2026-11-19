# SnapLoop

SnapLoop is a lightweight social app built with Next.js and Supabase. It includes:

- Google sign-in
- a home feed
- post creation with image upload
- likes, comments, follows, and notifications
- profile pages

## Tech stack

- Next.js 15
- React 19
- Supabase Auth + Postgres
- TypeScript
- Tailwind CSS-ready styling approach (custom inline styles in the current UI)

## Prerequisites

- Node.js 18+
- npm
- a Supabase project
- a Google OAuth client

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Create a `.env.local` file in the root of the project using the example:

```bash
cp .env.example .env.local
```

Then fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3) Set up Supabase

In your Supabase dashboard:

1. Create a new project
2. Open SQL Editor
3. Run the schema from [supabase-schema.sql](supabase-schema.sql)
4. Make sure the `posts` storage bucket exists
5. Enable Google Auth under Authentication > Providers

### Google OAuth setup

In Supabase Auth > Providers > Google:

- enable Google provider
- add your client ID and secret
- allow redirect URLs like:

```text
http://localhost:3000/auth/callback
```

If deploying to production, add your production domain as well:

```text
https://your-domain.com/auth/callback
```

## 4) Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## 5) Production checks

Before deploying, verify:

```bash
npm run build
npm run lint
```

## Project structure

- `app/` — routes and page layouts
- `components/` — UI components
- `lib/supabase/` — client/server Supabase setup
- `supabase-schema.sql` — database schema and RLS policies

## Notes

This app expects the Supabase environment variables to be present at runtime. If you skip the database setup or Google Auth configuration, the login and post flows will fail even though the app builds correctly.
