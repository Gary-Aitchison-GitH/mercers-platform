import { Mountain } from 'lucide-react'

const sections = [
  {
    emoji: '📸',
    title: 'Photo Studio',
    badge: 'New — try this first',
    badgeColor: '#C9A54C',
    steps: [
      'Open any listing to edit it.',
      'Look for the gold <strong>Photo Studio</strong> button next to the Images section.',
      'Drop all your photos in at once — no saving to folders first.',
      'Choose which AI fixes to apply: auto-enhance, crop to 5×7 landscape, remove people & pets.',
      'Hit <strong>Process</strong> — the AI works on all photos at once.',
      'Click any processed photo to see a full before/after comparison.',
      'Click <strong>Add to listing</strong> when you\'re happy — done.',
    ],
  },
  {
    emoji: '🏠',
    title: 'Your Listings',
    badge: null,
    steps: [
      'Go to the <strong>Listings</strong> tab.',
      'Your own listings show by default. Switch to <strong>All</strong> to see the full team view.',
      'Hit <strong>+ New listing</strong> to add a property.',
      'Use the sparkle button inside the listing form to AI-write or improve the description.',
    ],
  },
  {
    emoji: '👥',
    title: 'Clients',
    badge: null,
    steps: [
      'Go to the <strong>Clients</strong> tab.',
      'Switch between <strong>Mine</strong> and <strong>All</strong> — same as Listings.',
      'When anyone clicks Register Interest on a listing, they land here automatically.',
      'As admin you can reassign any client to a different agent from the dropdown.',
    ],
  },
  {
    emoji: '✨',
    title: 'Your Profile',
    badge: 'Please complete this',
    badgeColor: '#1B3A6B',
    steps: [
      'Go to the <strong>My Profile</strong> tab.',
      'Add your photo, job title, bio, specialties and areas.',
      'Use the <strong>AI Improve</strong> button to help write or polish your bio.',
      'Your profile card is live on the public website — buyers see this before they contact you.',
    ],
  },
  {
    emoji: '💬',
    title: 'Dev Assist',
    badge: null,
    steps: [
      'Go to the <strong>Dev Assist</strong> tab.',
      'Chat to the AI — describe an idea or something that needs fixing.',
      'Hit <strong>Submit Request</strong> when you\'re ready.',
      'Gary picks it up and updates the status.',
    ],
  },
  {
    emoji: '🌐',
    title: 'The Public Site',
    badge: null,
    steps: [
      'Visit <a href="https://mercers-properties.vercel.app" target="_blank" class="underline font-medium">mercers-properties.vercel.app</a> to see the live site.',
      'The language switcher (EN / SN / ND) is visible on every page including mobile.',
      'Your agent card, listings and contact form are all live.',
    ],
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen" style={{ background: '#F9F8F5' }}>

      {/* Header */}
      <div style={{ background: '#1B3A6B' }} className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10">
              <Mountain size={22} color="white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg leading-none block">Mercers</span>
              <span className="text-xs leading-none" style={{ color: '#C9A54C' }}>Kensington</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to your portal, Dawn 👋</h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            Everything you need to run Mercers is right here. This guide walks you through each feature — bookmark it for reference.
          </p>
          <a
            href="/agents/dashboard"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#C9A54C', color: 'white' }}
          >
            Open the portal →
          </a>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.emoji}</span>
                <h2 className="font-bold text-gray-900">{section.title}</h2>
              </div>
              {section.badge && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ background: section.badgeColor }}
                >
                  {section.badge}
                </span>
              )}
            </div>
            <ol className="px-5 py-4 space-y-2.5">
              {section.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                    style={{ background: '#1B3A6B' }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="text-sm text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </li>
              ))}
            </ol>
          </div>
        ))}

        {/* Footer CTA */}
        <div className="rounded-2xl p-6 text-center" style={{ background: '#1B3A6B' }}>
          <p className="text-white font-semibold mb-1">Ready to get started?</p>
          <p className="text-blue-200 text-sm mb-4">Everything above is live and waiting for you.</p>
          <a
            href="/agents/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#C9A54C', color: 'white' }}
          >
            Open the portal →
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Questions? Chat to Gary or use Dev Assist in the portal.
        </p>
      </div>
    </div>
  )
}
