'use client'

import { useState, useEffect, useRef } from 'react'

const NAV = [
  { id: 'cover', label: 'Overview' },
  { id: 'market', label: 'Target Markets' },
  { id: 'seo', label: 'SEO Strategy' },
  { id: 'social', label: 'Social & Content' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'launch', label: 'Launch Plan' },
  { id: 'kpis', label: 'KPIs' },
]

function useIntersect(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observers = ids.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(id) }, { threshold: 0.4 })
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [ids])
  return active
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = target / 60
      const t = setInterval(() => {
        start = Math.min(start + step, target)
        setVal(Math.floor(start))
        if (start >= target) clearInterval(t)
      }, 20)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

export default function MarketingPlanPage() {
  const active = useIntersect(NAV.map(n => n.id))
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0a0f1e', color: '#f0f4ff' }}>

      {/* Sticky side nav — desktop */}
      <nav className="fixed left-0 top-0 h-full w-52 z-50 hidden lg:flex flex-col justify-center px-6 gap-1"
        style={{ background: 'rgba(10,15,30,0.85)', borderRight: '1px solid rgba(201,165,76,0.15)', backdropFilter: 'blur(12px)' }}>
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#C9A54C' }}>Mercers</div>
          <div className="text-xs text-blue-300 opacity-70">Marketing AI · v1.0</div>
        </div>
        {NAV.map(n => (
          <button key={n.id} onClick={() => scrollTo(n.id)}
            className="text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer"
            style={{
              background: active === n.id ? 'rgba(201,165,76,0.15)' : 'transparent',
              color: active === n.id ? '#C9A54C' : 'rgba(200,215,255,0.5)',
              borderLeft: active === n.id ? '2px solid #C9A54C' : '2px solid transparent',
              fontWeight: active === n.id ? 600 : 400,
            }}>
            {n.label}
          </button>
        ))}
        <div className="mt-auto pt-8 text-xs text-blue-300 opacity-40">
          Confidential<br />Draft v1 · May 2026
        </div>
      </nav>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(10,15,30,0.95)', borderBottom: '1px solid rgba(201,165,76,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="text-sm font-bold" style={{ color: '#C9A54C' }}>Mercers Marketing AI</div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-blue-200 text-xs border border-blue-800 px-3 py-1 rounded-lg">
          {menuOpen ? 'Close' : 'Menu'}
        </button>
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 p-4 flex flex-col gap-1"
            style={{ background: '#0a0f1e', borderBottom: '1px solid rgba(201,165,76,0.2)' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className="text-left px-3 py-2 text-sm rounded"
                style={{ color: active === n.id ? '#C9A54C' : '#94a3b8' }}>
                {n.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content — offset for side nav */}
      <main className="lg:ml-52">

        {/* ── COVER ── */}
        <section id="cover" className="min-h-screen flex flex-col justify-center relative overflow-hidden px-8 lg:px-20 pt-20 lg:pt-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 80% 50%, rgba(201,165,76,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(27,58,107,0.3) 0%, transparent 50%)',
          }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(201,165,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,165,76,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-widest uppercase"
              style={{ background: 'rgba(201,165,76,0.1)', color: '#C9A54C', border: '1px solid rgba(201,165,76,0.3)' }}>
              ✦ Mercers Marketing AI Agent · First Draft
            </div>

            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-none tracking-tight">
              <span style={{ color: '#fff' }}>Go-To-Market</span><br />
              <span style={{ color: '#C9A54C' }}>Strategy 2026</span>
            </h1>

            <p className="text-lg lg:text-xl mb-10 max-w-2xl leading-relaxed" style={{ color: 'rgba(200,215,255,0.7)' }}>
              A full-stack growth plan to establish Mercers Kensington as the #1 digital property platform for Zimbabwe — and the preferred choice of the global diaspora investor.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Zimbabwe diaspora', value: '4M', desc: 'Estimated global diaspora' },
                { label: 'UK alone', value: '200K+', desc: 'Zimbabweans in United Kingdom' },
                { label: 'Annual remittances', value: '$1.9B', desc: 'Into Zimbabwe per year' },
                { label: 'Target SEO rank', value: 'Top 3', desc: 'For key search terms, Y1' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-2xl font-black mb-1" style={{ color: '#C9A54C' }}>{s.value}</div>
                  <div className="text-xs font-semibold text-white mb-0.5">{s.label}</div>
                  <div className="text-xs" style={{ color: 'rgba(200,215,255,0.4)' }}>{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              {['SEO Dominance', 'Diaspora Outreach', 'AI-led UX', 'Organic Social', 'Strategic Partnerships', 'PR & Media', 'Email Marketing (opt-in)'].map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full" style={{ background: 'rgba(27,58,107,0.4)', color: '#93c5fd', border: '1px solid rgba(27,58,107,0.8)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── MARKET ── */}
        <section id="market" className="min-h-screen py-24 px-8 lg:px-20 relative">
          <div className="max-w-5xl">
            <SectionLabel number="01" label="Target Markets" />
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Who we are<br /><span style={{ color: '#C9A54C' }}>selling to.</span></h2>
            <p className="mb-16 max-w-2xl" style={{ color: 'rgba(200,215,255,0.55)' }}>
              Three distinct buyer personas — each with different motivations, channels, and trust signals. Our strategy speaks to all three simultaneously without losing focus.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  num: '01',
                  title: 'The Diaspora Investor',
                  location: 'UK · USA · Canada · Australia',
                  color: '#C9A54C',
                  bg: 'rgba(201,165,76,0.08)',
                  border: 'rgba(201,165,76,0.25)',
                  traits: ['Wants trusted, accountable agent', 'Remitting $500–$5,000/month', 'Buying for family or investment', 'Needs WhatsApp communication', 'Values EACZ accreditation'],
                  size: '~200,000 (UK alone)',
                  opportunity: 'Highest conversion value. Most underserved online.',
                },
                {
                  num: '02',
                  title: 'The Local Professional',
                  location: 'Harare · Bulawayo · Marondera',
                  color: '#60a5fa',
                  bg: 'rgba(96,165,250,0.08)',
                  border: 'rgba(96,165,250,0.2)',
                  traits: ['Growing middle class', 'First-time buyers / upgraders', 'Price-sensitive but quality-conscious', 'Uses mobile-first platforms', 'Word of mouth driven'],
                  size: 'Harare metro: 2.1M people',
                  opportunity: 'Volume market. SEO and local Google visibility critical.',
                },
                {
                  num: '03',
                  title: 'The Commercial Developer',
                  location: 'Harare CBD · Industrial Zones',
                  color: '#a78bfa',
                  bg: 'rgba(167,139,250,0.08)',
                  border: 'rgba(167,139,250,0.2)',
                  traits: ['Seeks industrial & commercial stock', 'Longer decision cycles', 'Needs detailed financials', 'Responds to direct outreach', 'Influenced by market reports'],
                  size: 'Smaller pool, high-value deals',
                  opportunity: 'Premium revenue. Agent relationships + content marketing.',
                },
              ].map(p => (
                <div key={p.num} className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl font-black opacity-30" style={{ color: p.color }}>{p.num}</span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,215,255,0.5)' }}>{p.location}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{p.title}</h3>
                    <p className="text-xs" style={{ color: p.color }}>{p.size}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {p.traits.map(t => (
                      <li key={t} className="text-sm flex items-start gap-2" style={{ color: 'rgba(200,215,255,0.65)' }}>
                        <span style={{ color: p.color }} className="mt-0.5">›</span>{t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(200,215,255,0.5)' }}>
                    <strong style={{ color: p.color }}>Opportunity:</strong> {p.opportunity}
                  </div>
                </div>
              ))}
            </div>

            {/* Diaspora deep-dive */}
            <div className="rounded-2xl p-8" style={{ background: 'rgba(201,165,76,0.05)', border: '1px solid rgba(201,165,76,0.2)' }}>
              <h3 className="text-xl font-bold text-white mb-4">Diaspora deep-dive: where they are & how to reach them</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { city: 'United Kingdom', est: '200,000+', channel: 'Facebook groups, WhatsApp, Google', flag: '🇬🇧' },
                  { city: 'United States', est: '150,000+', channel: 'LinkedIn, YouTube, Google', flag: '🇺🇸' },
                  { city: 'South Africa', est: '1,500,000+', channel: 'WhatsApp, local radio, Facebook', flag: '🇿🇦' },
                  { city: 'Australia / Canada', est: '60,000+', channel: 'Community groups, Instagram', flag: '🌏' },
                ].map(d => (
                  <div key={d.city} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-2xl mb-2">{d.flag}</div>
                    <div className="font-bold text-white text-sm">{d.city}</div>
                    <div className="text-xs mb-2" style={{ color: '#C9A54C' }}>{d.est} people</div>
                    <div className="text-xs" style={{ color: 'rgba(200,215,255,0.45)' }}>{d.channel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SEO ── */}
        <section id="seo" className="min-h-screen py-24 px-8 lg:px-20 relative" style={{ background: 'rgba(27,58,107,0.08)' }}>
          <div className="max-w-5xl">
            <SectionLabel number="02" label="SEO Strategy" />
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Own the search.<br /><span style={{ color: '#C9A54C' }}>Own the market.</span></h2>
            <p className="mb-16 max-w-2xl" style={{ color: 'rgba(200,215,255,0.55)' }}>
              SEO is the highest-ROI channel for property — buyers search before they do anything else. We build to rank, then convert.
            </p>

            {/* Keyword clusters */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span style={{ color: '#C9A54C' }}>⬤</span> Priority Keyword Clusters
                </h3>
                <div className="space-y-3">
                  {[
                    { kw: 'property for sale in Zimbabwe', vol: 'High', diff: 'Med', intent: 'Transactional' },
                    { kw: 'estate agents Harare', vol: 'High', diff: 'Med', intent: 'Transactional' },
                    { kw: 'buy house in Zimbabwe from UK', vol: 'Med', diff: 'Low', intent: 'Diaspora' },
                    { kw: 'farm for sale Zimbabwe', vol: 'Med', diff: 'Low', intent: 'Commercial' },
                    { kw: 'Mercers Kensington estate agents', vol: 'Brand', diff: 'None', intent: 'Brand' },
                    { kw: 'Zimbabwe property investment diaspora', vol: 'Low', diff: 'Low', intent: 'Diaspora' },
                    { kw: 'industrial property Harare for sale', vol: 'Med', diff: 'Low', intent: 'Commercial' },
                    { kw: 'houses to rent Harare', vol: 'High', diff: 'Med', intent: 'Local' },
                  ].map(k => (
                    <div key={k.kw} className="flex items-center gap-3 text-xs">
                      <span className="flex-1 text-blue-200">{k.kw}</span>
                      <span className="px-2 py-0.5 rounded" style={{ background: k.vol === 'High' ? 'rgba(34,197,94,0.15)' : k.vol === 'Brand' ? 'rgba(201,165,76,0.15)' : 'rgba(255,255,255,0.07)', color: k.vol === 'High' ? '#4ade80' : k.vol === 'Brand' ? '#C9A54C' : '#94a3b8' }}>{k.vol}</span>
                      <span className="px-2 py-0.5 rounded w-16 text-center" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{k.intent}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 className="text-base font-bold text-white mb-4">Technical SEO — Foundation Checklist</h3>
                  <div className="space-y-2">
                    {[
                      ['Schema.org RealEstateAgent + Property markup', 'Done ✓'],
                      ['OpenGraph / Twitter card meta per listing', 'Done ✓'],
                      ['Sitemap.xml auto-generated from listings', 'To do'],
                      ['robots.txt with proper crawl rules', 'To do'],
                      ['Core Web Vitals: LCP < 2.5s, CLS < 0.1', 'To do'],
                      ['Canonical URLs on filtered listing pages', 'To do'],
                      ['Image ALT tags: property address + type', 'To do'],
                      ['i18n hreflang for en-ZW, en-GB, en-US', 'To do'],
                    ].map(([item, status]) => (
                      <div key={item} className="flex items-center justify-between text-xs gap-3">
                        <span style={{ color: 'rgba(200,215,255,0.6)' }}>{item}</span>
                        <span style={{ color: status === 'Done ✓' ? '#4ade80' : '#C9A54C', whiteSpace: 'nowrap' }}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-6" style={{ background: 'rgba(201,165,76,0.06)', border: '1px solid rgba(201,165,76,0.2)' }}>
                  <h3 className="text-base font-bold text-white mb-3">Content SEO — The Asset Flywheel</h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(200,215,255,0.5)' }}>
                    Every piece of content earns both traffic and trust. The more we publish, the more we rank, the more enquiries we get.
                  </p>
                  <div className="space-y-2 text-xs" style={{ color: 'rgba(200,215,255,0.65)' }}>
                    {[
                      '🏘  Area guides: Harare neighbourhoods, Marondera, Victoria Falls',
                      '📊  Zimbabwe Property Market Report (quarterly)',
                      '💼  "How to buy property in Zimbabwe from abroad" guide',
                      '🌍  Diaspora investor FAQ (builds long-tail search coverage)',
                      '📰  News: economic updates, ZWL/USD exchange rate impact',
                    ].map(i => <div key={i}>{i}</div>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Local SEO */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <h3 className="text-base font-bold text-white mb-3">Local SEO — Google Business Profile</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                {[
                  { title: 'Google Business Profiles', body: 'Claim and fully optimise profiles for Harare (Kensington), Marondera, and Victoria Falls offices. Photos, hours, reviews, services.' },
                  { title: 'Review strategy', body: 'Post-transaction review request flow. Target 50+ 5-star Google reviews in Year 1. Reviews are the #1 local ranking signal.' },
                  { title: 'Local citations', body: 'List on Zimbabwe Yellow Pages, Zimbo Jam, Property24.co.zw, Private Property Zimbabwe. Consistent NAP across all.' },
                ].map(l => (
                  <div key={l.title}>
                    <div className="font-semibold text-blue-300 mb-1 text-xs">{l.title}</div>
                    <div className="text-xs" style={{ color: 'rgba(200,215,255,0.5)' }}>{l.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL & CONTENT ── */}
        <section id="social" className="min-h-screen py-24 px-8 lg:px-20">
          <div className="max-w-5xl">
            <SectionLabel number="03" label="Social & Content Marketing" />
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Build audience.<br /><span style={{ color: '#C9A54C' }}>Build trust.</span></h2>
            <p className="mb-16 max-w-2xl" style={{ color: 'rgba(200,215,255,0.55)' }}>
              The diaspora doesn't buy from strangers — they buy from the agent they've seen on their feed for six months. Consistency beats virality every time.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                {
                  platform: 'Facebook / Instagram',
                  priority: 'Primary',
                  color: '#4267B2',
                  bg: 'rgba(66,103,178,0.1)',
                  audience: 'UK/SA diaspora, 30–55',
                  cadence: '5 posts/week',
                  formats: ['Property listing carousels', 'Client success stories (anonymised)', '"Life in Zimbabwe" lifestyle content', 'Market update reels (30 sec)', 'Agent introductions & behind-the-scenes'],
                  cta: 'DM us on WhatsApp',
                },
                {
                  platform: 'WhatsApp Broadcast',
                  priority: 'Primary',
                  color: '#25D366',
                  bg: 'rgba(37,211,102,0.08)',
                  audience: 'Warm leads, opted-in buyers',
                  cadence: '2–3 messages/week',
                  formats: ['New listing alerts', 'Price reduction notifications', 'Weekly market snapshot', 'Exclusive off-market opportunities', 'Agent voice notes — personal touch'],
                  cta: 'Opt-in via website or QR code',
                },
                {
                  platform: 'YouTube',
                  priority: 'Growth',
                  color: '#FF0000',
                  bg: 'rgba(255,0,0,0.06)',
                  audience: 'Global diaspora, all ages',
                  cadence: '2 videos/month',
                  formats: ['Property tour walkthroughs', '"Investing in Zimbabwe" explainers', 'Neighbourhood guides with agent commentary', 'Zimbabwe economy & property market updates'],
                  cta: 'Subscribe for market updates',
                },
                {
                  platform: 'LinkedIn',
                  priority: 'Growth',
                  color: '#0077B5',
                  bg: 'rgba(0,119,181,0.08)',
                  audience: 'Commercial buyers, professional diaspora',
                  cadence: '3 posts/week',
                  formats: ['Market reports and data insights', 'Commercial property features', 'Dawn Brown / agent thought leadership', 'Zimbabwe investment opportunity articles'],
                  cta: 'Connect with our agents',
                },
              ].map(p => (
                <div key={p.platform} className="rounded-2xl p-6" style={{ background: p.bg, border: `1px solid ${p.color}22` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">{p.platform}</h3>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{ background: p.priority === 'Primary' ? 'rgba(201,165,76,0.2)' : 'rgba(255,255,255,0.07)', color: p.priority === 'Primary' ? '#C9A54C' : '#94a3b8' }}>
                      {p.priority}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs mb-3" style={{ color: 'rgba(200,215,255,0.45)' }}>
                    <span>👥 {p.audience}</span>
                    <span>📅 {p.cadence}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {p.formats.map(f => (
                      <li key={f} className="text-xs flex items-start gap-2" style={{ color: 'rgba(200,215,255,0.65)' }}>
                        <span style={{ color: p.color }}>›</span>{f}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(200,215,255,0.45)' }}>
                    <strong style={{ color: p.color }}>CTA:</strong> {p.cta}
                  </div>
                </div>
              ))}
            </div>

            {/* Email marketing - opt-in */}
            <div className="rounded-2xl p-8" style={{ background: 'rgba(201,165,76,0.06)', border: '1px solid rgba(201,165,76,0.25)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">📧</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Opt-in Email Marketing — The Long Game</h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(200,215,255,0.55)' }}>
                    Every visitor who opts in becomes a subscriber we can nurture for months. Property decisions take time — email keeps Mercers front-of-mind until they're ready.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { title: 'Lead magnet', body: '"Diaspora Investor Guide: How to buy property in Zimbabwe from the UK" — gated PDF. High perceived value, zero cost to produce.' },
                      { title: 'Welcome sequence', body: '5-email onboarding over 2 weeks. Who we are, EACZ accreditation, success stories, current listings, personal agent intro.' },
                      { title: 'Ongoing nurture', body: 'Monthly market report, new listing alerts (based on stated preferences), seasonal content (rainy season, school calendars, etc.).' },
                    ].map(e => (
                      <div key={e.title}>
                        <div className="text-xs font-bold mb-1" style={{ color: '#C9A54C' }}>{e.title}</div>
                        <div className="text-xs" style={{ color: 'rgba(200,215,255,0.5)' }}>{e.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PARTNERSHIPS ── */}
        <section id="partnerships" className="min-h-screen py-24 px-8 lg:px-20" style={{ background: 'rgba(27,58,107,0.08)' }}>
          <div className="max-w-5xl">
            <SectionLabel number="04" label="Strategic Partnerships" />
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Borrow trust.<br /><span style={{ color: '#C9A54C' }}>Build reach.</span></h2>
            <p className="mb-16 max-w-2xl" style={{ color: 'rgba(200,215,255,0.55)' }}>
              The fastest way to reach the diaspora is through the voices and platforms they already trust. Strategic partnerships multiply our reach without multiplying our costs.
            </p>

            <div className="space-y-4 mb-12">
              {[
                {
                  category: 'Media & Publications',
                  color: '#f59e0b',
                  partners: [
                    { name: 'The ZimMorning Post', type: 'Digital newspaper', plan: 'Sponsored content, property section sponsorship, monthly market column by Dawn Brown' },
                    { name: 'Zimbo Jam', type: 'Community platform', plan: 'Featured listings, event sponsorship, banner ads targeting diaspora users' },
                    { name: 'Nehanda Radio', type: 'Online radio & news', plan: 'Advertising slots, market update segments, sponsoring property-related shows' },
                  ],
                },
                {
                  category: 'Professional & Financial',
                  color: '#60a5fa',
                  partners: [
                    { name: 'Zimbabwean lawyers in UK/SA', type: 'Legal professionals', plan: 'Referral partnership — they handle title transfers, we provide the property. Co-marketing materials.' },
                    { name: 'Zimbabwe banks (CBZ, FBC, ZB Bank)', type: 'Banking', plan: 'Approved agent status for mortgage referrals. Co-branded content on property finance.' },
                    { name: 'Money transfer services (Mukuru, WorldRemit)', type: 'Remittance', plan: 'Advertise on their platforms: "Send money home, then buy the home."' },
                  ],
                },
                {
                  category: 'Community & Events',
                  color: '#a78bfa',
                  partners: [
                    { name: 'Zimbabwean Association UK chapters', type: 'Community orgs', plan: 'Sponsor events, provide property market talks, be the "official property partner"' },
                    { name: 'Africa Homecoming Convention', type: 'Annual event', plan: 'Exhibitor stand, keynote talks on Zimbabwe property investment, lead capture' },
                    { name: 'Church & faith community networks', type: 'Community', plan: 'Diaspora communities are highly faith-networked. Respectful, community-first presence.' },
                  ],
                },
                {
                  category: 'Digital & Tech',
                  color: '#34d399',
                  partners: [
                    { name: 'Property24 Zimbabwe / PrivateProperty', type: 'Portals', plan: 'List all properties. Back-link and co-marketing opportunities.' },
                    { name: 'Google Business Profile / Maps', type: 'Platform', plan: 'Fully optimised profiles with photos, reviews, Q&A. Free but high-impact.' },
                    { name: 'Rightmove International / Overseas section', type: 'Portal', plan: 'Reach international buyers already on UK\'s biggest property platform' },
                  ],
                },
              ].map(cat => (
                <div key={cat.category} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${cat.color}22` }}>
                  <div className="px-6 py-3 text-xs font-bold tracking-widest uppercase" style={{ background: `${cat.color}15`, color: cat.color }}>
                    {cat.category}
                  </div>
                  <div className="divide-y divide-white/5">
                    {cat.partners.map(p => (
                      <div key={p.name} className="px-6 py-4 grid sm:grid-cols-3 gap-2">
                        <div>
                          <div className="font-semibold text-white text-sm">{p.name}</div>
                          <div className="text-xs" style={{ color: cat.color }}>{p.type}</div>
                        </div>
                        <div className="sm:col-span-2 text-xs" style={{ color: 'rgba(200,215,255,0.55)' }}>{p.plan}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LAUNCH ── */}
        <section id="launch" className="min-h-screen py-24 px-8 lg:px-20">
          <div className="max-w-5xl">
            <SectionLabel number="05" label="Launch Plan" />
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">90-day launch.<br /><span style={{ color: '#C9A54C' }}>12-month domination.</span></h2>
            <p className="mb-16 max-w-2xl" style={{ color: 'rgba(200,215,255,0.55)' }}>
              A phased rollout that builds foundations before volume. We don't blast the market until we're ready to convert the traffic we generate.
            </p>

            <div className="space-y-6 mb-12">
              {[
                {
                  phase: 'Phase 1',
                  title: 'Foundation',
                  period: 'Weeks 1–4',
                  color: '#C9A54C',
                  tasks: [
                    'Finalise and QA the full Mercers platform (all pages, mobile, WhatsApp chat)',
                    'Submit sitemap to Google Search Console and Bing Webmaster Tools',
                    'Set up Google Analytics 4 + conversion tracking (enquiry, WhatsApp click, listing view)',
                    'Claim and optimise all Google Business Profiles (3 offices)',
                    'Create social profiles: Facebook Page, Instagram, LinkedIn, YouTube',
                    'Produce "Diaspora Investor Guide" PDF lead magnet',
                    'Set up email platform (Mailchimp / Loops) with welcome sequence',
                    'Draft first 4 blog posts: area guides for Harare, Marondera, investment guide, FAQ',
                  ],
                },
                {
                  phase: 'Phase 2',
                  title: 'Soft Launch',
                  period: 'Weeks 5–8',
                  color: '#60a5fa',
                  tasks: [
                    'Go live — share across personal networks, WhatsApp groups, LinkedIn',
                    'Begin daily social posting cadence',
                    'Publish all 4 blog posts (Google indexes them faster with age)',
                    'Run Google Ads campaign: brand terms + "estate agents Harare" ($200–400/mo test budget)',
                    'Run Meta Ads: target UK Zimbabweans 25–55, "Zimbabwe property" interest, $300/mo test',
                    'First partner outreach: contact 3 diaspora media outlets for coverage',
                    'Ask first clients for Google reviews — target 10 in Month 1',
                    'Launch WhatsApp broadcast list with opt-in from website',
                  ],
                },
                {
                  phase: 'Phase 3',
                  title: 'Growth Engine',
                  period: 'Months 3–6',
                  color: '#a78bfa',
                  tasks: [
                    'Review and double down on channels that are producing leads, cut what isn\'t',
                    'Publish quarterly Zimbabwe Property Market Report — PR and link-building asset',
                    'Activate 2+ partnership arrangements (media + community)',
                    'YouTube: first 6 property tour videos live, begin building subscriber base',
                    'SEO: target first page positions for top 5 keyword clusters',
                    'Launch "Mercers Marketing AI" agent on website as lead-gen chatbot',
                    'Begin building blog to 20+ articles — each targeting a keyword cluster',
                    'First agent podcast or webinar: "Investing in Zimbabwe property in 2026"',
                  ],
                },
                {
                  phase: 'Phase 4',
                  title: 'Market Leadership',
                  period: 'Months 6–12',
                  color: '#34d399',
                  tasks: [
                    'Target #1 Google position for "estate agents Harare" and "property for sale Zimbabwe"',
                    'Email list target: 2,000 qualified subscribers with 30%+ open rate',
                    'Social following: 5,000+ Facebook, 2,000+ Instagram, 1,000+ LinkedIn',
                    'Press feature in at least one major diaspora outlet (ZimMorning Post / Nehanda Radio)',
                    'Launch Mercers Market Report as a quarterly press release for media coverage',
                    'Referral programme: reward existing clients for introductions',
                    'Explore paid partnership with Mukuru / WorldRemit for diaspora cross-promotion',
                  ],
                },
              ].map(ph => (
                <div key={ph.phase} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${ph.color}30` }}>
                  <div className="px-6 py-4 flex items-center gap-4" style={{ background: `${ph.color}12` }}>
                    <span className="text-2xl font-black" style={{ color: ph.color }}>{ph.phase}</span>
                    <div>
                      <div className="font-bold text-white">{ph.title}</div>
                      <div className="text-xs" style={{ color: 'rgba(200,215,255,0.45)' }}>{ph.period}</div>
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      {ph.tasks.map(t => (
                        <div key={t} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(200,215,255,0.65)' }}>
                          <span className="mt-1 text-xs shrink-0" style={{ color: ph.color }}>◆</span>{t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KPIs ── */}
        <section id="kpis" className="min-h-screen py-24 px-8 lg:px-20" style={{ background: 'rgba(27,58,107,0.08)' }}>
          <div className="max-w-5xl">
            <SectionLabel number="06" label="KPIs & Success Metrics" />
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">What good<br /><span style={{ color: '#C9A54C' }}>looks like.</span></h2>
            <p className="mb-16 max-w-2xl" style={{ color: 'rgba(200,215,255,0.55)' }}>
              Everything is measurable. These targets are ambitious but achievable for a platform with Mercers' credentials — and they compound over time.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {[
                { label: 'Organic search sessions / mo', m3: '500', m6: '2,000', m12: '8,000+', icon: '🔍' },
                { label: 'Google ranking: "estate agents Harare"', m3: 'Top 20', m6: 'Top 10', m12: 'Top 3', icon: '📈' },
                { label: 'Email list size (opted-in)', m3: '200', m6: '800', m12: '2,500+', icon: '📧' },
                { label: 'Social followers (all platforms)', m3: '1,000', m6: '3,500', m12: '10,000+', icon: '👥' },
                { label: 'Google reviews', m3: '15', m6: '40', m12: '100+', icon: '⭐' },
                { label: 'Inbound enquiries / month', m3: '20', m6: '60', m12: '150+', icon: '📩' },
                { label: 'WhatsApp broadcast subscribers', m3: '150', m6: '500', m12: '1,500+', icon: '💬' },
                { label: 'YouTube subscribers', m3: '100', m6: '400', m12: '1,500+', icon: '▶️' },
                { label: 'Blog articles published', m3: '8', m6: '20', m12: '50+', icon: '✍️' },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-2xl mb-2">{k.icon}</div>
                  <div className="text-xs font-semibold text-white mb-3">{k.label}</div>
                  <div className="space-y-1.5">
                    {[['3 months', k.m3], ['6 months', k.m6], ['12 months', k.m12]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span style={{ color: 'rgba(200,215,255,0.4)' }}>{label}</span>
                        <span className="font-bold" style={{ color: '#C9A54C' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Budget guide */}
            <div className="rounded-2xl p-8 mb-12" style={{ background: 'rgba(201,165,76,0.05)', border: '1px solid rgba(201,165,76,0.25)' }}>
              <h3 className="text-xl font-bold text-white mb-6">Indicative Monthly Budget — Year 1</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { channel: 'Google Ads', range: '$200–500/mo', note: 'Brand + key intent terms. Pause when SEO delivers.' },
                  { channel: 'Meta (Facebook/Instagram) Ads', range: '$300–600/mo', note: 'Diaspora targeting. Listing promotions + lead gen.' },
                  { channel: 'Content creation', range: '$200–400/mo', note: 'Copywriter for blog, social captions, email. Can be done in-house.' },
                  { channel: 'Email platform', range: '$0–50/mo', note: 'Mailchimp free tier to 500 subscribers, then $13/mo.' },
                  { channel: 'Partnership / sponsorship', range: '$100–300/mo', note: 'Diaspora media. Flexible — start small, scale what works.' },
                  { channel: 'Video production', range: '$100–300/mo', note: 'Property tours. Agent with a good phone + editing app can do this.' },
                  { channel: 'SEO tools', range: '$0–99/mo', note: 'Google Search Console is free. Ahrefs/Semrush if scaling up.' },
                  { channel: 'Total indicative range', range: '$900–$2,250/mo', note: 'Lean but effective. Can start at lower end and scale.' },
                ].map(b => (
                  <div key={b.channel} className={`rounded-xl p-4 ${b.channel === 'Total indicative range' ? 'ring-1 ring-gold-500' : ''}`}
                    style={{ background: b.channel === 'Total indicative range' ? 'rgba(201,165,76,0.12)' : 'rgba(255,255,255,0.04)', border: b.channel === 'Total indicative range' ? '1px solid rgba(201,165,76,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-bold text-white mb-1">{b.channel}</div>
                    <div className="text-sm font-black mb-1" style={{ color: '#C9A54C' }}>{b.range}</div>
                    <div className="text-xs" style={{ color: 'rgba(200,215,255,0.4)' }}>{b.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(27,58,107,0.5) 0%, rgba(10,15,30,0.8) 100%)', border: '1px solid rgba(27,58,107,0.6)' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 tracking-widest uppercase"
                style={{ background: 'rgba(201,165,76,0.1)', color: '#C9A54C', border: '1px solid rgba(201,165,76,0.3)' }}>
                ✦ Mercers Marketing AI — Draft v1.0 · May 2026
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Ready when you are.</h3>
              <p className="text-sm max-w-xl mx-auto mb-6" style={{ color: 'rgba(200,215,255,0.55)' }}>
                This plan is a living document. As we launch, gather data, and see what converts, the Mercers Marketing AI agent will update it with real-world insights. The goal is simple: make Mercers the first name every Zimbabwean — wherever they are in the world — thinks of when they think about property.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs" style={{ color: 'rgba(200,215,255,0.35)' }}>
                <span>Prepared by: Mercers Marketing AI</span>
                <span>·</span>
                <span>Commissioned by: Mercers Kensington</span>
                <span>·</span>
                <span>Confidential — First Draft</span>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-black tracking-widest" style={{ color: 'rgba(201,165,76,0.4)' }}>{number}</span>
      <div className="h-px flex-1 max-w-8" style={{ background: 'rgba(201,165,76,0.3)' }} />
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C9A54C' }}>{label}</span>
    </div>
  )
}
