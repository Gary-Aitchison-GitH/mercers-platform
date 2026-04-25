import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mountain, Sparkles, Globe2, Brain, TrendingUp,
  Share2, MessageSquare, ArrowRight, CheckCircle,
  MapPin, ChevronDown
} from 'lucide-react'

const features = [
  {
    icon: Globe2,
    color: '#1B3A6B',
    title: 'Your Own Platform',
    subtitle: "Not a listing on someone else's site",
    body: "Mercers now has a fully branded home on the internet — your name, your colours, your story. No more living inside PropertyBook's template.",
    vs: "PropertyBook shows 9 of your listings. This shows everything about Mercers.",
  },
  {
    icon: Brain,
    color: '#C9A54C',
    title: 'AI Property Agent',
    subtitle: 'Works in English, Shona & Ndebele',
    body: "A 24/7 intelligent agent that answers client questions, describes properties, and connects them to the right agent — in whichever language they're most comfortable in.",
    vs: 'PropertyBook has no AI. Clients wait for a call back. This answers instantly.',
  },
  {
    icon: TrendingUp,
    color: '#1B3A6B',
    title: 'Google SEO Engine',
    subtitle: 'Climbs search rankings automatically',
    body: "An AI agent constantly analyses how people find you on Google, then improves your content and keywords. More searches = more enquiries for you and Paul's team.",
    vs: 'A PropertyBook profile won\'t rank for "estate agents Marondera". Your own site will.',
  },
  {
    icon: Share2,
    color: '#C9A54C',
    title: 'Social Media Pipeline',
    subtitle: 'Listings posted automatically to 4 platforms',
    body: 'Every new listing is turned into polished Facebook, Instagram, LinkedIn and X posts — written in English, Shona and Ndebele — and scheduled without anyone lifting a finger.',
    vs: 'Zero social presence costs listings. This handles it all in the background.',
  },
  {
    icon: MessageSquare,
    color: '#1B3A6B',
    title: 'Live Client Chat',
    subtitle: 'Gary can join any conversation in real time',
    body: 'Clients chat with the AI agent. If they need a human, Gary or any agent can jump in live — from any device, anywhere. Clients see "Gary · Mercers" appear instantly.',
    vs: 'A phone number on a website. This is a live relationship.',
  },
  {
    icon: MapPin,
    color: '#C9A54C',
    title: 'Marondera Front and Centre',
    subtitle: "Your branch isn't a footnote",
    body: "The Marondera office has its own profile, its own listings, its own identity — as prominent as Harare. Mashonaland East clients can find you directly.",
    vs: "On PropertyBook, Marondera is just another branch of Kensington. Here it stands alone.",
  },
]

const vsItems = [
  { old: 'A profile page on PropertyBook', now: 'A fully branded Mercers platform' },
  { old: 'Clients wait for a callback', now: 'AI answers instantly, 24/7, trilingual' },
  { old: 'No Google presence of your own', now: 'SEO engine climbing rankings automatically' },
  { old: 'Manual social media (or none)', now: 'Auto-pipeline to 4 platforms in 3 languages' },
  { old: 'Marondera buried under Kensington', now: 'Marondera branch front and centre' },
]

