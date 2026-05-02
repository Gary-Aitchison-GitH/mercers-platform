# Mercers Platform — Master Plan

_Last updated: 2026-05-02_
_Live site: https://mercers-properties.vercel.app_

---

## Honest State of the Platform

### What's working right now ✅
- Public marketing site (home, listings, agents, contact, welcome pages)
- AI chat widget — clients talk to Claude 24/7 (Gary is NOT involved)
- AI agent matching — intake form recommends the best agent
- 3-language support: English / Shona / Ndebele
- Neon Postgres live — conversations persist to DB across server restarts
- Deployed to Vercel

### What's partially built (skeleton only) ⚠️
| Feature | What works | What's missing |
|---------|-----------|----------------|
| Social media pipeline | Claude generates posts in 3 languages | Not connected to any platform (no API keys) |
| SEO agent | Claude generates meta tag recommendations | One-shot only, no feedback loop |
| Contact form | Shows success message | Doesn't actually send emails |
| Admin panel `/admin` | Shows client conversations | Not needed — Gary does NOT monitor client chats |

### What doesn't exist yet ❌
- Firebase Authentication (buyers, sellers, agents — nobody can sign up or log in)
- Buyer/Seller accounts (public sign-up, profile, saved searches)
- Agent accounts (login, logout, change password, role-based access)
- Agent portal (agents cannot manage listings, clients, or anything)
- Listing management (all data is hardcoded — agents cannot add/edit listings)
- Photo upload or AI photo editing
- Agent Panel AI tools (marketing, listing enhancer, dev tool)
- Listing detail pages (`/listings/:id` links go nowhere)
- Real email delivery

---

## Roadmap

### Phase 1 — Infrastructure ✅ COMPLETE (2026-05-02)
- [x] Neon Postgres provisioned and connected
- [x] All DB tables migrated (Agent, Client, Listing, Conversation, Message, etc.)
- [x] 4 agents seeded into DB
- [x] Conversations persist to Neon (no longer lost on restart)
- [x] ANTHROPIC_API_KEY set on Vercel correctly
- [x] Chat widget working on live site with AI responding
- [x] Deployed: https://mercers-properties.vercel.app

---

### Phase 2 — Firebase Authentication 🔴 NEXT UP
_Nobody can log in. This is the foundation for everything else._

#### 2a — Firebase Project Setup (Gary does this — 10 min)
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable **Authentication** → Email/Password provider
- [ ] Enable **Google sign-in** provider (optional but recommended)
- [ ] Go to Project Settings → Service Accounts → Generate new private key (downloads JSON)
- [ ] Add Firebase config to Vercel env vars (see below)

#### 2b — Buyer / Seller accounts (public sign-up)
- [ ] `/signup` page — name, email, password, account type (Buyer / Seller / Both)
- [ ] `/login` page — email + password, forgot password link
- [ ] Firebase Auth on client side (`firebase` npm package)
- [ ] New Prisma model: `User` (linked to Firebase UID, stores buyer/seller profile)
- [ ] Protected routes: profile page, saved searches, enquiry history

#### 2c — Agent accounts (internal staff login)
- [ ] `/agents/login` page — separate login for Mercers agents
- [ ] **Agents are invited only** — no public sign-up. Admin sends invite link via email
- [ ] Invite flow: Admin enters agent email → Firebase generates invite link → agent sets password → done
- [ ] Firebase Admin SDK on server side validates agent tokens
- [ ] Agent `firebaseUid` stored in existing `Agent` Prisma model
- [ ] Protected routes: everything under `/agents/` requires agent auth
- [ ] Change password flow via Firebase (self-service)

#### Role structure
| Role | Who | Permissions |
|------|-----|------------|
| `dev` | Gary | Full admin access + dev tools panel |
| `admin` | Dawn Brown | Invite agents, manage platform, all listings + clients |
| `agent` | Other Mercers agents | Their own listings + clients only |
| `user` | Buyers / Sellers | Public self-register, saved searches, enquiry history |

#### 2d — Auth middleware
- [ ] Next.js middleware protects `/agents/*` routes — redirects to login if not authenticated
- [ ] Server-side token verification using Firebase Admin SDK
- [ ] Role check: only agents can access agent routes

