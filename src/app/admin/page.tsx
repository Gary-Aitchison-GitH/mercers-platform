'use client'

import { useState, useEffect, useRef } from 'react'
import { Mountain, Send, Users, MessageSquare, Clock, ArrowLeft } from 'lucide-react'
import type { Conversation, ChatMessage } from '@/lib/store'
import type { SignoffRequest, MarketingTask } from '@/lib/marketing-store'

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'mercers2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [adminTab, setAdminTab] = useState<'chat' | 'marketing'>('chat')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [garyActive, setGaryActive] = useState<Set<string>>(new Set())
  const [signoffs, setSignoffs] = useState<SignoffRequest[]>([])
  const [marketingTasks, setMarketingTasks] = useState<MarketingTask[]>([])
  const [resolveComment, setResolveComment] = useState<Record<string, string>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConvo = conversations.find(c => c.id === selected)

  const fetchConvos = async () => {
    const res = await fetch('/api/messages?admin=true')
    const data = await res.json()
    setConversations(data.conversations || [])
  }

  const fetchMarketing = async () => {
    const res = await fetch('/api/marketing')
    const data = await res.json()
    setSignoffs(data.signoffs || [])
    setMarketingTasks(data.tasks || [])
  }

  const resolveSignoff = async (id: string, decision: 'approved' | 'rejected') => {
    const comment = resolveComment[id] || ''
    await fetch('/api/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve-signoff', signoffId: id, decision, adminComment: comment, resolvedBy: 'Gary' }),
    })
    setResolveComment(prev => { const n = { ...prev }; delete n[id]; return n })
    fetchMarketing()
  }

  useEffect(() => {
    if (!authed) return
    fetchConvos()
    fetchMarketing()
    pollRef.current = setInterval(() => { fetchConvos(); fetchMarketing() }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [authed])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConvo?.messages.length])

  const handleSelect = async (id: string) => {
    setSelected(id)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, action: 'mark-read' }),
    })
  }

  const handleGaryJoin = async (sessionId: string) => {
    const isActive = garyActive.has(sessionId)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: isActive ? 'gary-leave' : 'gary-join' }),
    })
    setGaryActive(prev => {
      const next = new Set(prev)
      isActive ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    const text = reply.trim()
    setReply('')
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selected, role: 'gary', content: text }),
    })
    fetchConvos()
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1f3c' }}>
        <div className="bg-white rounded-2xl p-8 w-80 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: '#1B3A6B' }}>
              <Mountain size={18} color="#C9A54C" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1B3A6B' }}>Mercers Admin</p>
              <p className="text-xs text-gray-400">Gary&apos;s Control Panel</p>
            </div>
          </div>
          <input
            type="password"
            placeholder="Admin password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pass === ADMIN_PASS && setAuthed(true)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none mb-3 focus:border-[#1B3A6B]"
          />
          <button
            onClick={() => pass === ADMIN_PASS && setAuthed(true)}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: '#1B3A6B' }}
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadByGary, 0)
  const pendingSignoffs = signoffs.filter(s => s.status === 'pending').length

  return (
    <div className="min-h-screen flex" style={{ background: '#F9F8F5' }}>
      {/* Sidebar */}
      <aside className="w-80 flex flex-col border-r border-gray-200 bg-white" style={{ minHeight: '100vh' }}>
        <div className="px-5 py-4 border-b border-gray-100" style={{ background: '#0d1f3c' }}>
          <div className="flex items-center gap-2">
            <Mountain size={18} color="#C9A54C" />
            <span className="font-bold text-white text-sm">Mercers Admin</span>
            {(totalUnread + pendingSignoffs) > 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#C9A54C' }}>
                {totalUnread + pendingSignoffs}
              </span>
            )}
          </div>
          <p className="text-xs text-blue-300 mt-0.5">Gary&apos;s Control Panel</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100">
          <button onClick={() => setAdminTab('chat')}
            className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{ color: adminTab === 'chat' ? '#1B3A6B' : '#9ca3af', borderBottom: adminTab === 'chat' ? '2px solid #1B3A6B' : '2px solid transparent' }}>
            <MessageSquare size={12} /> Chat
            {totalUnread > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#C9A54C' }}>{totalUnread}</span>}
          </button>
          <button onClick={() => setAdminTab('marketing')}
            className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{ color: adminTab === 'marketing' ? '#1B3A6B' : '#9ca3af', borderBottom: adminTab === 'marketing' ? '2px solid #1B3A6B' : '2px solid transparent' }}>
            ✦ Marketing
            {pendingSignoffs > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#f59e0b' }}>{pendingSignoffs}</span>}
          </button>
        </div>

        {adminTab === 'chat' && (
        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Users size={12} /> {conversations.length} sessions</span>
          <span className="flex items-center gap-1"><MessageSquare size={12} /> {totalUnread} unread</span>
        </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {adminTab === 'chat' && (
            conversations.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-12">No conversations yet</div>
            ) : conversations.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === c.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{c.sessionId.slice(0, 8)}</span>
                      {c.status === 'gary-joined' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold text-white" style={{ background: '#1B3A6B' }}>You&apos;re in</span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#eef4fd', color: '#1B3A6B' }}>
                        {c.locale.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {c.messages.at(-1)?.content.slice(0, 50) || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock size={10} />
                      {new Date(c.lastActivity).toLocaleTimeString()}
                    </p>
                  </div>
                  {c.unreadByGary > 0 && (
                    <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: '#C9A54C' }}>
                      {c.unreadByGary}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
          {adminTab === 'marketing' && (
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 px-1">
                {marketingTasks.filter(t => t.status === 'done' || t.status === 'approved').length} / {marketingTasks.length} tasks complete
              </p>
              {signoffs.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-8">No sign-off requests yet</div>
              ) : signoffs.map(s => (
                <div key={s.id} className="rounded-xl p-3 border text-xs"
                  style={{ borderColor: s.status === 'pending' ? '#f59e0b' : '#e5e7eb', background: s.status === 'pending' ? '#fffbeb' : '#f9fafb' }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-800 leading-snug">{s.taskTitle}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full font-bold"
                      style={{ background: s.status === 'pending' ? '#fef3c7' : s.status === 'approved' ? '#d1fae5' : '#fee2e2', color: s.status === 'pending' ? '#92400e' : s.status === 'approved' ? '#065f46' : '#991b1b' }}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mb-1">Phase {s.phase} · {s.requestedBy}</p>
                  <p className="text-gray-600 italic mb-2">"{s.reason}"</p>
                  {s.status === 'pending' && (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Optional comment..."
                        value={resolveComment[s.id] || ''}
                        onChange={e => setResolveComment(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => resolveSignoff(s.id, 'approved')}
                          className="flex-1 py-1.5 rounded-lg font-bold text-white text-xs"
                          style={{ background: '#1B3A6B' }}>Approve</button>
                        <button onClick={() => resolveSignoff(s.id, 'rejected')}
                          className="flex-1 py-1.5 rounded-lg font-bold text-xs"
                          style={{ background: '#fee2e2', color: '#991b1b' }}>Reject</button>
                      </div>
                    </div>
                  )}
                  {s.adminComment && (
                    <p className="text-xs mt-1" style={{ color: '#1B3A6B' }}>Comment: {s.adminComment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 flex flex-col">
        {adminTab === 'marketing' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">✦</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1B3A6B' }}>Marketing AI — Task Overview</p>
                  <p className="text-xs text-gray-400">All 4 phases · {marketingTasks.filter(t => t.status === 'done' || t.status === 'approved').length} of {marketingTasks.length} complete</p>
                </div>
                <a href="/agents/marketing-ai" target="_blank"
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
                  style={{ background: '#1B3A6B' }}>Open Marketing Hub ↗</a>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {[1, 2, 3, 4].map(phase => {
                const phaseTasks = marketingTasks.filter(t => t.phase === phase)
                const phaseLabels: Record<number, string> = { 1: 'Phase 1 — Foundation (Weeks 1–4)', 2: 'Phase 2 — Soft Launch (Weeks 5–8)', 3: 'Phase 3 — Growth Engine (Months 3–6)', 4: 'Phase 4 — Market Leadership (Months 6–12)' }
                const done = phaseTasks.filter(t => t.status === 'done' || t.status === 'approved').length
                return (
                  <div key={phase} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold" style={{ color: '#1B3A6B' }}>{phaseLabels[phase]}</h3>
                      <span className="text-xs text-gray-400">{done}/{phaseTasks.length}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${phaseTasks.length ? (done / phaseTasks.length) * 100 : 0}%`, background: '#C9A54C' }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {phaseTasks.map(t => {
                        const statusColor: Record<string, string> = { pending: '#9ca3af', 'in-progress': '#3b82f6', 'awaiting-signoff': '#f59e0b', approved: '#C9A54C', done: '#10b981', blocked: '#ef4444' }
                        return (
                          <div key={t.id} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg bg-white border border-gray-100">
                            <span className="text-gray-700 flex-1">{t.title}</span>
                            <span className="text-xs shrink-0" style={{ color: statusColor[t.status] || '#9ca3af' }}>
                              {t.status.replace(/-/g, ' ')}
                            </span>
                            <span className="text-gray-400 shrink-0 hidden sm:block">→ {t.assignedTo}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {adminTab === 'chat' && !selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to view</p>
            </div>
          </div>
        ) : selectedConvo ? (
          <>
            {/* Convo header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-4">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 md:hidden">
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#1B3A6B' }}>
                  Session {selectedConvo.sessionId.slice(0, 12)}
                </p>
                <p className="text-xs text-gray-400">{selectedConvo.messages.length} messages · {selectedConvo.locale.toUpperCase()} · {new Date(selectedConvo.startedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleGaryJoin(selectedConvo.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: garyActive.has(selectedConvo.id) ? '#C9A54C' : '#1B3A6B' }}
              >
                {garyActive.has(selectedConvo.id) ? 'Leave Convo' : 'Join as Gary'}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3" style={{ background: '#F9F8F5' }}>
              {selectedConvo.messages.map((msg: ChatMessage) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div>
                    <p className="text-xs text-gray-400 mb-1 px-1">{msg.role === 'gary' ? 'Gary' : msg.role === 'assistant' ? 'AI Agent' : 'User'}</p>
                    <div
                      className="max-w-md px-4 py-2.5 text-sm rounded-2xl"
                      style={{
                        background: msg.role === 'user' ? '#C9A54C' : msg.role === 'gary' ? '#1B3A6B' : '#ffffff',
                        color: msg.role === 'user' || msg.role === 'gary' ? 'white' : '#1a1a1a',
                        border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            {garyActive.has(selectedConvo.id) && (
              <div className="bg-white border-t border-gray-100 px-6 py-4 flex gap-3 items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1B3A6B' }}>
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply()}
                  placeholder="Reply as Gary..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B3A6B] transition-colors"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
                  style={{ background: '#1B3A6B' }}
                >
                  <Send size={16} />
                </button>
              </div>
            )}
            {!garyActive.has(selectedConvo.id) && (
              <div className="bg-white border-t border-gray-100 px-6 py-3 text-center">
                <p className="text-xs text-gray-400">AI is handling this conversation. <button onClick={() => handleGaryJoin(selectedConvo.id)} className="font-semibold" style={{ color: '#1B3A6B' }}>Take over as Gary</button> to reply directly.</p>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