export default function WelcomePage() {
  const [stage, setStage] = useState('intro')
  const [featIndex, setFeatIndex] = useState(0)

  useEffect(() => {
    if (stage === 'intro') {
      const t = setTimeout(() => setStage('features'), 4000)
      return () => clearTimeout(t)
    }
  }, [stage])

  const currentFeature = features[featIndex]
  const Icon = currentFeature.icon

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d1f3c 0%, #1B3A6B 60%, #0d1f3c 100%)' }}
    >
      {/* Background shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 80% 20%, rgba(201,165,76,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(201,165,76,0.08) 0%, transparent 50%)',
        }}
      />

      <AnimatePresence mode="wait">

        {/* ── Stage 1: Intro ── */}
        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-xl relative z-10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,165,76,0.4)' }}
              >
                <Mountain size={28} color="#C9A54C" />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm font-semibold tracking-widest uppercase mb-4"
              style={{ color: '#C9A54C' }}
            >
              A gift from Gary
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight"
            >
              Hi Mum. <br />
              <span style={{ color: '#C9A54C' }}>Welcome to Mercers.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-blue-200 text-lg leading-relaxed mb-8"
            >
              I built something for you, for Paul, and for the whole team.
              Something that puts Mercers exactly where it deserves to be.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="flex items-center justify-center gap-2"
              style={{ color: 'rgba(201,165,76,0.6)' }}
            >
              <Sparkles size={14} />
              <span className="text-sm">Let me show you what it can do</span>
              <Sparkles size={14} />
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              onClick={() => setStage('features')}
              className="mt-8 text-sm text-blue-300 hover:text-white transition-colors flex items-center gap-1 mx-auto"
            >
              Skip intro <ArrowRight size={14} />
            </motion.button>
          </motion.div>
        )}

        {/* ── Stage 2: Feature cards ── */}
        {stage === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl relative z-10"
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeatIndex(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === featIndex ? '2rem' : '0.5rem',
                    background: i === featIndex ? '#C9A54C' : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={featIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl p-8 sm:p-10 text-white"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-start gap-5 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: currentFeature.color }}
                  >
                    <Icon size={26} color="white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentFeature.title}</h2>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#C9A54C' }}>{currentFeature.subtitle}</p>
                  </div>
                </div>

                <p className="text-blue-100 leading-relaxed text-base mb-6">{currentFeature.body}</p>

                <div
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{ background: 'rgba(201,165,76,0.1)', border: '1px solid rgba(201,165,76,0.25)' }}
                >
                  <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: '#C9A54C' }} />
                  <p className="text-sm" style={{ color: '#e8d5a0' }}>{currentFeature.vs}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => featIndex > 0 && setFeatIndex(i => i - 1)}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                  featIndex === 0 ? 'opacity-30 pointer-events-none' : 'text-white hover:bg-white/10'
                }`}
              >
                ← Back
              </button>

              <span className="text-xs text-blue-300">{featIndex + 1} of {features.length}</span>

              {featIndex < features.length - 1 ? (
                <button
                  onClick={() => setFeatIndex(i => i + 1)}
                  className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ background: '#C9A54C' }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => setStage('compare')}
                  className="text-sm font-semibold px-5 py-2 rounded-xl text-white flex items-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: '#C9A54C' }}
                >
                  See the difference <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Stage 3: Side-by-side comparison ── */}
        {stage === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl relative z-10"
          >
            <div className="text-center mb-8">
              <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#C9A54C' }}>
                The difference
              </p>
              <h2 className="text-3xl font-bold text-white">Before vs. Now</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center">
                <p className="text-xs font-bold tracking-wider uppercase text-gray-400 mb-3">PropertyBook profile</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#C9A54C' }}>
                  Mercers Platform
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {vsItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div
                    className="rounded-xl px-4 py-3 text-sm text-gray-400 leading-snug"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {item.old}
                  </div>
                  <div
                    className="rounded-xl px-4 py-3 text-sm text-white leading-snug flex items-start gap-2"
                    style={{ background: 'rgba(201,165,76,0.12)', border: '1px solid rgba(201,165,76,0.3)' }}
                  >
                    <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#C9A54C' }} />
                    {item.now}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStage('ready')}
                className="px-8 py-3.5 rounded-2xl text-white font-semibold text-base inline-flex items-center gap-3 transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #1B3A6B 0%, #2a5aa8 100%)',
                  border: '1px solid rgba(201,165,76,0.4)',
                }}
              >
                <Mountain size={18} color="#C9A54C" />
                Show me the platform
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Stage 4: Ready ── */}
        {stage === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#C9A54C' }}>
                <Mountain size={30} color="white" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-4"
            >
              This is Mercers.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-blue-200 leading-relaxed mb-10 text-lg"
            >
              Built for you, for Paul&apos;s team, and for every client across
              Harare and Marondera. It&apos;s yours — let&apos;s make it great together.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/"
                className="px-8 py-3.5 rounded-2xl text-white font-bold text-base inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#C9A54C' }}
              >
                <Mountain size={18} />
                Open the Platform
              </Link>
              <Link
                to="/listings"
                className="px-8 py-3.5 rounded-2xl font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
              >
                Browse Listings
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-sm text-blue-400"
            >
              Love, Gary x
            </motion.p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Always visible: skip to end */}
      {stage !== 'ready' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => setStage('ready')}
          className="absolute bottom-6 right-6 text-xs text-blue-400 hover:text-white transition-colors"
        >
          Skip to end →
        </motion.button>
      )}

      {/* Subtle scroll indicator on intro */}
      {stage === 'intro' && (
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 text-blue-400/50"
        >
          <ChevronDown size={18} />
        </motion.div>
      )}
    </div>
  )
}