**Firebase env vars needed:**
| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same |
| `FIREBASE_ADMIN_PROJECT_ID` | Service Account JSON |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service Account JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service Account JSON |

---

### Phase 3 — Agent Portal 🔴 NOT STARTED
_Agents log in and can actually do their job._

- [ ] `/agents/dashboard` — overview: assigned listings, clients, conversations
- [ ] Listing management — create / edit listings with image upload (Vercel Blob)
- [ ] Client management — view clients, notes, buyer requirements
- [ ] Conversation history — archived client chats
- [ ] Referral management — send/receive referrals between agents

**Depends on:** Phase 2 (Firebase auth)

---

### Phase 4 — Agent Panel (AI Tools) 🔴 NOT STARTED
_A panel of AI tools agents can open and use._

- [ ] **`/agents/panel`** — tabbed AI tools dashboard
- [ ] **Marketing AI** — pick listing → Claude drafts social posts → review + post to FB/IG/LinkedIn/X
- [ ] **Listing Enhancer** — Claude rewrites descriptions, translates to SN/ND
- [ ] **Photo AI** — upload photo → AI captioning, suggestions
- [ ] **Dev Tool** — Gary + agents + Claude Code: plan features, log issues, track progress
  - This is the ONLY place Gary participates alongside agents
  - Integrated with Claude Code sessions

**Depends on:** Phase 2 (auth), Phase 3 (agent portal exists)

---

### Phase 5 — Public User Features 🔴 NOT STARTED
_Buyers and sellers can do more than just chat._

- [ ] Listing detail pages — `/listings/:id`
- [ ] Buyer: save listings, track enquiries, view matched agents
- [ ] Seller: submit property for listing (agent reviews + publishes)
- [ ] Real email delivery (Resend) — sign-up confirmation, enquiry notifications
- [ ] Contact form actually sends emails

---

### Phase 6 — Polish & Loops 🔴 NOT STARTED
- [ ] SEO feedback loop (track what converts)
- [ ] Social analytics (pull engagement data back)
- [ ] Performance monitoring
- [ ] Rate limiting on all APIs

---

## Environment Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ Set | Working |
| `DATABASE_URL` | ✅ Set | Neon Postgres (pooled) |
| `DATABASE_URL_UNPOOLED` | ✅ Set | Neon Postgres (for migrations) |
| `NEXT_PUBLIC_ADMIN_PASS` | ✅ Set | Can be removed once Firebase auth is done |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ❌ Needed | Phase 2 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ❌ Needed | Phase 2 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ❌ Needed | Phase 2 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ❌ Needed | Phase 2 |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | ❌ Needed | Phase 2 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | ❌ Needed | Phase 2 |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | ❌ Needed | Phase 4 |
| `TWITTER_API_KEY` (+ others) | ❌ Needed | Phase 4 |
| `LINKEDIN_ACCESS_TOKEN` | ❌ Needed | Phase 4 |

---

## Key File Map

| What you're looking for | File |
|------------------------|------|
| Database schema | `prisma/schema.prisma` |
| Agent data (hardcoded, to be replaced) | `src/lib/data/agents.ts` |
| Listing data (hardcoded, to be replaced) | `src/lib/data/listings.ts` |
| All translations (EN/SN/ND) | `src/lib/translations.ts` |
| Chat logic + AI responses | `src/app/api/messages/route.ts` |
| Agent matching logic | `src/lib/matching.ts` |
| SEO agent | `src/app/api/seo/route.ts` |
| Social media agent | `src/app/api/social/route.ts` |
| DB client (Prisma) | `src/lib/db.ts` |
| Conversation store | `src/lib/store.ts` |

---

## Deployment

No GitHub auto-deploy. Deploy manually from project root:
```
npx vercel --yes            # preview
npx vercel --prod --yes     # production
```

---

## Decisions Made

- Gary does NOT monitor or join client chats. The AI handles the public chat widget entirely.
- Gary's only involvement is the Dev Tool in the Agent Panel (Phase 4) — planning features with agents.
- Firebase chosen for auth (not Clerk) — handles both public users and agent staff accounts.
- Admin panel (`/admin`) is deprecated — will be replaced by the proper agent portal in Phase 3.
