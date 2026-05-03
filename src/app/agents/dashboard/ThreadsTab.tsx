'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MessageSquare, Plus, Building2, ChevronRight, Send, Loader2,
  CheckCircle2, Circle, Clock, X, Flag, Users, FileText,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Participant = {
  id: string
  participantType: 'AGENT' | 'CLIENT'
  agent: { id: string; name: string; email?: string } | null
  client: { id: string; name: string; email?: string } | null
}

type ThreadMessage = {
  id: string
  senderType: 'AGENT' | 'CLIENT' | 'AI'
  senderId: string | null
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
  completedAt: string | null
  sortOrder: number
}

type Thread = {
  id: string
  type: 'LISTING' | 'GENERAL'
  title: string | null
  listingId: string | null
  listing: {
    id: string
    title: string
    location: string
    images: string[]
    status: string
  } | null
  participants: Participant[]
  messages: ThreadMessage[]
  milestones: Milestone[]
  status: string
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

type ClientOption = { id: string; name: string; email: string | null }
type AgentOption  = { id: string; name: string; email: string }
type ListingOption = { id: string; title: string; location: string; images: string[] }

// ─── Milestone status helpers ─────────────────────────────────────────────────

const milestoneIcon = (status: Milestone['status']) => {
  if (status === 'COMPLETE') return <CheckCircle2 size={16} className="text-green-500 shrink-0" />
  if (status === 'IN_PROGRESS') return <Clock size={16} className="text-amber-500 shrink-0" />
  return <Circle size={16} className="text-gray-300 shrink-0" />
}

const milestoneNext: Record<Milestone['status'], Milestone['status']> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETE',
  COMPLETE: 'PENDING',
}

// ─── Thread label ─────────────────────────────────────────────────────────────

