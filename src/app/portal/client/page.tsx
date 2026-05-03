'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, LogOut, MessageSquare, Building2, FileText, Send, Loader2,
  CheckCircle2, Circle, Clock, Plus, X, ChevronRight, Flag,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ThreadMessage = {
  id: string
  senderType: 'AGENT' | 'CLIENT' | 'AI'
  senderName: string | null
  content: string
  createdAt: string
}

type Milestone = {
  id: string
  title: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE'
  dueDate: string | null
  sortOrder: number
}

type Participant = {
  participantType: 'AGENT' | 'CLIENT'
  agent: { id: string; name: string } | null
  client: { id: string; name: string } | null
}

type Thread = {
  id: string
  type: 'LISTING' | 'GENERAL'
  title: string | null
  listing: { id: string; title: string; location: string; images: string[]; status: string } | null
  participants: Participant[]
  messages: ThreadMessage[]
  milestones: Milestone[]
  status: string
  updatedAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function threadLabel(t: Thread) {
  return t.type === 'LISTING' ? (t.listing?.title ?? 'Property conversation') : (t.title ?? 'General conversation')
}

const milestoneIcon = (status: Milestone['status']) => {
  if (status === 'COMPLETE') return <CheckCircle2 size={15} className="text-green-500 shrink-0" />
  if (status === 'IN_PROGRESS') return <Clock size={15} className="text-amber-500 shrink-0" />
  return <Circle size={15} className="text-gray-300 shrink-0" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientPortalPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [aiReplying, setAiReplying] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [view, setView] = useState<'list' | 'thread'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (role === null) return
    if (['agent', 'admin', 'dev'].includes(role)) { router.replace('/agents/dashboard'); return }
    if (role !== 'user') { router.replace('/login'); return }
    fetchThreads()
  }, [user, role, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  async function getToken() {
    return user!.getIdToken()
  }

  async function fetchThreads() {
    setLoadingThreads(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/client/threads', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setThreads(data.threads ?? [])
    } finally {
      setLoadingThreads(false)
    }
  }

  async function openThread(thread: Thread) {
    setView('thread')
    setLoadingDetail(true)
    setSelected({ ...thread, messages: [] })
    try {
      const token = await getToken()
      const res = await fetch(`/api/client/threads/${thread.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setSelected(data.thread)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function sendMessage() {
    if (!selected || !messageText.trim()) return
    setSending(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/client/threads/${selected.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText.trim() }),
      })
      const data = await res.json()
      if (data.message) {
        setSelected(s => s ? { ...s, messages: [...s.messages, data.message] } : s)
        setMessageText('')
        fetchThreads()
        triggerAiReply(selected.id, token)
      }
    } finally {
      setSending(false)
    }
  }

  async function triggerAiReply(threadId: string, token: string) {
    setAiReplying(true)
    try {
      const res = await fetch(`/api/portal/threads/${threadId}/ai-reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.message) {
        setSelected(s => s && s.id === threadId ? { ...s, messages: [...s.messages, data.message] } : s)
        fetchThreads()
      }
    } finally {
      setAiReplying(false)
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
            Back to site
          </Link>
          <span className="text-blue-800">|</span>
          <span className="font-bold text-lg">My Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200 hidden sm:block">{user.email}</span>
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* ── Mobile: list view ── */}
        {view === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-bold text-[var(--color-navy-900)]">Your conversations</h1>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] transition-colors"
              >
                <Plus size={15} />
                New
              </button>
            </div>

            {loadingThreads ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[var(--color-muted)]" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare size={40} className="text-gray-200 mb-3" />
                <p className="text-[var(--color-muted)] mb-4">No conversations yet.</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="bg-[var(--color-navy-800)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] transition-colors"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => openThread(t)}
                    className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 text-left hover:border-[var(--color-navy-200)] transition-colors"
                  >
                    {t.listing?.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.listing.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[var(--color-navy-50)] flex items-center justify-center shrink-0">
                        {t.type === 'LISTING'
                          ? <Building2 size={22} className="text-[var(--color-navy-300)]" />
                          : <FileText size={22} className="text-[var(--color-navy-300)]" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-navy-900)] truncate">{threadLabel(t)}</p>
                      {t.listing && (
                        <p className="text-xs text-[var(--color-muted)]">{t.listing.location}</p>
                      )}
                      {t.messages[0] && (
                        <p className="text-sm text-[var(--color-muted)] truncate mt-1">{t.messages[0].content}</p>
                      )}
                      {t.milestones.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {t.milestones.slice(0, 4).map(m => (
                            <span key={m.id} title={m.title}>
                              {milestoneIcon(m.status)}
                            </span>
                          ))}
                          {t.milestones.length > 4 && (
                            <span className="text-[11px] text-[var(--color-muted)]">+{t.milestones.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Thread view ── */}
        {view === 'thread' && selected && (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Thread header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setView('list'); setSelected(null) }}
                className="flex items-center gap-1.5 text-sm text-[var(--color-navy-700)] hover:text-[var(--color-navy-900)] transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              {selected.listing?.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[var(--color-navy-50)] flex items-center justify-center">
                  {selected.type === 'LISTING' ? <Building2 size={18} className="text-[var(--color-navy-300)]" /> : <FileText size={18} className="text-[var(--color-navy-300)]" />}
                </div>
              )}
              <div>
                <p className="font-semibold text-[var(--color-navy-900)]">{threadLabel(selected)}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {selected.participants.filter(p => p.participantType === 'AGENT').map(p => p.agent?.name).join(', ') || 'Your agent'}
                </p>
              </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
              {/* Conversation */}
              <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm min-h-0">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin text-[var(--color-muted)]" />
                    </div>
                  ) : selected.messages.length === 0 ? (
                    <p className="text-xs text-center text-[var(--color-muted)] py-8">No messages yet. Send the first one.</p>
                  ) : (
                    selected.messages.map(msg => (
                      <ClientMessageBubble key={msg.id} message={msg} />
                    ))
                  )}
                  {aiReplying && (
                    <div className="flex flex-col items-start">
                      <p className="text-[10px] text-[var(--color-muted)] mb-1 px-1">Mercers AI</p>
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      placeholder="Type a message…"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !messageText.trim()}
                      className="flex items-center justify-center w-10 h-10 bg-[var(--color-navy-800)] text-white rounded-xl hover:bg-[var(--color-navy-700)] disabled:opacity-40 transition-colors shrink-0"
                    >
                      {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Milestone track (read-only for clients) */}
              {selected.milestones.length > 0 && (
                <div className="w-52 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Flag size={13} className="text-[var(--color-navy-700)]" />
                    <span className="text-xs font-semibold text-[var(--color-navy-900)]">Progress</span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                    {selected.milestones.map((m, i) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <div className="flex flex-col items-center">
                          {milestoneIcon(m.status)}
                          {i < selected.milestones.length - 1 && (
                            <div className={`w-px flex-1 mt-1 ${m.status === 'COMPLETE' ? 'bg-green-200' : 'bg-gray-100'}`} style={{ height: 16 }} />
                          )}
                        </div>
                        <div className="pb-2">
                          <p className={`text-xs leading-snug ${m.status === 'COMPLETE' ? 'text-[var(--color-muted)] line-through' : 'text-[var(--color-navy-900)]'}`}>
                            {m.title}
                          </p>
                          {m.dueDate && m.status !== 'COMPLETE' && (
                            <p className="text-[10px] text-[var(--color-muted)]">
                              By {new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── New thread modal ── */}
      {showNewModal && (
        <NewClientThreadModal
          getToken={getToken}
          onCreated={thread => {
            setShowNewModal(false)
            fetchThreads()
            openThread(thread)
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function ClientMessageBubble({ message }: { message: ThreadMessage }) {
  const isMe = message.senderType === 'CLIENT'
  const isAI = message.senderType === 'AI'
  const time = new Date(message.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(message.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && (
        <p className="text-[10px] text-[var(--color-muted)] mb-1 px-1">
          {isAI ? 'AI Assistant' : (message.senderName ?? 'Agent')}
        </p>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-[var(--color-navy-800)] text-white rounded-br-sm'
            : isAI
            ? 'bg-amber-50 text-amber-900 border border-amber-100 rounded-bl-sm'
            : 'bg-gray-100 text-[var(--color-navy-900)] rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
      <p className="text-[10px] text-[var(--color-muted)] mt-1 px-1">{date} {time}</p>
    </div>
  )
}

// ─── New thread modal (client) ────────────────────────────────────────────────

function NewClientThreadModal({
  getToken,
  onCreated,
  onClose,
}: {
  getToken: () => Promise<string>
  onCreated: (thread: Thread) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!title.trim()) { setError('Please enter a subject.'); return }
    setCreating(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/client/threads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERAL',
          title: title.trim() || null,
          firstMessage: firstMessage.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to start conversation'); return }
      onCreated(data.thread)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[var(--color-navy-900)]">Start a conversation</h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Subject</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Question about 4 Elm Close, Offer query…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Message (optional)</label>
            <textarea
              value={firstMessage}
              onChange={e => setFirstMessage(e.target.value)}
              rows={3}
              placeholder="What would you like to discuss?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : null}
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
