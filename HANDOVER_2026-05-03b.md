# Handover — Mercers Platform, 2026-05-03 (session 2)

## What was completed this session

- **Auth lockout fix** (`src/lib/auth-context.tsx`): null callback now sets `loading=true` immediately so the dashboard guard never redirects during Firebase token refresh. Grace period 1.5s → 3s. This was the 5th lockout incident — root cause was Firebase emitting null on page load before restoring session from IndexedDB.
- **Photo Studio crash fix**: Three bugs fixed — (1) transformation chain was broken (`eager: transformations` → `eager: [transformations]`), (2) gen_remove ops defaulted to ON but require a Cloudinary add-on — now default OFF with "Add-on" badge in UI, (3) added `res.ok` guard before reading SSE stream.
- Both changes committed and pushed to master, deployed to production.

---

## Next feature to build

**Listing-Centric Conversational Workflow with Client Portal**

This is in Dev Assist (FeatureRequest table, status: `new`, priority: `high`). Dawn's request:

> Build a threaded messaging system within the agent workstation where property listings serve as primary conversation threads, with additional freeform threads for general business management. Clients receive a dedicated portal with full transaction visibility, AI-driven reminders, and milestone tracking mirroring the agent experience. AI integration across all threads proactively coordinates actions for both agents and clients, ensuring nothing falls through the gaps.

This is a major feature. Before writing any code, read the existing codebase carefully:

- **Working dir:** `C:\Users\garyu\projects\Property`
- **Stack:** Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS 4
- **DB:** Neon Postgres via Prisma 7 (see `prisma/schema.prisma`) — uses pg adapter pattern, NOT standard PrismaClient constructor
- **Auth:** Firebase (custom claims: `role` field — `dev`/`admin`/`agent`/`user`)
- **Deploy:** `npx vercel --prod --yes`
- **Live:** https://mercers-properties.vercel.app
- **GitHub:** https://github.com/Gary-Aitchison-GitH/mercers-platform (branch: master)

### Existing data models relevant to this feature (check schema.prisma for exact fields)
- `Listing` — property listings, has `agentId`
- `Client` — buyer/seller records, has `assignedAgent`
- `Agent` — portal users with roles
- `Conversation` + `Message` — already exist in DB (check schema for current shape before designing)

### Suggested approach
1. Read `prisma/schema.prisma` to understand what's already there (Conversation/Message models may already exist)
2. Plan the data model additions needed (threads per listing, client portal access tokens, milestones)
3. Agree the plan with Gary before any code
4. Build incrementally: agent-side threading first, then client portal, then AI layer

### Key constraints
- Prisma 7 uses the pg adapter pattern — see `src/lib/db.ts` for how to construct the client. Never use `new PrismaClient()` directly.
- BOM warning: never add Vercel env vars via PowerShell stdin — use Bash `printf 'value' | npx vercel env add KEY production`
- Read `node_modules/next/dist/docs/` before writing any new Next.js patterns (this is Next.js 16 with breaking changes)

### Business context
- **Dawn Brown** — principal/admin, strategic lead (Gary's mum)
- **Gary** — dev role, builds the platform
- Agents are invite-only; clients self-register or land via Register Interest on listings
