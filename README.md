# Photo Gallery

A private, password-gated photo gallery built for a specific friend
group. There are no user accounts. Instead, visitors enter a shared
password to get in, then browse photos organized by person, with
view counts, download counts, and a "hype" (like) button on every
photo.

## Features

- Password-based entry instead of a login system
- One gallery per friend, with infinite scroll
- View count, download count, and hype count tracked per photo
- A Highlights tab showing the most viewed, most hyped, and most
  downloaded photos across everyone
- Photos are resized into three sizes (thumbnail, medium, original)
  on upload, so the browser never downloads a full-size photo just
  to show a small grid tile

## How it's built

| Layer | Tech | Role |
|---|---|---|
| Frontend | Next.js (App Router) | Pages, routing, image handling |
| Database | Supabase (Postgres) | Friend list, view/hype/download counts |
| Storage | Cloudflare R2 | The actual photo files, three sizes each |
| Auth | Signed cookie + hashed password | No accounts or user database |
| Styling | Tailwind CSS | No separate CSS files, no runtime cost |

## Quick start

```bash
git clone <this repo>
cd photo-gallery
npm install
# create .env.local — see "Setup" below for what goes in it
npm run dev
```

## Setup

### 1. Supabase

1. Create a project at supabase.com.
2. Open the SQL Editor, paste in the contents of `supabase/schema.sql`, and run it. This creates the `photos` and `hype_log` tables and the database functions used for counting.
3. Go to Project Settings → API. You'll need the Project URL, the `anon`/`publishable` key, and the `service_role`/`secret` key.

### 2. Cloudflare R2

1. Create an R2 bucket.
2. Under the bucket's Settings tab, enable the Public Development URL (or connect a custom domain if you have one).
3. From R2 → Manage API Tokens, create a token scoped to this bucket only, with Object Read & Write permission. Save the Access Key ID and Secret Access Key shown — the secret is only shown once.
4. Copy your Account ID from the R2 overview page.

### 3. Environment variables

Create `.env.local` in the project root:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_STORAGE_BASE=

COOKIE_SECRET=
PASSWORD_HASH=
```

- `COOKIE_SECRET` — any long random string. Generate one with:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- `PASSWORD_HASH` — a SHA-256 hash of the gallery password, lowercased with all non-alphanumeric characters removed first. Generate it with:
  ```
  node -e "const c=require('crypto');const a='YOUR_PASSWORD_HERE';console.log(c.createHash('sha256').update(a.toLowerCase().replace(/[^a-z0-9]/g,'')).digest('hex'))"
  ```
- The text shown on the entry screen itself is not an environment variable — it's set directly in `components/PasswordGate.tsx`.

### 4. Image domain

Next.js only loads images from domains explicitly listed in `next.config.js`. Update the hostname there to match your R2 public URL or custom domain:

```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-bucket-url-here.r2.dev',
      pathname: '/**',
    },
  ],
},
```

## Adding photos

Organize photos into one folder per person:

```
photos/
├── Alex/
│   ├── img1.jpg
│   ├── img2.jpg
├── Priya/
│   ├── img1.jpg
```

Then upload each folder:

```
npm run upload ./photos/Alex
```

The folder name becomes that person's name in the gallery. For each photo, this script generates the three sizes, uploads them to R2, and creates the matching row in Supabase. Running it again on the same folder skips photos already uploaded rather than duplicating them.

## Deployment

Deployed on Vercel. Connect the repo, then add the same `.env.local` values as environment variables in the Vercel project settings.

## Reusing this for a different group

Friend names are fully dynamic — any folder name under `photos/` becomes a gallery automatically, with no code changes. Two things are not environment variables and would need to be edited directly for a different deployment:

- The image hostname in `next.config.js`, which must match wherever your photos are actually hosted
- The entry screen text in `components/PasswordGate.tsx` (the password itself is configured through `.env.local`)

## Project structure

```
app/
  page.tsx               — dashboard (gallery tabs + highlights)
  [friend]/page.tsx      — one friend's photo grid
  gate/page.tsx          — password entry screen
  api/                   — auth, view/hype/download tracking, data routes
components/
  PhotoGrid.tsx           — infinite-scroll photo grid
  Lightbox.tsx            — full-screen photo viewer
  HighlightsRow.tsx       — most viewed/hyped/downloaded rows
  PasswordGate.tsx        — the entry form
lib/
  db.ts                   — all Supabase reads/writes
  r2-client.ts            — all R2 reads/writes
  auth.ts                 — cookie signing/verification
scripts/
  upload.ts               — batch photo upload script
supabase/
  schema.sql              — database tables and functions
```

## Known tradeoffs

- Highlights data refreshes when the tab is opened or refocused, not continuously. There's no live polling or websocket connection — this was a deliberate choice to avoid unnecessary server load for a small group.
- When two photos are tied on views, hype, or downloads, the more recently active one is shown first. Photos with no activity yet have no defined order among themselves.
- Cloudflare's Public Development URL (used if no custom domain is connected) is intended for development use and may be rate-limited more aggressively than a custom domain.