# Mercers Platform — Handover Prompt

Use this as your opening message in a fresh Claude Code context window.

---

## Paste this:

I'm continuing work on the Mercers Kensington real estate platform. Working directory: `C:\Users\garyu\projects\Property`. Please read memory before we start.

**Platform:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Anthropic SDK. DB: Neon Postgres via Prisma 7. Auth: Firebase. Deployed manually: `npx vercel --prod --yes`. Live at https://mercers-properties.vercel.app.

**What's working as of 2026-05-03:**
- Full public site with EN/Shona/Ndebele language support
- AI chat widget and intake form (Claude Sonnet 4.6, live DB listings context)
- Firebase auth — public signup, agent portal login, role-based access (dev/admin/agent/user)
- Agent portal: Home AI, Listings CRUD, Clients tab with agent assignment dropdown (admin only), Marketing AI, Dev Assist AI
- Dev Assist right panel and admin dashboard Feature Requests both filter done/declined into a collapsible section
- Agent onboarding: invite token → /agents/setup page → auto sign-in
- Admin home AI has full client list with agent assignments and unassigned client section
- Auth race condition fixed in `src/lib/auth-context.tsx` (setLoading(true) at callback start)

**Known pending items:**
- Custom domain mercers.properties (Cloudflare DNS → Vercel) not yet done
- Resend email domain verification for mercers.co.zw deferred
- `proxy.ts` in project root is dead code — can be deleted

**Branch:** master. GitHub: https://github.com/Gary-Aitchison-GitH/mercers-platform

What would you like to work on?
