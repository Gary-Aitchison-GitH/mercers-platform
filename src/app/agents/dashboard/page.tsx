'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LogOut, Plus, Pencil, Trash2, Upload, X, Loader2, Building2, Users, ShieldCheck, Home, Zap, Bug, Wrench, HelpCircle, ChevronDown } from 'lucide-react'
import { HomeTab } from './HomeTab'

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

  const [activeTab, setActiveTab] = useState<'home' | 'listings' | 'clients' | 'admin'>('home')
  const [listings, setListings] = useState<Listing[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([])
  const [fetching, setFetching] = useState(false)
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null)

  // listing modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // invite form
  const [invite, setInvite] = useState({ name: '', email: '', phone: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ link?: string; error?: string } | null>(null)

  const isAdmin = ['admin', 'dev'].includes(role ?? '')

  useEffect(() => {
    if (!loading && (!user || !['agent', 'admin', 'dev'].includes(role ?? ''))) {
      router.replace('/agents/login')
    }
  }, [user, role, loading, router])

  // Fetch agents once on mount for admin/dev (needed for listing form dropdown)
  useEffect(() => {
    if (user && isAdmin) fetchAgents()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch tab data on mount and when tab changes
  useEffect(() => {
    if (!user) return
    if (activeTab === 'listings') fetchListings()
    if (activeTab === 'clients') fetchClients()
    if (activeTab === 'admin') { fetchAgents(); fetchFeatureRequests() }
  }, [activeTab, user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function getToken() {
    return user!.getIdToken()
  }

  async function fetchListings() {
    setFetching(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/listings', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setListings(data.listings ?? [])
    } finally {
      setFetching(false)
    }
  }

  async function fetchClients() {
    setFetching(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/clients', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setClients(data.clients ?? [])
    } finally {
      setFetching(false)
    }
  }

  async function fetchAgents() {
    setFetching(true)
    try {
      const res = await fetch('/api/agents')
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

  async function handleUploadImages(files: FileList) {
    setUploading(true)
    const token = await getToken()
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    setForm(f => ({ ...f, images: [...f.images, ...urls] }))
    setUploading(false)
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
    if (!invite.name || !invite.email) return
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
        setInviteResult({ link: data.inviteLink })
        setInvite({ name: '', email: '', phone: '' })
        fetchAgents()
      } else {
        setInviteResult({ error: data.error || 'Invite failed' })
      }
    } finally {
      setInviting(false)
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
            { key: 'listings', label: 'My Listings', icon: Building2 },
            { key: 'clients', label: 'My Clients', icon: Users },
            ...(isAdmin ? [{ key: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'home' | 'listings' | 'clients' | 'admin')}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[var(--color-navy-700)] text-[var(--color-navy-900)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-navy-900)]'
              }`}
            >
              <Icon size={15} />
              {label}
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

        {/* ── Listings tab ── */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-navy-900)]">
                {isAdmin ? 'All Listings' : 'My Listings'}
              </h2>
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
                      {isAdmin && (
                        <p className="text-xs text-[var(--color-muted)] mb-3">Agent: {listing.agent.name}</p>
                      )}
                      <div className="flex gap-2">
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
            <h2 className="text-xl font-bold text-[var(--color-navy-900)] mb-6">
              {isAdmin ? 'All Clients' : 'My Clients'}
            </h2>

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

                    {isAdmin && client.assignedAgent && (
                      <p className="text-xs text-[var(--color-muted)] mt-2">
                        Agent: {client.assignedAgent.name}
                      </p>
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

        {/* ── Admin tab ── */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-8">
            {/* Invite form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[var(--color-navy-900)] mb-1">Invite Agent</h2>
              <p className="text-sm text-[var(--color-muted)] mb-5">They&apos;ll receive a password-setup link by email.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Full name *</label>
                  <input
                    value={invite.name}
                    onChange={e => setInvite(i => ({ ...i, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Email address *</label>
                  <input
                    type="email"
                    value={invite.email}
                    onChange={e => setInvite(i => ({ ...i, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Phone</label>
                  <input
                    value={invite.phone}
                    onChange={e => setInvite(i => ({ ...i, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    placeholder="+263 77 123 4567"
                  />
                </div>
              </div>

              <button
                onClick={handleInvite}
                disabled={inviting || !invite.name || !invite.email}
                className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Send invite
              </button>

              {inviteResult?.link && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">Invite sent!</p>
                  <p className="text-xs text-green-700 mb-2">Share this link with the agent (valid 1 hour):</p>
                  <code className="text-xs break-all text-green-900 bg-green-100 px-2 py-1 rounded">{inviteResult.link}</code>
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
                    <div key={agent.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-[var(--color-navy-900)]">{agent.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{agent.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        agent.inviteStatus === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {agent.inviteStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

              {featureRequests.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {featureRequests.map(req => {
                    const typeMeta = REQUEST_TYPE[req.type] ?? REQUEST_TYPE.feature
                    const statusMeta = REQUEST_STATUS[req.status] ?? REQUEST_STATUS.new
                    const TypeIcon = typeMeta.icon
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
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Listing modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
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
                <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Description</label>
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
                <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-2">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
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
                </div>
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
