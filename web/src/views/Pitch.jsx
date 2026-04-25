import { CheckCircle, ArrowRight, Zap, RefreshCw, Shield, TrendingUp, Clock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'

const NAVY = '#1B3A6B'
const GOLD = '#C9A54C'

function Section({ label, children }) {
  return (
    <div className="mb-12">
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: GOLD }}>{label}</p>
      {children}
    </div>
  )
}

function Check({ children }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: GOLD }} />
      <span className="text-sm text-gray-700 leading-relaxed">{children}</span>
    </li>
  )
}

function Phase({ number, title, duration, items }) {
  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      <div
        className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: number === 1 ? NAVY : number === 2 ? GOLD : '#16a34a' }}
      >
        {number}
      </div>
      <div className="absolute left-3 top-6 bottom-0 w-px last:hidden" style={{ background: '#e5e7eb' }} />
      <div className="ml-3">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{duration}</span>
        </div>
        <ul className="space-y-1.5">
          {items.map((item, i) => <Check key={i}>{item}</Check>)}
        </ul>
      </div>
    </div>
  )
}

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="py-10 px-6 text-center" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #2a5aa8 100%)` }}>
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <Mountain size={20} color={GOLD} />
          </div>
          <div className="text-left">
            <span className="font-bold text-white text-lg block leading-none">Mercers</span>
            <span className="text-xs" style={{ color: GOLD }}>Kensington</span>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
          From PropertyBook listing<br />to Mercers Platform
        </h1>
        <p className="text-blue-200 max-w-lg mx-auto text-base leading-relaxed">
          A practical transition plan — zero disruption, full ownership, and a platform that works for Harare and Marondera.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* The honest starting point */}
        <Section label="Where you are today">
          <div className="rounded-2xl border border-gray-200 p-5 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Mercers currently has a strong profile on <strong>PropertyBook</strong> — and that's working. Clients find you there, listings are managed there, and the team knows the workflow.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              The limitation is that <strong>PropertyBook is their platform, not yours</strong>. You can't rank for "estate agents Marondera" on Google when your listings live inside someone else's site. You have no AI, no social automation, no direct client chat, and Marondera has no independent identity.
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: 'rgba(201,165,76,0.08)', border: `1px solid rgba(201,165,76,0.3)` }}
          >
            <strong style={{ color: NAVY }}>The goal isn't to abandon PropertyBook overnight.</strong>
            <span className="text-gray-600"> It's to build Mercers' own platform in parallel, then make a clean transition on your terms.</span>
          </div>
        </Section>

        {/* Transition plan */}
        <Section label="The transition plan">
          <Phase
            number={1}
            title="Run both simultaneously"
            duration="Weeks 1–4"
            items={[
              "PropertyBook stays live — no changes to your current workflow",
              "Mercers Platform goes live with dummy/initial data for testing",
              "Your PropertyBook XML feed is synced hourly to Mercers Platform automatically — listings appear on both with zero manual effort",
              "Team reviews the platform, suggests changes, and gets comfortable with it",
            ]}
          />
          <Phase
            number={2}
            title="Make Mercers Platform the primary"
            duration="Weeks 4–8"
            items={[
              "Mercers Platform becomes the main site you direct clients to",
              "Real agent photos, bios, and contact details replace the placeholders",
              "AI chat is active — clients get instant answers at any hour",
              "Social pipeline starts posting new listings automatically to Facebook, Instagram, LinkedIn and X in English, Shona and Ndebele",
              "PropertyBook remains as a secondary directory for additional reach — no downside to keeping it",
            ]}
          />
          <Phase
            number={3}
            title="Own your Google presence"
            duration="Month 3+"
            items={[
              "SEO engine begins optimising content — targeting 'estate agents Harare', 'property Marondera', local search terms",
              "Mercers Platform starts appearing in Google results independently",
              "Marondera branch gets its own search presence — 'Dawn Brown Mercers Marondera' becomes findable",
              "Reduce dependence on PropertyBook as organic traffic grows",
            ]}
          />
        </Section>

        {/* What the team has to do */}
        <Section label="What the team actually has to do">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: RefreshCw,
                title: 'During transition',
                color: NAVY,
                items: [
                  'Continue using PropertyBook as normal',
                  'Review the Mercers Platform and give feedback',
                  'Confirm agent details are correct',
                ],
              },
              {
                icon: Zap,
                title: 'After go-live',
                color: GOLD,
                items: [
                  'Direct new enquiries to mercers.co.zw',
                  'Monitor the AI chat inbox (Gary can take over any conversation)',
                  'Approve auto-generated social posts before they publish (optional)',
                ],
              },
            ].map(({ icon: Icon, title, color, items }) => (
              <div key={title} className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{title}</span>
                </div>
                <ul className="space-y-2">
                  {items.map((item, i) => <Check key={i}>{item}</Check>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* What Mercers gets */}
        <Section label="What Mercers gets at the end">
          <div className="space-y-3">
            {[
              { icon: Shield, title: 'Full ownership', body: 'Your platform, your brand, your data. Not a profile inside someone else\'s product.' },
              { icon: TrendingUp, title: 'Independent Google ranking', body: 'Pages on mercers.co.zw can rank for local searches. A PropertyBook profile cannot.' },
              { icon: Users, title: 'Marondera as a first-class branch', body: 'Its own agent profiles, listings, and search presence — not a footnote under Kensington.' },
              { icon: Clock, title: 'AI working while the team isn\'t', body: '24/7 client questions answered in English, Shona and Ndebele. No missed enquiries.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${NAVY}10` }}>
                  <Icon size={16} style={{ color: NAVY }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Technical note */}
        <Section label="Technical note for the team">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              <strong className="text-gray-900">PropertyBook XML feed sync.</strong> PropertyBook exposes a standard XML feed of your listings. A scheduled job on the Mercers server pulls this feed every hour and updates the platform automatically. No agent needs to touch anything.
            </p>
            <p>
              <strong className="text-gray-900">No data lock-in.</strong> All listing data, agent profiles, and conversation history is stored on Mercers' own Railway server — not with any third party. If any service is ever changed, your data stays with you.
            </p>
            <p>
              <strong className="text-gray-900">Existing links keep working.</strong> PropertyBook URLs continue to function for as long as you keep the PropertyBook subscription active. There is no broken-link risk during the transition.
            </p>
          </div>
        </Section>

        {/* CTA */}
        <div
          className="rounded-2xl p-7 text-center"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a5aa8 100%)` }}
        >
          <h2 className="text-xl font-bold text-white mb-2">Ready to see it live?</h2>
          <p className="text-blue-200 text-sm mb-6">
            The platform is built and running now. Browse listings, meet the team, or try the AI agent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: GOLD }}
            >
              Open the Platform <ArrowRight size={14} />
            </Link>
            <a
              href="mailto:info@mercers.co.zw"
              className="px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
            >
              Get in touch
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Prepared by Gary Aitchison · April 2026
        </p>

      </div>
    </div>
  )
}