function threadLabel(t: Thread) {
  return t.type === 'LISTING' ? (t.listing?.title ?? 'Listing thread') : (t.title ?? 'General thread')
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ThreadsTab({
  getToken,
  clients,
  agents,
  listings,
  filterListingId,
  onClearFilter,
}: {
  getToken: () => Promise<string>
  clients: ClientOption[]
  agents: AgentOption[]
  listings: ListingOption[]
  filterListingId?: string | null
  onClearFilter?: () => void
}) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [sending, setSending] = useState(false)
  const [aiReplying, setAiReplying] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchThreads() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  async function fetchThreads() {
    setLoadingThreads(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/threads', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setThreads(data.threads ?? [])
    } finally {
      setLoadingThreads(false)
    }
  }

  async function openThread(thread: Thread) {
    setLoadingDetail(true)
    setSelected({ ...thread, messages: [] })
    try {
      const token = await getToken()
      const res = await fetch(`/api/portal/threads/${thread.id}`, { headers: { Authorization: `Bearer ${token}` } })
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
      const res = await fetch(`/api/portal/threads/${selected.id}/messages`, {
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

  async function cycleMilestoneStatus(milestone: Milestone) {
    if (!selected) return
    const next = milestoneNext[milestone.status]
    const token = await getToken()
    const res = await fetch(`/api/portal/threads/${selected.id}/milestones/${milestone.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    const data = await res.json()
    if (data.milestone) {
      setSelected(s => s ? {
        ...s,
        milestones: s.milestones.map(m => m.id === milestone.id ? data.milestone : m),
      } : s)
    }
  }

  async function deleteMilestone(milestoneId: string) {
    if (!selected) return
    const token = await getToken()
    await fetch(`/api/portal/threads/${selected.id}/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSelected(s => s ? { ...s, milestones: s.milestones.filter(m => m.id !== milestoneId) } : s)
  }

  async function addMilestone() {
    if (!selected || !newMilestoneTitle.trim()) return
    setAddingMilestone(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/portal/threads/${selected.id}/milestones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMilestoneTitle.trim() }),
      })
      const data = await res.json()
      if (data.milestone) {
        setSelected(s => s ? { ...s, milestones: [...s.milestones, data.milestone] } : s)
        setNewMilestoneTitle('')
        setShowMilestoneForm(false)
      }
    } finally {
      setAddingMilestone(false)
    }
  }

  const filteredThreads = filterListingId
    ? threads.filter(t => t.listingId === filterListingId)
    : threads
  const listingThreads = filteredThreads.filter(t => t.type === 'LISTING')
  const generalThreads = filteredThreads.filter(t => t.type === 'GENERAL')

  return (
    <div className="flex gap-0 h-[calc(100vh-160px)] min-h-[500px]">

      {/* ── Thread list ── */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[var(--color-navy-900)] text-sm">Conversations</h2>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium bg-[var(--color-navy-800)] text-white px-3 py-1.5 rounded-lg hover:bg-[var(--color-navy-700)] transition-colors"
          >
            <Plus size={13} />
            New
          </button>
        </div>

        {filterListingId && (
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
            <p className="text-xs text-amber-800 truncate">
              {listings.find(l => l.id === filterListingId)?.title ?? 'Filtered listing'}
            </p>
            <button
              onClick={onClearFilter}
              className="text-amber-600 hover:text-amber-800 shrink-0"
              title="Clear filter"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--color-muted)]" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare size={32} className="text-gray-200 mb-3" />
              <p className="text-xs text-[var(--color-muted)]">No conversations yet. Start one with a client.</p>
            </div>
          ) : (
            <>
              {listingThreads.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Listing Threads
                  </p>
                  {listingThreads.map(t => (
                    <ThreadListItem
                      key={t.id}
                      thread={t}
                      active={selected?.id === t.id}
                      onClick={() => openThread(t)}
                    />
                  ))}
                </div>
              )}
              {generalThreads.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    General
                  </p>
                  {generalThreads.map(t => (
                    <ThreadListItem
                      key={t.id}
                      thread={t}
                      active={selected?.id === t.id}
                      onClick={() => openThread(t)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Conversation panel ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <MessageSquare size={40} className="text-gray-200 mb-3" />
            <p className="text-sm text-[var(--color-muted)]">Select a conversation or start a new one.</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              {selected.listing?.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[var(--color-navy-50)] flex items-center justify-center shrink-0">
                  {selected.type === 'LISTING' ? <Building2 size={18} className="text-[var(--color-navy-300)]" /> : <FileText size={18} className="text-[var(--color-navy-300)]" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-navy-900)] text-sm truncate">{threadLabel(selected)}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {selected.participants
                    .map(p => p.agent?.name ?? p.client?.name ?? '?')
                    .join(', ')}
                </p>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Messages */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin text-[var(--color-muted)]" />
                    </div>
                  ) : selected.messages.length === 0 ? (
                    <p className="text-xs text-center text-[var(--color-muted)] py-8">No messages yet. Send the first one.</p>
                  ) : (
                    selected.messages.map(msg => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))
                  )}
                  {aiReplying && <AiTypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="px-5 py-3 border-t border-gray-100">
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

              {/* Milestones sidebar */}
              <div className="w-56 shrink-0 border-l border-gray-100 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flag size={13} className="text-[var(--color-navy-700)]" />
                    <span className="text-xs font-semibold text-[var(--color-navy-900)]">Milestones</span>
                  </div>
                  <button
                    onClick={() => setShowMilestoneForm(v => !v)}
                    className="text-[var(--color-navy-700)] hover:text-[var(--color-navy-900)] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {showMilestoneForm && (
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <input
                      autoFocus
                      value={newMilestoneTitle}
                      onChange={e => setNewMilestoneTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addMilestone() }}
                      placeholder="Milestone title…"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-navy-300)]"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={addMilestone}
                        disabled={addingMilestone || !newMilestoneTitle.trim()}
                        className="text-xs bg-[var(--color-navy-800)] text-white px-2 py-1 rounded-lg disabled:opacity-40"
                      >
                        {addingMilestone ? '…' : 'Add'}
                      </button>
                      <button
                        onClick={() => { setShowMilestoneForm(false); setNewMilestoneTitle('') }}
                        className="text-xs text-[var(--color-muted)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                  {selected.milestones.length === 0 ? (
                    <p className="text-[11px] text-[var(--color-muted)] text-center py-4">No milestones yet.</p>
                  ) : (
                    selected.milestones.map(m => (
                      <div key={m.id} className="group flex items-start gap-2 py-1.5">
                        <button
                          onClick={() => cycleMilestoneStatus(m)}
                          className="mt-0.5 hover:opacity-70 transition-opacity"
                          title="Click to advance status"
                        >
                          {milestoneIcon(m.status)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${m.status === 'COMPLETE' ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-navy-900)]'}`}>
                            {m.title}
                          </p>
                          {m.dueDate && (
                            <p className="text-[10px] text-[var(--color-muted)]">
                              {new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteMilestone(m.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New thread modal ── */}
      {showNewModal && (
        <NewThreadModal
          getToken={getToken}
          clients={clients}
          agents={agents}
          listings={listings}
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

// ─── Thread list item ─────────────────────────────────────────────────────────

function ThreadListItem({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  const lastMsg = thread.messages[0]
  const clientNames = thread.participants
    .filter(p => p.participantType === 'CLIENT')
    .map(p => p.client?.name ?? '?')
    .join(', ')

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2 ${
        active
          ? 'bg-[var(--color-navy-50)] border-l-[var(--color-navy-700)]'
          : 'border-l-transparent hover:bg-gray-50'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--color-navy-50)] flex items-center justify-center shrink-0 mt-0.5">
        {thread.type === 'LISTING'
          ? <Building2 size={14} className="text-[var(--color-navy-400)]" />
          : <FileText size={14} className="text-[var(--color-navy-400)]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-navy-900)] truncate">{threadLabel(thread)}</p>
        {clientNames && (
          <p className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
            <Users size={10} />
            {clientNames}
          </p>
        )}
        {lastMsg && (
          <p className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">{lastMsg.content}</p>
        )}
      </div>
      <ChevronRight size={13} className="text-gray-300 shrink-0 mt-1" />
    </button>
  )
}

// ─── AI typing indicator ─────────────────────────────────────────────────────

function AiTypingIndicator() {
  return (
    <div className="flex flex-col items-start">
      <p className="text-[10px] text-[var(--color-muted)] mb-1 px-1">Mercers AI</p>
      <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ThreadMessage }) {
  const isMe = message.senderType === 'AGENT'
  const isAI = message.senderType === 'AI'
  const time = new Date(message.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(message.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && (
        <p className="text-[10px] text-[var(--color-muted)] mb-1 px-1">
          {isAI ? 'AI Assistant' : (message.senderName ?? 'Client')}
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

// ─── New thread modal ─────────────────────────────────────────────────────────

function ParticipantList({
  label,
  items,
  selected,
  onToggle,
  emptyText,
}: {
  label: string
  items: { id: string; name: string; email?: string | null }[]
  selected: string[]
  onToggle: (id: string) => void
  emptyText: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-2">{label}</label>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">{emptyText}</p>
      ) : (
        <div className="max-h-36 overflow-y-auto space-y-0.5 border border-gray-100 rounded-lg p-1.5">
          {items.map(item => (
            <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="rounded"
              />
              <span className="text-sm text-[var(--color-navy-900)]">{item.name}</span>
              {item.email && <span className="text-xs text-[var(--color-muted)] truncate">{item.email}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function NewThreadModal({
  getToken,
  clients,
  agents,
  listings,
  onCreated,
  onClose,
}: {
  getToken: () => Promise<string>
  clients: ClientOption[]
  agents: AgentOption[]
  listings: ListingOption[]
  onCreated: (thread: Thread) => void
  onClose: () => void
}) {
  const [type, setType] = useState<'LISTING' | 'GENERAL'>('LISTING')
  const [listingId, setListingId] = useState('')
  const [title, setTitle] = useState('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [firstMessage, setFirstMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  async function handleCreate() {
    if (selectedClientIds.length === 0 && selectedAgentIds.length === 0) {
      setError('Add at least one participant.')
      return
    }
    if (type === 'LISTING' && !listingId) { setError('Please select a listing.'); return }
    if (type === 'GENERAL' && !title.trim()) { setError('Please enter a subject.'); return }
    setCreating(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/threads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim() || null,
          listingId: listingId || null,
          clientIds: selectedClientIds,
          agentIds: selectedAgentIds,
          firstMessage: firstMessage.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create thread'); return }
      onCreated(data.thread)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-[var(--color-navy-900)]">New Conversation</h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            <button
              onClick={() => setType('LISTING')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${type === 'LISTING' ? 'bg-[var(--color-navy-800)] text-white' : 'text-[var(--color-muted)] hover:bg-gray-50'}`}
            >
              <Building2 size={14} />
              About a Listing
            </button>
            <button
              onClick={() => setType('GENERAL')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors border-l border-gray-200 ${type === 'GENERAL' ? 'bg-[var(--color-navy-800)] text-white' : 'text-[var(--color-muted)] hover:bg-gray-50'}`}
            >
              <FileText size={14} />
              General
            </button>
          </div>

          {/* Listing selector */}
          {type === 'LISTING' && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Property</label>
              <select
                value={listingId}
                onChange={e => setListingId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
              >
                <option value="">— select listing —</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.title} · {l.location}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title for general */}
          {type === 'GENERAL' && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">Subject</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Contract review, Market update…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)]"
              />
            </div>
          )}

          {/* Participants */}
          <ParticipantList
            label="Clients"
            items={clients}
            selected={selectedClientIds}
            onToggle={toggle(setSelectedClientIds)}
            emptyText="No clients assigned to you yet."
          />
          <ParticipantList
            label="Agents"
            items={agents}
            selected={selectedAgentIds}
            onToggle={toggle(setSelectedAgentIds)}
            emptyText="No other agents found."
          />

          {/* Optional first message */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-navy-700)] mb-1">First message (optional)</label>
            <textarea
              value={firstMessage}
              onChange={e => setFirstMessage(e.target.value)}
              rows={3}
              placeholder="Start the conversation…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-300)] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 bg-[var(--color-navy-800)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-navy-700)] disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : null}
            Start conversation
          </button>
        </div>
      </div>
    </div>
  )
}
