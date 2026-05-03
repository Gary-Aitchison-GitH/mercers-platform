# Mercers Platform — Handover Prompt

Use this as your opening message in a fresh Claude Code context window.

---

## Paste this:

I'm continuing work on the Mercers Kensington real estate platform. Working directory: `C:\Users\garyu\projects\Property`. Please read memory before we start.

**Platform:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Anthropic SDK. DB: Neon Postgres via Prisma 7. Auth: Firebase. Deployed manually: `npx vercel --prod --yes`. Live at https://mercers-properties.vercel.app.

**What's working as of 2026-05-03:**
- Full public site with EN/Shona/Ndebele language support
- Public listing detail pages at `/listings/[id]` with image gallery, Register Interest modal
- AI chat widget (Claude Sonnet 4.6, live DB listings context)
- Firebase auth — public signup, agent portal login, role-based access (dev/admin/agent/user)
- Auth lockout fix: 1.5s grace period in `src/lib/auth-context.tsx` handles Firebase token refresh race condition
- Agent portal tabs: Home AI, Listings, Clients, My Profile, Admin (admin only)
- Listings and Clients tabs each have Mine/All scope toggle — any agent can see full team view
- All Listings (All scope): shows assigned agent name on each card
- All Clients (All scope): agents see assigned agent read-only; admin gets reassignment dropdown
- My Profile tab: photo upload (resize to 400px), job title, phone, bio with AI improve, specialties + areas tags
- Agent onboarding: invite token → /agents/setup → auto sign-in
- Public Our Agents page + homepage agents section: live DB agents (inviteStatus: 'active' only)
- Contact Agent modal on both homepage and agents page
- Homepage: real agent cards replace old AI intake widget
- Agent job title: display `role` field separate from Firebase permission claim; defaults to 'Property Consultant' if blank
- Admin: invite route sets display role to '' (agents fill via My Profile)
- Marketing AI, Dev Assist AI with collapsible resolved section
- Listing photos: constrained to content width on desktop (max-w-5xl, rounded corners)
- Agent card photos: h-56 container, objectPosition center 35% for headshots

**Known pending items:**
- Custom domain mercers.properties (Cloudflare DNS → Vercel) not yet done
- Resend email sandboxed — only delivers to Resend account owner until mercers.co.zw domain verified
- `proxy.ts` in project root is dead code — can be deleted
- Dawn and Craig need to complete their My Profile (job title, bio, photo, specialties, areas)
- AgentCard photo position (center 35%) is tuned for Dawn's photo — may need adjustment when more agents add photos

**Branch:** master. GitHub: https://github.com/Gary-Aitchison-GitH/mercers-platform

What would you like to work on?
