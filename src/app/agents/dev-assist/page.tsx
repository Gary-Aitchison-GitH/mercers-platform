'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  ArrowLeft, Send, Loader2, CheckCircle2, Clock, Wrench,
  Bug, HelpCircle, Zap, ChevronDown, X, LogOut,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMsg = { role: 'user' | 'assistant'; content: string }

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

type ExtractedRequest = {
  title: string
  description: string
  type: string
  priority: string
}

// ─── Visual helpers ──────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  feature:  { label: 'Feature',  icon: Zap,         color: '#C9A54C' },
  bug:      { label: 'Bug',      icon: Bug,         color: '#f87171' },
  change:   { label: 'Change',   icon: Wrench,      color: '#60a5fa' },
  question: { label: 'Question', icon: HelpCircle,  color: '#a78bfa' },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  'new':        { label: 'New',        color: '#93c5fd', bg: 'rgba(96,165,250,0.12)' },
  'in-review':  { label: 'In Review',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  'planned':    { label: 'Planned',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'done':       { label: 'Done',       color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  'declined':   { label: 'Declined',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const PRIORITY_COLOR: Record<string, string> = {
  low:    '#64748b',
  medium: '#C9A54C',
  high:   '#f87171',
}

const STARTER_PROMPTS = [
  'I wish I could bulk-upload listings',
  'There\'s a bug where images don\'t load',
  'Can we add WhatsApp integration?',
  'How do I change a client\'s agent?',
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DevAssistPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  const [messages, setMessages]           = useState<ChatMsg[]>([])
  const [input, setInput]                 = useState('')
  const [streaming, setStreaming]         = useState(false)
  const [requests, setRequests]           = useState<FeatureRequest[]>([])
  const [extracting, setExtracting]       = useState(false)
  const [extracted, setExtracted]         = useState<ExtractedRequest | null>(null)
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [extractError, setExtractError]   = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState<'chat' | 'requests'>('chat')
  const [showResolved, setShowResolved]   = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = ['admin', 'dev'].includes(role ?? '')

  useEffect(() => {
    if (!loading && (!user || !['agent', 'admin', 'dev'].includes(role ?? ''))) {
      router.replace('/agents/login')
    }
  }, [user, role, loading, router])

  useEffect(() => {
    if (user) loadRequests()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function getToken() { return user!.getIdToken() }

  async function loadRequests() {
    const token = await getToken()
    const res = await fetch('/api/portal/requests', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setRequests(data.requests ?? [])
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: ChatMsg = { role: 'user', content: text.trim() }
    const outgoing = [...messages, userMsg]
    setMessages(outgoing)
    setInput('')
    setStreaming(true)
    setSubmitted(false)

    try {
      const token = await getToken()
      const res = await fetch('/api/portal/dev-assist', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing.filter(m => m.content.trim() !== ''), action: 'chat' }),
      })
      if (!res.ok || !res.body) return

      setMessages(m => [...m, { role: 'assistant', content: '' }])
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const snap = acc
        setMessages(m => { const n = [...m]; n[n.length - 1] = { role: 'assistant', content: snap }; return n })
      }
    } finally {
      setStreaming(false)
    }
  }

  async function handleExtract() {
    if (messages.length < 2) return
    setExtracting(true)
    setExtracted(null)
    setExtractError(null)
    try {
      const token = await getToken()
      // Filter out any empty assistant messages before sending to API
      const cleanMessages = messages.filter(m => m.content.trim() !== '')
      const res = await fetch('/api/portal/dev-assist', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: cleanMessages, action: 'extract' }),
      })
      const data = await res.json()
      if (data.title) {
        setExtracted(data)
      } else {
        setExtractError('Could not extract — try adding a bit more detail in the chat first.')
      }
    } catch {
      setExtractError('Something went wrong. Please try again.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit() {
    if (!extracted) return
    setSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extracted, chatHistory: messages.filter(m => m.content.trim() !== '') }),
      })
      if (res.ok) {
        setExtracted(null)
        setMessages([])
        setSubmitted(true)
        await loadRequests()
      } else {
        const err = await res.json().catch(() => ({}))
        setExtractError(err.error ?? 'Save failed — please try again.')
      }
    } catch {
      setExtractError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setStatusUpdating(id)
    try {
      const token = await getToken()
      await fetch(`/api/portal/requests/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await loadRequests()
    } finally {
      setStatusUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1f3c' }}>
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1f3c' }}>

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/agents/dashboard"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#93c5fd' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = '#93c5fd')}
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>
          <span style={{ color: '#1e3a5f' }}>|</span>
          <div className="flex items-center gap-2">
            <Wrench size={16} style={{ color: '#C9A54C' }} />
            <span className="font-bold text-white">Dev Assist</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:block" style={{ color: '#93c5fd' }}>{user.email} · {role}</span>
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#93c5fd' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = '#93c5fd')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="flex md:hidden border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setActiveTab('chat')}
          className="flex-1 py-3 text-sm font-medium transition-colors"
          style={{
            color: activeTab === 'chat' ? '#C9A54C' : '#475569',
            borderBottom: activeTab === 'chat' ? '2px solid #C9A54C' : '2px solid transparent',
          }}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className="flex-1 py-3 text-sm font-medium transition-colors"
          style={{
            color: activeTab === 'requests' ? '#C9A54C' : '#475569',
            borderBottom: activeTab === 'requests' ? '2px solid #C9A54C' : '2px solid transparent',
          }}
        >
          {isAdmin ? 'All Requests' : 'My Requests'}
          {requests.length > 0 && (
            <span
              className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
              style={{ background: 'rgba(201,165,76,0.15)', color: '#C9A54C' }}
            >
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chat area ── */}
        <div className={`flex-col min-w-0 flex-1 ${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex`}>

          {/* Chat header */}
          <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h1 className="text-xl font-bold text-white mb-0.5">Request a feature or report a bug</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Describe what you need — I&apos;ll help write it up clearly for Gary.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !submitted && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(201,165,76,0.1)', border: '1px solid rgba(201,165,76,0.2)' }}
                >
                  <Wrench size={26} style={{ color: '#C9A54C' }} />
                </div>
                <p className="text-white font-semibold text-lg mb-2">What would make this better?</p>
                <p className="text-sm mb-8 max-w-sm" style={{ color: '#64748b' }}>
                  Tell me about a feature you want, a bug you found, or anything you&apos;d change. Quick starts:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                  {STARTER_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-left text-sm rounded-xl px-4 py-3 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#bfdbfe' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitted && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(52,211,153,0.12)' }}>
                  <CheckCircle2 size={28} style={{ color: '#34d399' }} />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Request submitted!</p>
                <p className="text-sm mb-6" style={{ color: '#64748b' }}>Gary will review it and update the status. Got another one?</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'rgba(201,165,76,0.12)', border: '1px solid rgba(201,165,76,0.2)', color: '#C9A54C' }}
                >
                  Submit another request
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#C9A54C', color: '#0d1f3c', fontWeight: 500, borderRadius: '1rem 1rem 0.25rem 1rem' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderRadius: '1rem 1rem 1rem 0.25rem' }
                  }
                >
                  {msg.content === '' && msg.role === 'assistant'
                    ? <Loader2 size={14} className="animate-spin" style={{ color: '#93c5fd' }} />
                    : <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  }
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Submit preview card */}
          {extracted && (
            <div className="mx-6 mb-4 rounded-xl p-4 border" style={{ background: 'rgba(201,165,76,0.06)', borderColor: 'rgba(201,165,76,0.2)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-white">Ready to submit?</p>
                <button onClick={() => setExtracted(null)} style={{ color: '#64748b' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#93c5fd' }}>Title</label>
                  <input
                    value={extracted.title}
                    onChange={e => setExtracted(x => x ? { ...x, title: e.target.value } : x)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#93c5fd' }}>Description</label>
                  <textarea
                    value={extracted.description}
                    onChange={e => setExtracted(x => x ? { ...x, description: e.target.value } : x)}
                    rows={3}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white resize-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium block mb-1" style={{ color: '#93c5fd' }}>Type</label>
                    <select
                      value={extracted.type}
                      onChange={e => setExtracted(x => x ? { ...x, type: e.target.value } : x)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="feature">Feature</option>
                      <option value="bug">Bug</option>
                      <option value="change">Change</option>
                      <option value="question">Question</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium block mb-1" style={{ color: '#93c5fd' }}>Priority</label>
                    <select
                      value={extracted.priority}
                      onChange={e => setExtracted(x => x ? { ...x, priority: e.target.value } : x)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity"
                style={{ background: '#C9A54C', color: '#0d1f3c', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {submitting ? 'Submitting…' : 'Submit to Gary'}
              </button>
            </div>
          )}

          {/* Extract error */}
          {extractError && (
            <div className="mx-6 mb-3 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
              <span>{extractError}</span>
              <button onClick={() => setExtractError(null)} style={{ color: '#f87171', flexShrink: 0 }}><X size={14} /></button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Describe what you need…"
                disabled={streaming}
                className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              {messages.length >= 2 && !streaming && !extracted && (
                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  className="rounded-xl px-4 py-3 text-sm font-medium transition-opacity shrink-0"
                  style={{ background: 'rgba(201,165,76,0.12)', color: '#C9A54C', border: '1px solid rgba(201,165,76,0.2)', opacity: extracting ? 0.6 : 1 }}
                >
                  {extracting ? <Loader2 size={15} className="animate-spin" /> : 'Submit Request'}
                </button>
              )}
              <button
                onClick={() => sendMessage(input)}
                disabled={streaming || !input.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-opacity shrink-0"
                style={{ background: '#C9A54C', opacity: streaming || !input.trim() ? 0.4 : 1 }}
              >
                {streaming
                  ? <Loader2 size={16} className="animate-spin" style={{ color: '#0d1f3c' }} />
                  : <Send size={16} style={{ color: '#0d1f3c' }} />
                }
              </button>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: '#334155' }}>
              Chat until you&apos;re happy, then click <span style={{ color: '#C9A54C' }}>Submit Request</span> to write it up for Gary.
            </p>
          </div>
        </div>

        {/* ── Requests sidebar ── */}
        <div
          className={`w-full md:w-80 shrink-0 md:border-l flex-col overflow-hidden ${activeTab === 'requests' ? 'flex' : 'hidden'} md:flex`}
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="hidden md:block px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="font-semibold text-white text-sm">
              {isAdmin ? 'All Requests' : 'My Requests'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              {requests.filter(r => !['done', 'declined'].includes(r.status)).length} active
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(() => {
              const active   = requests.filter(r => !['done', 'declined'].includes(r.status))
              const resolved = requests.filter(r =>  ['done', 'declined'].includes(r.status))

              const renderCard = (req: FeatureRequest) => {
                const typeMeta   = TYPE_META[req.type]   ?? TYPE_META.feature
                const statusMeta = STATUS_META[req.status] ?? STATUS_META.new
                const TypeIcon   = typeMeta.icon
                return (
                  <div
                    key={req.id}
                    className="rounded-xl p-3 border"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <TypeIcon size={13} style={{ color: typeMeta.color }} />
                      <span className="text-xs font-medium" style={{ color: typeMeta.color }}>{typeMeta.label}</span>
                      <span
                        className="text-[10px] font-semibold ml-auto px-1.5 py-0.5 rounded-full"
                        style={{ color: PRIORITY_COLOR[req.priority], background: 'rgba(255,255,255,0.05)' }}
                      >
                        {req.priority}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-white leading-snug mb-1">{req.title}</p>
                    <p className="text-xs leading-snug mb-2" style={{ color: '#475569' }}>{req.description}</p>

                    {isAdmin && (
                      <p className="text-xs mb-2" style={{ color: '#334155' }}>From: {req.agentName}</p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5"
                        style={{ color: statusMeta.color, background: statusMeta.bg }}
                      >
                        <Clock size={10} />
                        {statusMeta.label}
                      </span>

                      {isAdmin && (
                        <div className="relative">
                          <select
                            value={req.status}
                            disabled={statusUpdating === req.id}
                            onChange={e => updateStatus(req.id, e.target.value)}
                            className="text-xs rounded-lg pl-2 pr-6 py-1 appearance-none focus:outline-none transition-opacity"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              color: '#94a3b8',
                              border: '1px solid rgba(255,255,255,0.1)',
                              opacity: statusUpdating === req.id ? 0.5 : 1,
                            }}
                          >
                            <option value="new">New</option>
                            <option value="in-review">In Review</option>
                            <option value="planned">Planned</option>
                            <option value="done">Done</option>
                            <option value="declined">Declined</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <>
                  {active.length === 0 && resolved.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-sm" style={{ color: '#334155' }}>No requests yet.</p>
                    </div>
                  )}

                  {active.length === 0 && resolved.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: '#334155' }}>No active requests.</p>
                    </div>
                  )}

                  {active.map(renderCard)}

                  {resolved.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => setShowResolved(v => !v)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors"
                        style={{ color: '#475569' }}
                      >
                        <ChevronDown
                          size={13}
                          className="transition-transform"
                          style={{ transform: showResolved ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                        {showResolved ? 'Hide' : 'Show'} completed &amp; declined ({resolved.length})
                      </button>
                      {showResolved && (
                        <div className="mt-2 space-y-2 opacity-60">
                          {resolved.map(renderCard)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
