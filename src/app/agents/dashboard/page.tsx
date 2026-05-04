'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LogOut, Plus, Pencil, Trash2, Upload, X, Loader2, Building2, Users, ShieldCheck, Home, Zap, Bug, Wrench, HelpCircle, ChevronDown, Sparkles, UserCircle, MessageSquare } from 'lucide-react'
import { HomeTab } from './HomeTab'
import { ProfileTab } from './ProfileTab'
import { ThreadsTab } from './ThreadsTab'
import PhotoStudio from '@/components/PhotoStudio'
import WelcomeHint from '@/components/WelcomeHint'

// ─── Types ────────────────────────────────────────────────────────────────────

type Listing = {
  id: string
  title: string
  location: string
  area: string
  type: string
  listingType: string
  price: number
  currency: string
  priceDisplay: string
  size: string
  description: string
  images: string[]
  status: string
  featured: boolean
  agentId: string
  agent: { id: string; name: string; email: string }
  createdAt: string
}

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  clientType: string
  journeyStage: string
  assignedAgent: { id: string; name: string } | null
  buyerRequirements: Array<{
    id: string
    propertyType: string | null
    areas: string[]
    minPrice: number | null
    maxPrice: number | null
    bedroomsMin: number | null
    notes: string | null
  }>
  createdAt: string
}

type AgentRecord = {
  id: string
  name: string
  email: string
  inviteStatus: string
  isActive: boolean
}

type FeatureRequest = {
  id: string
  agentName: string
  agentEmail: string
  type: string
  title: string
  description: string
  priority: string
  status: string
  createdAt: string
}

const REQUEST_TYPE: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  feature:  { label: 'Feature',  icon: Zap,         color: '#6366f1' },
  bug:      { label: 'Bug',      icon: Bug,         color: '#ef4444' },
  change:   { label: 'Change',   icon: Wrench,      color: '#3b82f6' },
  question: { label: 'Question', icon: HelpCircle,  color: '#8b5cf6' },
}

const REQUEST_STATUS: Record<string, { label: string; classes: string }> = {
  'new':       { label: 'New',       classes: 'bg-blue-50 text-blue-700' },
  'in-review': { label: 'In Review', classes: 'bg-yellow-50 text-yellow-700' },
  'planned':   { label: 'Planned',   classes: 'bg-purple-50 text-purple-700' },
  'done':      { label: 'Done',      classes: 'bg-green-50 text-green-700' },
  'declined':  { label: 'Declined',  classes: 'bg-red-50 text-red-600' },
}

const PRIORITY_CLASSES: Record<string, string> = {
  low:    'bg-gray-100 text-gray-500',
  medium: 'bg-amber-50 text-amber-700',
  high:   'bg-red-50 text-red-600',
}

const defaultForm = {
  title: '',
  location: '',
  area: '',
  type: 'RESIDENTIAL',
  listingType: 'SALE',
  price: '',
  currency: 'USD',
  priceDisplay: '',
  size: '',
  description: '',
  images: [] as string[],
  status: 'AVAILABLE',
  agentId: '',
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  UNDER_OFFER: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-red-100 text-red-700',
  LET: 'bg-blue-100 text-blue-800',
}

const typeColors: Record<string, string> = {
  RESIDENTIAL: 'bg-indigo-50 text-indigo-700',
  COMMERCIAL: 'bg-purple-50 text-purple-700',
  INDUSTRIAL: 'bg-orange-50 text-orange-700',
  AGRICULTURAL: 'bg-teal-50 text-teal-700',
}

const journeyColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  viewing: 'bg-yellow-100 text-yellow-700',
  offer: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgentDashboardPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'home' | 'listings' | 'clients' | 'threads' | 'admin' | 'profile'>('home')
  const [threadsListingFilter, setThreadsListingFilter] = useState<string | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [listingsScope, setListingsScope] = useState<'mine' | 'all'>('mine')
  const [clientsScope, setClientsScope] = useState<'mine' | 'all'>('mine')
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([])
  const [fetching, setFetching] = useState(false)
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null)
  const [unreadThreads, setUnreadThreads] = useState(0)
  const [readThreadIds, setReadThreadIds] = useState<Set<string>>(new Set())
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)

  // listing modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [improvingDesc, setImprovingDesc] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragImageIdx = useRef<number | null>(null)

  // invite form
  const [invite, setInvite] = useState({ name: '', email: '', role: 'agent' })
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ link?: string; error?: string; emailSent?: boolean; emailError?: string | null } | null>(null)
  const [agentAction, setAgentAction] = useState<{ id: string; type: 'resend' | 'remove' } | null>(null)
  const [showResolvedRequests, setShowResolvedRequests] = useState(false)
  const [showPhotoStudio, setShowPhotoStudio] = useState(false)
  const [backfillState, setBackfillState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [backfillResult, setBackfillResult] = useState<{ success: number; failed: number; total: number } | null>(null)

  const isAdmin = ['admin', 'dev'].includes(role ?? '')

  useEffect(() => {
    if (loading) return
    // No user at all — definitely redirect
    if (!user) { router.replace('/agents/login'); return }
    // User is set but role is still null — auth context hasn't finished resolving, wait
    if (role === null) return
    // Role resolved but not a valid staff role — redirect
    if (!['agent', 'admin', 'dev'].includes(role)) {
      router.replace('/agents/login')
    }
  }, [user, role, loading, router])

  // Fetch agents once on mount for admin/dev (needed for listing form dropdown)
  useEffect(() => {
    if (user && isAdmin) fetchAgents()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch current agent's own ID so ThreadsTab can correctly detect unread messages from other agents
  useEffect(() => {
    if (!user) return
    user.getIdToken().then(token =>
      fetch('/api/portal/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.agent?.id) setCurrentAgentId(d.agent.id) })
        .catch(() => {})
    )
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Unread thread count — fetch once on mount for the initial tab badge.
  // While the threads tab is open, ThreadsTab drives the count via onUnreadChange.
  // The navbar has its own polling independently.
  useEffect(() => {
    if (!user) return
    user.getIdToken().then(token =>
      fetch('/api/portal/threads/unread-count', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (typeof d.count === 'number') setUnreadThreads(d.count) })
        .catch(() => {})
    )
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps


  // Fetch tab data on mount and when tab changes
  useEffect(() => {
    if (!user) return
    if (activeTab === 'listings') fetchListings(listingsScope)
    if (activeTab === 'clients') fetchClients(clientsScope)
    if (activeTab === 'threads') { fetchListings('all'); fetchClients('all'); fetchAgents() }
    if (activeTab === 'admin') { fetchAgents(); fetchFeatureRequests() }
  }, [activeTab, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when scope toggles
  useEffect(() => {
    if (!user || activeTab !== 'listings') return
    fetchListings(listingsScope)
  }, [listingsScope]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || activeTab !== 'clients') return
    fetchClients(clientsScope)
  }, [clientsScope]) // eslint-disable-line react-hooks/exhaustive-deps

  async function getToken() {
    return user!.getIdToken()
  }

  async function fetchListings(scope: 'mine' | 'all' = 'mine') {
    setFetching(true)
    try {
      const token = await getToken()
      const url = scope === 'all' ? '/api/portal/listings?scope=all' : '/api/portal/listings'
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setListings(data.listings ?? [])
    } finally {
      setFetching(false)
    }
  }

  async function fetchClients(scope: 'mine' | 'all' = 'mine') {
    setFetching(true)
    try {
      const token = await getToken()
      const url = scope === 'all' ? '/api/portal/clients?scope=all' : '/api/portal/clients'
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setClients(data.clients ?? [])
    } finally {
      setFetching(false)
    }
  }

  async function fetchAgents() {
    setFetching(true)
    try {
      const token = await user!.getIdToken()
      const res = await fetch('/api/portal/agents', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setAgents(data.agents ?? [])
    } finally {
      setFetching(false)
    }
  }

  async function fetchFeatureRequests() {
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/requests', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setFeatureRequests(data.requests ?? [])
    } catch { /* non-fatal */ }
  }

  async function updateRequestStatus(id: string, status: string) {
    setUpdatingRequestId(id)
    try {
      const token = await getToken()
      await fetch(`/api/portal/requests/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await fetchFeatureRequests()
    } finally {
      setUpdatingRequestId(null)
    }
  }

  function openListingThreads(listingId: string) {
    setThreadsListingFilter(listingId)
    setActiveTab('threads')
  }

  function openNewListing() {
    setEditingId(null)
    setForm({ ...defaultForm })
    setShowModal(true)
  }

  function openEditListing(listing: Listing) {
    setEditingId(listing.id)
    setForm({
      title: listing.title,
      location: listing.location,
      area: listing.area,
      type: listing.type,
      listingType: listing.listingType,
      price: String(listing.price),
      currency: listing.currency,
      priceDisplay: listing.priceDisplay,
      size: listing.size,
      description: listing.description,
      images: listing.images,
      status: listing.status,
      agentId: listing.agentId,
    })
    setShowModal(true)
  }

  async function resizeImage(file: File, maxPx = 1920, quality = 0.85): Promise<File> {
    return new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        if (img.width <= maxPx && img.height <= maxPx) { resolve(file); return }
        const scale = Math.min(maxPx / img.width, maxPx / img.height)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(blob => {
          resolve(new File([blob!], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.src = url
    })
  }

  async function handleUploadImages(files: FileList) {
    setUploading(true)
    const token = await getToken()
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const resized = await resizeImage(file)
      const fd = new FormData()
      fd.append('file', resized)
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    setForm(f => ({ ...f, images: [...f.images, ...urls] }))
    setUploading(false)
  }

  async function handleImproveDescription() {
    if (!form.description.trim()) return
    setImprovingDesc(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/improve-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: form.description, title: form.title, type: form.type }),
      })
      const data = await res.json()
      if (data.improved) setForm(f => ({ ...f, description: data.improved }))
    } finally {
      setImprovingDesc(false)
    }
  }

  async function handleSaveListing() {
    if (!form.title || !form.location || !form.price) return
    setSaving(true)
    try {
      const token = await getToken()
      const body = {
        ...form,
        price: parseFloat(form.price),
        priceDisplay: form.priceDisplay || `${form.currency} ${form.price}`,
        area: form.area || form.location,
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/portal/listings/${editingId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/portal/listings', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      if (res.ok) {
        setShowModal(false)
        await fetchListings()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteListing() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const token = await getToken()
      await fetch(`/api/portal/listings/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteId(null)
      await fetchListings()
    } finally {
      setDeleting(false)
    }
  }

  async function handleInvite() {
    if (!invite.email) return
    setInviting(true)
    setInviteResult(null)
    try {
      const token = await getToken()
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...invite, inviterToken: token }),
      })
      const data = await res.json()
      if (data.inviteLink) {
        setInviteResult({ link: data.inviteLink, emailSent: data.emailSent, emailError: data.emailError })
        setInvite({ name: '', email: '', role: 'agent' })
        fetchAgents()
      } else {
        setInviteResult({ error: data.error || 'Invite failed' })
      }
    } finally {
      setInviting(false)
    }
  }

  async function handleResendInvite(agentId: string) {
    setAgentAction({ id: agentId, type: 'resend' })
    try {
      const token = await getToken()
      const res = await fetch('/api/auth/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, inviterToken: token }),
      })
      const data = await res.json()
      if (data.inviteLink) {
        setInviteResult({ link: data.inviteLink, emailSent: data.emailSent, emailError: data.emailError })
      }
    } finally {
      setAgentAction(null)
    }
  }

  async function handleRemoveAgent(agentId: string, name: string) {
    if (!confirm(`Remove ${name}? This deletes their account and cannot be undone.`)) return
    setAgentAction({ id: agentId, type: 'remove' })
    try {
      const token = await getToken()
      await fetch('/api/auth/remove-agent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, inviterToken: token }),
      })
      fetchAgents()
    } finally {
      setAgentAction(null)
    }
  }

  async function handleBackfillTranslations() {
    if (!user) return
    setBackfillState('running')
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/portal/listings/backfill-translations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setBackfillResult(data)
      setBackfillState('done')
    } catch {
      setBackfillState('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-navy-700)]" size={28} />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <header className="bg-[var(--color-navy-900)] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors">
            <ArrowLeft size={15} />
            Public site
          </Link>
          <span className="text-blue-800">|</span>
          <span className="font-bold text-lg">Agent Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200 hidden sm:block">{user.email} · {role}</span>
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex gap-0">
          {([
            { key: 'home', label: 'Home', icon: Home },
            { key: 'listings', label: 'Listings', icon: Building2 },
            { key: 'clients', label: 'Clients', icon: Users },
            { key: 'threads', label: 'Conversations', icon: MessageSquare },
            { key: 'profile', label: 'My Profile', icon: UserCircle },
            ...(isAdmin ? [{ key: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'home' | 'listings' | 'clients' | 'threads' | 'admin' | 'profile')}
              className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[var(--color-navy-700)] text-[var(--color-navy-900)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-navy-900)]'
              }`}
            >
              <Icon size={15} />
              {label}
              {key === 'threads' && unreadThreads > 0 && (
                <span className="ml-1 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1.5 shadow-sm">
                  {unreadThreads > 99 ? '99+' : unreadThreads}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Home tab ── */}
        {activeTab === 'home' && (
          <HomeTab
            getToken={() => user!.getIdToken()}
            displayName={user.displayName || user.email?.split('@')[0] || 'Agent'}
          />
        )}

        {activeTab === 'profile' && (
          <div>
            <WelcomeHint id="profile-v1" title="Complete your public profile">
              <p>Your profile card appears on the public <strong>Our Agents</strong> page and the homepage — buyers see this before they contact you.</p>
              <p>Add your <strong>photo, job title, bio, specialties and areas</strong>. Use the AI button to help write or polish your bio.</p>
              <p>The more complete your profile, the more professional the site looks to buyers.</p>
            </WelcomeHint>
            <ProfileTab getToken={() => user!.getIdToken()} />
          </div>
        )}

        {/* ── Listings tab ── */}
        {activeTab === 'listings' && (
          <div>
            <WelcomeHint id="listings-v1" title="Your listings workspace">
              <p>Use <strong>Mine / All</strong> to switch between your listings and the full team view.</p>
              <p>Click <strong>+ New listing</strong> to add a property — AI description writing is built in.</p>
              <p>When editing a listing, hit the gold <strong>Photo Studio</strong> button to bulk-edit photos with AI: auto-enhance, crop to 5×7, remove people & pets, and close toilet lids.</p>
            </WelcomeHint>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--color-navy-900)]">Listings</h2>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                  <button
                    onClick={() => setListingsScope('mine')}
                    className={`px-3 py-1.5 transition-colors ${listingsScope === 'mine' ? 'bg-[var(--color-navy-800)] text-white' : 'bg-white text-[var(--color-muted)] hover:bg-gray-50'}`}
                  >
                    Mine
                  </button>
                  <button
                    onClick={() => setListingsScope('all')}
                    className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${listingsScope === 'all' ? 'bg-[var(--color-navy-800)] text-white' : 'bg-white text-[var(--color-muted)] hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                </div>
              </div>
              <button
                onClick={openNewListing}
                className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] transition-colors"
              >
                <Plus size={16} />
                New Listing
              </button>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--color-muted)]" size={24} />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 text-[var(--color-muted)]">
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>No listings yet. Create your first one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(listing => (
                  <div key={listing.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-[var(--color-navy-50)] flex items-center justify-center">
                        <Building2 size={32} className="text-[var(--color-navy-200)]" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-[var(--color-navy-900)] text-sm leading-tight">{listing.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[listing.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {listing.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] mb-1">{listing.location}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[listing.type] ?? 'bg-gray-100'}`}>
                          {listing.type}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">{listing.listingType}</span>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-navy-800)] mb-3">{listing.priceDisplay}</p>
                      {listingsScope === 'all' && (
                        <p className="text-xs text-[var(--color-muted)] mb-3">Agent: {listing.agent.name}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openListingThreads(listing.id)}
                          className="flex items-center gap-1.5 text-xs text-[var(--color-navy-700)] border border-[var(--color-navy-200)] rounded-lg px-3 py-1.5 hover:bg-[var(--color-navy-50)] transition-colors"
                        >
                          <MessageSquare size={12} />
                          Conversations
                        </button>
                        <button
                          onClick={() => openEditListing(listing)}
                          className="flex items-center gap-1.5 text-xs text-[var(--color-navy-700)] border border-[var(--color-navy-200)] rounded-lg px-3 py-1.5 hover:bg-[var(--color-navy-50)] transition-colors"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(listing.id)}
                          className="flex items-center gap-1.5 text-xs text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Clients tab ── */}
        {activeTab === 'clients' && (
          <div>
            <WelcomeHint id="clients-v1" title="Your client pipeline">
              <p>Clients who click <strong>Register Interest</strong> on any listing appear here automatically — no manual entry needed.</p>
              <p>Use <strong>Mine / All</strong> to view your clients or the full team pipeline.</p>
              <p>As admin you can reassign clients to any agent using the dropdown on each card.</p>
            </WelcomeHint>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-[var(--color-navy-900)]">Clients</h2>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setClientsScope('mine')}
                  className={`px-3 py-1.5 transition-colors ${clientsScope === 'mine' ? 'bg-[var(--color-navy-800)] text-white' : 'bg-white text-[var(--color-muted)] hover:bg-gray-50'}`}
                >
                  Mine
                </button>
                <button
                  onClick={() => setClientsScope('all')}
                  className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${clientsScope === 'all' ? 'bg-[var(--color-navy-800)] text-white' : 'bg-white text-[var(--color-muted)] hover:bg-gray-50'}`}
                >
                  All
                </button>
              </div>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--color-muted)]" size={24} />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-20 text-[var(--color-muted)]">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>No clients assigned yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map(client => (
                  <div key={client.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--color-navy-900)]">{client.name}</h3>
                        {client.email && <p className="text-sm text-[var(--color-muted)]">{client.email}</p>}
                        {client.phone && <p className="text-sm text-[var(--color-muted)]">{client.phone}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {client.clientType}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${journeyColors[client.journeyStage] ?? 'bg-gray-100 text-gray-600'}`}>
                          {client.journeyStage}
                        </span>
                      </div>
                    </div>

                    {clientsScope === 'all' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[var(--color-muted)]">Agent:</span>
                        {isAdmin ? (
                          <select
                            value={client.assignedAgent?.id ?? ''}
                            onChange={async e => {
                              const token = await getToken()
                              await fetch(`/api/portal/clients/${client.id}`, {
                                method: 'PATCH',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ assignedAgentId: e.target.value || null }),
                              })
                              fetchClients(clientsScope)
                            }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-navy-300)] bg-white text-[var(--color-navy-900)]"
                          >
                            <option value="">— Unassigned —</option>
                            {agents.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-medium text-[var(--color-navy-800)]">
                            {client.assignedAgent?.name ?? '— Unassigned —'}
                          </span>
                        )}
                      </div>
                    )}

                    {client.buyerRequirements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs font-medium text-[var(--color-navy-700)] mb-2">Buyer requirements</p>
                        {client.buyerRequirements.map(req => (
                          <div key={req.id} className="text-xs text-[var(--color-muted)] space-y-0.5">
                            {req.propertyType && <span className="mr-3">Type: {req.propertyType}</span>}
                            {req.areas.length > 0 && <span className="mr-3">Areas: {req.areas.join(', ')}</span>}
                            {(req.minPrice || req.maxPrice) && (
                              <span className="mr-3">
                                Budget: {req.minPrice ? `$${req.minPrice.toLocaleString()}` : '?'} – {req.maxPrice ? `$${req.maxPrice.toLocaleString()}` : '?'}
                              </span>
                            )}
                            {req.bedroomsMin && <span className="mr-3">{req.bedroomsMin}+ beds</span>}
                            {req.notes && <p className="mt-1 italic">{req.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Threads tab ── */}
        {activeTab === 'threads' && (
          <ThreadsTab
            getToken={() => user!.getIdToken()}
            currentAgentId={currentAgentId}
            clients={clients.map(c => ({ id: c.id, name: c.name, email: c.email }))}
            agents={agents.map(a => ({ id: a.id, name: a.name, email: a.email }))}
            listings={listings.map(l => ({ id: l.id, title: l.title, location: l.location, images: l.images }))}
            filterListingId={threadsListingFilter}
            onClearFilter={() => setThreadsListingFilter(null)}
            onUnreadChange={setUnreadThreads}
            readIds={readThreadIds}
            onMarkRead={id => setReadThreadIds(prev => new Set([...prev, id]))}
          />
        )}

        {/* ── Admin tab ── */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-8">
            <WelcomeHint id="admin-v1" title="Admin controls">
              <p><strong>Add Agent</strong> — creates an account and generates a one-hour setup link to send directly to the agent.</p>
              <p><strong>Feature Requests</strong> — this is where agent ideas and bug reports land after they use Dev Assist. You can update the status of each request.</p>
              <p>Tip: encourage agents to use <strong>Dev Assist</strong> whenever they spot something to improve — it reaches Gary directly.</p>
            </WelcomeHint>
            {/* Invite form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[var(--color-navy-900)] mb-1">Add Agent</h2>
              <p className="text-sm text-[var(--color-muted)] mb-5">Creates an account and generates a setup link to share directly with the agent.</p>

              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  type="text"
                  value={invite.name}
                  onChange={e => setInvite(i => ({ ...i, name: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)] w-40"
                  placeholder="Dawn Brown"
                />
                <input
                  type="text"
                  value={invite.email}
                  onChange={e => setInvite(i => ({ ...i, email: e.target.value }))}
                  className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  placeholder="dawn@mercers.co.zw"
                />
                <select
                  value={invite.role}
                  onChange={e => setInvite(i => ({ ...i, role: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)] bg-white"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={handleInvite}
                disabled={inviting || !invite.name || !invite.email}
                className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create account
              </button>

              {inviteResult?.link && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-green-800">Account created — copy and send this link to the agent:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs break-all text-green-900 bg-green-100 px-3 py-2 rounded">{inviteResult.link}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteResult.link!)}
                      className="shrink-0 text-xs bg-green-700 text-white px-3 py-2 rounded hover:bg-green-800 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-green-600">Link expires in 1 hour. Use &quot;New link&quot; in the agent list below if it expires before they set up.</p>
                </div>
              )}
              {inviteResult?.error && (
                <p className="mt-3 text-sm text-red-600">{inviteResult.error}</p>
              )}
            </div>

            {/* Agent list */}
            <div>
              <h3 className="text-base font-bold text-[var(--color-navy-900)] mb-3">Agents ({agents.length})</h3>
              {fetching ? (
                <Loader2 className="animate-spin text-[var(--color-muted)]" size={20} />
              ) : agents.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No agents yet.</p>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent: AgentRecord) => (
                    <div key={agent.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-navy-900)]">{agent.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{agent.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          agent.inviteStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {agent.inviteStatus === 'active' ? 'Active' : 'Pending'}
                        </span>
                        {agent.inviteStatus !== 'active' && (
                          <button
                            onClick={() => handleResendInvite(agent.id)}
                            disabled={agentAction?.id === agent.id}
                            className="text-xs text-[var(--color-navy-700)] hover:underline disabled:opacity-50"
                          >
                            {agentAction?.id === agent.id && agentAction.type === 'resend' ? 'Generating…' : 'New link'}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveAgent(agent.id, agent.name)}
                          disabled={agentAction?.id === agent.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-50"
                        >
                          {agentAction?.id === agent.id && agentAction.type === 'remove' ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dev Tools */}
            {role === 'dev' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Dev Tools</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackfillTranslations}
                    disabled={backfillState === 'running'}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50 transition-colors"
                    style={{ background: '#1B3A6B' }}
                  >
                    {backfillState === 'running' ? 'Translating…' : 'Backfill listing translations'}
                  </button>
                  {backfillState === 'done' && backfillResult && (
                    <span className="text-xs text-green-700">
                      Done — {backfillResult.success}/{backfillResult.total} translated
                      {backfillResult.failed > 0 && `, ${backfillResult.failed} failed`}
                    </span>
                  )}
                  {backfillState === 'error' && (
                    <span className="text-xs text-red-600">Translation failed — check logs</span>
                  )}
                </div>
              </div>
            )}

            {/* Feature Requests */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[var(--color-navy-900)]">
                  Feature Requests
                  {featureRequests.filter(r => r.status === 'new').length > 0 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                      {featureRequests.filter(r => r.status === 'new').length} new
                    </span>
                  )}
                </h3>
                <Link href="/agents/dev-assist" className="text-xs text-[var(--color-navy-700)] hover:text-[var(--color-navy-900)] transition-colors">
                  Open Dev Assist →
                </Link>
              </div>

              {(() => {
                const active   = featureRequests.filter(r => !['done', 'declined'].includes(r.status))
                const resolved = featureRequests.filter(r =>  ['done', 'declined'].includes(r.status))

                const renderCard = (req: FeatureRequest) => {
                  const typeMeta   = REQUEST_TYPE[req.type]   ?? REQUEST_TYPE.feature
                  const statusMeta = REQUEST_STATUS[req.status] ?? REQUEST_STATUS.new
                  const TypeIcon   = typeMeta.icon
                  return (
                    <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <TypeIcon size={15} style={{ color: typeMeta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-[var(--color-navy-900)] leading-snug">{req.title}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_CLASSES[req.priority] ?? 'bg-gray-100 text-gray-500'}`}>
                                {req.priority}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.classes}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] mb-2 leading-snug">{req.description}</p>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-[var(--color-muted)]">
                              {req.agentName} · {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                            <div className="relative">
                              <select
                                value={req.status}
                                disabled={updatingRequestId === req.id}
                                onChange={e => updateRequestStatus(req.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg pl-2 pr-6 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--color-navy-300)] bg-white text-[var(--color-navy-900)] cursor-pointer disabled:opacity-50"
                              >
                                <option value="new">New</option>
                                <option value="in-review">In Review</option>
                                <option value="planned">Planned</option>
                                <option value="done">Done</option>
                                <option value="declined">Declined</option>
                              </select>
                              <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <>
                    {active.length === 0 && resolved.length === 0 && (
                      <p className="text-sm text-[var(--color-muted)]">No requests yet.</p>
                    )}
                    {active.length === 0 && resolved.length > 0 && (
                      <p className="text-sm text-[var(--color-muted)]">No active requests.</p>
                    )}
                    <div className="space-y-2">{active.map(renderCard)}</div>

                    {resolved.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowResolvedRequests(v => !v)}
                          className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-navy-700)] transition-colors"
                        >
                          <ChevronDown
                            size={13}
                            className="transition-transform"
                            style={{ transform: showResolvedRequests ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          />
                          {showResolvedRequests ? 'Hide' : 'Show'} completed &amp; declined ({resolved.length})
                        </button>
                        {showResolvedRequests && (
                          <div className="space-y-2 mt-2 opacity-60">{resolved.map(renderCard)}</div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </main>

      {/* ── Listing modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onDragOver={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[var(--color-navy-900)]">{editingId ? 'Edit Listing' : 'New Listing'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  placeholder="4-bed family home in Borrowdale"
                />
              </div>

              {/* Location + Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Location *</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="Borrowdale, Harare"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Area / Suburb</label>
                  <input
                    value={form.area}
                    onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="Borrowdale"
                  />
                </div>
              </div>

              {/* Type + Listing type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Property type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="AGRICULTURAL">Agricultural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Sale or Rent</label>
                  <select
                    value={form.listingType}
                    onChange={e => setForm(f => ({ ...f, listingType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">To Rent</option>
                  </select>
                </div>
              </div>

              {/* Price + Currency + Size */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Price *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="250000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  >
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="ZIG">ZiG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Size</label>
                  <input
                    value={form.size}
                    onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="450 sqm"
                  />
                </div>
              </div>

              {/* Price display override */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Price display (optional override)</label>
                <input
                  value={form.priceDisplay}
                  onChange={e => setForm(f => ({ ...f, priceDisplay: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  placeholder={form.price ? `${form.currency} ${Number(form.price).toLocaleString()}` : 'auto-generated'}
                />
              </div>

              {/* Status (edit only) */}
              {editingId && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNDER_OFFER">Under Offer</option>
                    <option value="SOLD">Sold</option>
                    <option value="LET">Let</option>
                  </select>
                </div>
              )}

              {/* Agent selector for admin/dev creating */}
              {isAdmin && !editingId && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Assign to agent</label>
                  <select
                    value={form.agentId}
                    onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                  >
                    <option value="">— select agent —</option>
                    {agents.map((a: AgentRecord) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[var(--color-navy-700)]">Description</label>
                  <button
                    type="button"
                    onClick={handleImproveDescription}
                    disabled={improvingDesc || !form.description.trim()}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                    style={{ color: '#C9A54C', background: '#C9A54C18' }}
                  >
                    {improvingDesc ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {improvingDesc ? 'Improving…' : 'Improve with AI'}
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)] resize-none"
                  placeholder="Describe the property…"
                />
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[var(--color-navy-700)]">
                    Images {form.images.length > 1 && <span className="text-gray-400 font-normal">(drag to reorder)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPhotoStudio(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ background: '#C9A54C' }}
                  >
                    <Sparkles size={12} />
                    Photo Studio
                  </button>
                </div>
                <div
                  className={`flex flex-wrap gap-2 p-2 rounded-xl border-2 border-dashed transition-colors ${dragOver ? 'border-[#1B3A6B] bg-blue-50' : 'border-gray-200'}`}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false) }}
                  onDrop={e => {
                    e.preventDefault(); e.stopPropagation(); setDragOver(false)
                    if (e.dataTransfer.files.length) handleUploadImages(e.dataTransfer.files)
                  }}
                >
                  {form.images.map((url, i) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={e => { e.stopPropagation(); dragImageIdx.current = i }}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                      onDrop={e => {
                        e.preventDefault(); e.stopPropagation()
                        const from = dragImageIdx.current
                        if (from === null || from === i) return
                        setForm(f => {
                          const imgs = [...f.images]
                          const [moved] = imgs.splice(from, 1)
                          imgs.splice(i, 0, moved)
                          return { ...f, images: imgs }
                        })
                        dragImageIdx.current = null
                      }}
                      onDragEnd={() => { dragImageIdx.current = null }}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-grab active:cursor-grabbing"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-bold text-white bg-black/50 py-0.5">Cover</span>
                      )}
                      <button
                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-navy-300)] hover:text-[var(--color-navy-700)] transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span className="text-xs mt-1">{uploading ? '…' : 'Upload'}</span>
                  </button>
                  {dragOver && !uploading && (
                    <div className="flex items-center justify-center text-xs text-[#1B3A6B] font-medium w-full py-1">
                      Drop photos here
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Drag photos here or click Upload · First image is the cover · Drag thumbnails to reorder</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleUploadImages(e.target.files)}
                />
              </div>
            </div>

            {showPhotoStudio && (
              <PhotoStudio
                onComplete={urls => {
                  setForm(f => ({ ...f, images: [...f.images, ...urls] }))
                  setShowPhotoStudio(false)
                }}
                onClose={() => setShowPhotoStudio(false)}
              />
            )}

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveListing}
                disabled={saving || !form.title || !form.location || !form.price}
                className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editingId ? 'Save changes' : 'Create listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-[var(--color-navy-900)] mb-2">Delete listing?</h3>
            <p className="text-sm text-[var(--color-muted)] mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteListing}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
