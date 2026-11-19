# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent projects in one git repo (no root package.json; run commands inside each folder):

- `rodrick-blog/` - Next.js 16 / React 19 / Tailwind v4 travel + photography blog (Vercel root directory). Backed by Supabase (Postgres) and Cloudinary (images).
- `rodrick-blog-mobile/` - React Native CLI (no Expo) companion app. Has its own [CLAUDE.md](rodrick-blog-mobile/CLAUDE.md) with design rules, token colors and workflow conventions; read it before touching mobile code. Android environment setup is in `rodrick-blog-mobile/SETUP.md`.

The user communicates in Vietnamese; project docs are in Vietnamese.

## Commands

Web (`cd rodrick-blog`):
- `npm run dev` - dev server on port 3000 (also configured in `.claude/launch.json`)
- `npm run build` / `npm run start` - production build and serve; before pushing to Vercel, delete `.next` first and verify the build
- `npm run lint`
- No test runner is configured for the web app.
- Needs `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- If Tailwind v4 reports a missing `@tailwindcss/oxide-win32-x64-msvc` on Windows: `npm install @tailwindcss/oxide-win32-x64-msvc --save-optional`.

Mobile (`cd rodrick-blog-mobile`): `npm start` (Metro), `npm run android`, `npm run ios`, `npm run lint`, `npm test` (single test: `npx jest __tests__/App.test.tsx`), `npx tsc --noEmit`.

## Web architecture

No `src/` directory. Layered: `app/` (routes: `/`, `trips`, `trips/[slug]`, `trips/new`, `editor`, `admin`, `api/cloudinary`) -> `components/` (auth, editor, gallery, home, itinerary, layout, ui) -> `services/` (`itinerary.service.ts`, `gallery.service.ts`: Supabase queries) -> `lib/` (`supabase.ts` client, `cloudinary.ts` URL helper, `timeUtils.ts`, `tripFormat.ts`) -> `types/` (`database.type.ts`, `itinerary.type.ts`).

Data model (4 Supabase tables): `trips` -> `timeline_events` (per-day/time milestones, `map_embed_url`) -> `images` (Cloudinary URLs; `timeline_event_id` links photos to a milestone, `collection_id` to an album, `is_real_photo` distinguishes own Sony A6400 photos from reference images); `collections` are albums. RLS is disabled on these tables so the in-app editor/admin can write directly.

Read `rodrick-blog/AGENT.md` (detailed spec, Vietnamese) before UI or data work. Key rules from it and `AGENTS.md`:
- **Next.js here has breaking changes** vs. training data: read the relevant guide in `rodrick-blog/node_modules/next/dist/docs/` before writing code.
- With `cacheComponents`, do not use `export const revalidate`; put `export const instant = false;` in pages that query Supabase (or use `"use cache"` in the async function).
- Fonts: Plus Jakarta Sans (headings/mono) + Inter (body). Never use serif fonts or serif fallbacks. In `globals.css` use `@theme inline` (not `@theme`) so `next/font` variables work on Vercel.
- Design lock: paper `#FAF8F5`, text `#1A1A1A`, single accent vermilion `#B61C25`, gold `#C59F60` for subtle detail; light theme only (except the image lightbox). No em/en dashes in UI text or data (use `-` or `•`). No pills overlaid on photos, except the sticky-tag in `components/ui/PhotoFrame.tsx`. Avoid even 3-column card grids. UI work must follow `.claude/skills/design-taste-frontend/SKILL.md`.
- Maps: the web no longer shows maps (since 20/11); routes are edited only in the mobile app (`event_maps` table). Map code stays behind `WEB_MAP_ENABLED` in `lib/featureFlags.ts` (`NEXT_PUBLIC_ENABLE_WEB_MAP=true`); when off, never send `map_embed_url` on save (it would overwrite old data with null). If re-enabled: plain `<iframe>` embed only, no Maps JavaScript API.
- Cloudinary images: insert `f_auto,q_auto/` right after `/upload/` (helper in `lib/cloudinary.ts`).
