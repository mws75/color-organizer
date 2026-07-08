# Color Palette Organizer

Playful little app for collecting color palettes. Name your colors, group them
into palettes (up to 20 colors each), copy hex codes with a click, and export
any palette as CSS variables, JSON, or Markdown.

Built with Next.js (App Router), Clerk auth, and raw SQL against the shared
PlanetScale database (`one-offs-v2`, tables prefixed `cp_`). Deploys to Vercel.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables** — copy `.env.local.example` to `.env.local` and fill in:

   - `DATABASE_HOST` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_NAME` —
     same PlanetScale credentials the let-em-cook app uses (`vercel env pull` from
     that project, or the PlanetScale dashboard). `DATABASE_NAME` is `one-offs-v2`.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — create a new
     application at [dashboard.clerk.com](https://dashboard.clerk.com).

3. **Create the tables** — run `db/schema.sql` against `one-offs-v2` (PlanetScale
   console or `pscale shell`). It creates `cp_users` and `cp_color_palettes`.

4. **Run it**

   ```bash
   npm run dev
   ```

## Deploying to Vercel

Import the repo in Vercel and set the same six environment variables in
Project Settings → Environment Variables. No other configuration needed.

## How it's wired

- `app/page.tsx` — main page: palette list, Create New, signed-out hero.
- `app/components/PaletteOverlay.tsx` — RecipeCard-style overlay for create/edit
  (click the palette name on a card to edit it).
- `app/api/palettes` — GET (list) / POST (create); `app/api/palettes/[id]` —
  PUT (update) / DELETE. All queries are scoped to the signed-in user.
- `lib/auth.ts` — maps the Clerk user to `cp_users.user_id`, cached in Clerk
  `publicMetadata.cpUserId` after the first request.
- `lib/exporters.ts` — client-side CSS/JSON/Markdown file generation.
- `cp_users` includes `stripe_customer_id` / `stripe_subscription_id` /
  `plan_tier` for future billing — nothing reads them yet.
