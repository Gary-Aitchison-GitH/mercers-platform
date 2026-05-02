'use client'

import { useState, useEffect, useRef } from 'react'
import type { MarketingTask, SignoffRequest, MarketingChatMessage, TaskStatus } from '@/lib/marketing-store'

const PHASE_COLORS: Record<number, { accent: string; bg: string; border: string }> = {
  1: { accent: '#C9A54C', bg: 'rgba(201,165,76,0.08)', border: 'rgba(201,165,76,0.25)' },
  2: { accent: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
  3: { accent: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  4: { accent: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
}

const STATUS_LABEL: Record<TaskStatus, { label: string; color: string }> = {
  'pending':          { label: 'Pending',          color: '#6b7280' },
  'in-progress':      { label: 'In Progress',      color: '#60a5fa' },
  'awaiting-signoff': { label: 'Awaiting Sign-off', color: '#f59e0b' },
  'approved':         { label: 'Approved',         color: '#C9A54C' },
  'done':             { label: 'Done',              color: '#34d399' },
  'blocked':          { label: 'Blocked',           color: '#f87171' },
}

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 — Foundation',
  2: 'Phase 2 — Soft Launch',
  3: 'Phase 3 — Growth Engine',
  4: 'Phase 4 — Market Leadership',
}

export default function MarketingAIPage() {
  const [tasks, setTasks] = useState<MarketingTask[]>([])
  const [signoffs, setSignoffs] = useState<SignoffRequest[]>([])
  const [chat, setChat] = useState<MarketingChatMessage[]>([])
  const [input, setInput] = useState('')
  const [agentName, setAgentName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'signoffs'>('tasks')
  const [activePhase, setActivePhase] = useState<number>(1)
  const [signoffModal, setSignoffModal] = useState<MarketingTask | null>(null)
  const [signoffReason, setSignoffReason] = useState('')
  const [statusModal, setStatusModal] = useState<MarketingTask | null>(null)
  const [pendingStatus, setPendingStatus] = useState<TaskStatus>('in-progress')
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    const res = await fetch('/api/marketing')
    const data = await res.json()
    setTasks(data.tasks || [])
    setSignoffs(data.signoffs || [])
    setChat(data.chatHistory || [])
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.length])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setSending(true)
    setChat(prev => [...prev, {
      id: 'tmp',
      role: 'user',
      content: msg,
      agentName,
      timestamp: new Date().toISOString(),
    }])
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: msg, agentName }),
      })
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
      await fetchData()
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async () => {
    if (!statusModal) return
    await fetch('/api/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-task', taskId: statusModal.id, status: pendingStatus }),
    })
    setStatusModal(null)
    fetchData()
  }

  const requestSignoff = async () => {
    if (!signoffModal || !signoffReason.trim()) return
    await fetch('/api/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request-signoff', taskId: signoffModal.id, requestedBy: agentName || 'Agent', reason: signoffReason }),
    })
    setSignoffModal(null)
    setSignoffReason('')
    fetchData()
  }

  const phaseTasks = tasks.filter(t => t.phase === activePhase)
  const pendingSignoffs = signoffs.filter(s => s.status === 'pending').length

  const completedByPhase = (phase: number) => {
    const pts = tasks.filter(t => t.phase === phase)
    return pts.filter(t => t.status === 'done' || t.status === 'approved').length
  }

  if (!nameSet) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
        <div className="rounded-2xl p-8 w-80" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,165,76,0.3)' }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'rgba(201,165,76,0.15)' }}>
              <span className="text-2xl">✦</span>
            </div>
            <h1 className="text-lg font-bold text-white">Mercers Marketing AI</h1>
            <p className="text-xs mt-1" style={{ color: 'rgba(200,215,255,0.45)' }}>Who are you?</p>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Your name (e.g. Dawn Brown)"
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agentName.trim() && setNameSet(true)}
            className="w-full rounded-xl px-4 py-3 text-sm mb-3 outline-none text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button
            onClick={() => agentName.trim() && setNameSet(true)}
            disabled={!agentName.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#C9A54C' }}
          >
            Enter Marketing Hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0f1e', color: '#f0f4ff' }}>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0"
        style={{ background: 'rgba(10,15,30,0.9)', borderBottom: '1px solid rgba(201,165,76,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'rgba(201,165,76,0.15)', border: '1px solid rgba(201,165,76,0.3)' }}>✦</div>
          <div>
            <span className="font-bold text-white text-sm">Mercers Marketing AI</span>
            <p className="text-xs" style={{ color: 'rgba(200,215,255,0.4)' }}>Go-To-Market Execution Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingSignoffs > 0 && (
            <button onClick={() => setActiveTab('signoffs')}
              className="text-xs px-3 py-1.5 rounded-full font-bold animate-pulse"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}>
              {pendingSignoffs} awaiting sign-off
            </button>
          )}
          <div className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,215,255,0.6)' }}>
            {agentName}
          </div>
          <a href="/marketing-plan" target="_blank"
            className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
            style={{ background: 'rgba(201,165,76,0.1)', color: '#C9A54C', border: '1px solid rgba(201,165,76,0.3)' }}>
            View Plan ↗
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Task board + Sign-offs ── */}
        <aside className="w-96 flex flex-col border-r shrink-0 overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>

          {/* Tab switcher */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['tasks', 'signoffs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
                style={{
                  color: activeTab === tab ? '#C9A54C' : 'rgba(200,215,255,0.35)',
                  borderBottom: activeTab === tab ? '2px solid #C9A54C' : '2px solid transparent',
                  background: 'transparent',
                }}>
                {tab === 'tasks' ? 'Task Board' : `Sign-offs ${pendingSignoffs > 0 ? `(${pendingSignoffs})` : ''}`}
              </button>
            ))}
          </div>

          {activeTab === 'tasks' && (
            <>
              {/* Phase selector */}
              <div className="flex gap-1 p-3 shrink-0">
                {[1, 2, 3, 4].map(p => {
                  const done = completedByPhase(p)
                  const total = tasks.filter(t => t.phase === p).length
                  const c = PHASE_COLORS[p]
                  return (
                    <button key={p} onClick={() => setActivePhase(p)}
                      className="flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: activePhase === p ? c.bg : 'transparent',
                        border: `1px solid ${activePhase === p ? c.border : 'rgba(255,255,255,0.06)'}`,
                        color: activePhase === p ? c.accent : 'rgba(200,215,255,0.3)',
                      }}>
                      <div>P{p}</div>
                      <div className="font-normal opacity-70">{done}/{total}</div>
                    </button>
                  )
                })}
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                <p className="text-xs font-bold px-1 py-2" style={{ color: PHASE_COLORS[activePhase].accent }}>
                  {PHASE_LABELS[activePhase]}
                </p>
                {phaseTasks.map(task => {
                  const s = STATUS_LABEL[task.status]
                  const c = PHASE_COLORS[task.phase]
                  return (
                    <div key={task.id} className="rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs text-white leading-snug flex-1">{task.title}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-semibold whitespace-nowrap"
                          style={{ background: `${s.color}18`, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(200,215,255,0.35)' }}>→ {task.assignedTo}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setStatusModal(task); setPendingStatus(task.status) }}
                            className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,215,255,0.5)' }}>
                            Update
                          </button>
                          {task.status !== 'awaiting-signoff' && task.status !== 'approved' && task.status !== 'done' && (
                            <button
                              onClick={() => setSignoffModal(task)}
                              className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                              Sign-off
                            </button>
                          )}
                        </div>
                      </div>
                      {task.notes && (
                        <p className="text-xs mt-2 px-2 py-1.5 rounded-lg italic" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(200,215,255,0.4)' }}>
                          {task.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {activeTab === 'signoffs' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {signoffs.length === 0 ? (
                <div className="text-center py-12 text-xs" style={{ color: 'rgba(200,215,255,0.3)' }}>
                  No sign-off requests yet.<br />Use the Sign-off button on any task.
                </div>
              ) : signoffs.map(s => (
                <div key={s.id} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: s.status === 'pending' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-white leading-snug">{s.taskTitle}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-bold"
                      style={{
                        background: s.status === 'pending' ? 'rgba(245,158,11,0.15)' : s.status === 'approved' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                        color: s.status === 'pending' ? '#f59e0b' : s.status === 'approved' ? '#34d399' : '#f87171',
                      }}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'rgba(200,215,255,0.45)' }}>
                    Phase {s.phase} · Requested by {s.requestedBy} · {new Date(s.requestedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs italic mb-2" style={{ color: 'rgba(200,215,255,0.55)' }}>"{s.reason}"</p>
                  {s.adminComment && (
                    <p className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: '#C9A54C' }}>
                      Admin: {s.adminComment}
                    </p>
                  )}
                  {s.status === 'pending' && (
                    <p className="text-xs mt-2" style={{ color: 'rgba(200,215,255,0.35)' }}>
                      Awaiting approval in Admin panel
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── RIGHT: Chat ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Welcome banner — only if no messages */}
          {chat.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-lg text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
                  style={{ background: 'rgba(201,165,76,0.1)', border: '1px solid rgba(201,165,76,0.3)' }}>✦</div>
                <h2 className="text-2xl font-black text-white mb-3">Marketing AI</h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(200,215,255,0.5)' }}>
                  I know every detail of the Mercers Go-To-Market plan. Ask me what to do next, how to approach a task, or what sign-off you need before spending budget.
                </p>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {[
                    "What should we focus on this week?",
                    "How do we reach the Zimbabwe diaspora in the UK?",
                    "What needs sign-off before we run any ads?",
                    "Write me a WhatsApp broadcast message for a new listing",
                  ].map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      className="text-xs p-3 rounded-xl text-left transition-colors hover:opacity-80"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(200,215,255,0.6)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {chat.length > 0 && (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {chat.map((msg, i) => (
                <div key={msg.id === 'tmp' ? `tmp-${i}` : msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5"
                      style={{ background: 'rgba(201,165,76,0.15)', border: '1px solid rgba(201,165,76,0.3)' }}>✦</div>
                  )}
                  <div className="max-w-2xl">
                    <p className="text-xs mb-1.5 px-1"
                      style={{ color: 'rgba(200,215,255,0.35)' }}>
                      {msg.role === 'user' ? msg.agentName : 'Marketing AI'}
                    </p>
                    <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        background: msg.role === 'user' ? 'rgba(201,165,76,0.15)' : 'rgba(255,255,255,0.05)',
                        border: msg.role === 'user' ? '1px solid rgba(201,165,76,0.3)' : '1px solid rgba(255,255,255,0.07)',
                        color: msg.role === 'user' ? '#e8d5a3' : '#d4e0f7',
                      }}>
                      {msg.content}
                    </div>
                    <p className="text-xs mt-1 px-1" style={{ color: 'rgba(200,215,255,0.2)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: 'rgba(201,165,76,0.15)', border: '1px solid rgba(201,165,76,0.3)' }}>✦</div>
                  <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="animate-pulse" style={{ color: 'rgba(200,215,255,0.4)' }}>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex gap-3 items-end">
              <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Ask the Marketing AI anything about the plan…"
                  className="flex-1 text-sm resize-none outline-none bg-transparent"
                  style={{ color: '#d4e0f7', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-30 transition-opacity shrink-0"
                style={{ background: '#C9A54C' }}>
                ↑
              </button>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'rgba(200,215,255,0.2)' }}>
              Enter to send · Shift+Enter for new line · Budget actions require admin sign-off
            </p>
          </div>
        </main>
      </div>

      {/* ── Status update modal ── */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: '#0d1829', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h3 className="font-bold text-white mb-1 text-sm">Update Task Status</h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(200,215,255,0.45)' }}>{statusModal.title}</p>
            <select
              value={pendingStatus}
              onChange={e => setPendingStatus(e.target.value as TaskStatus)}
              className="w-full rounded-xl px-4 py-3 text-sm mb-4 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#d4e0f7' }}>
              {(Object.keys(STATUS_LABEL) as TaskStatus[]).map(s => (
                <option key={s} value={s} style={{ background: '#0d1829' }}>{STATUS_LABEL[s].label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setStatusModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,215,255,0.5)' }}>Cancel</button>
              <button onClick={updateStatus}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#1B3A6B' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign-off request modal ── */}
      {signoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: '#0d1829', border: '1px solid rgba(245,158,11,0.3)' }}>
            <h3 className="font-bold text-white mb-1 text-sm">Request Admin Sign-off</h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(200,215,255,0.45)' }}>{signoffModal.title}</p>
            <textarea
              rows={3}
              value={signoffReason}
              onChange={e => setSignoffReason(e.target.value)}
              placeholder="Why does this need sign-off? What are you planning to do?"
              className="w-full rounded-xl px-4 py-3 text-sm mb-4 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#d4e0f7' }}
            />
            <div className="flex gap-2">
              <button onClick={() => { setSignoffModal(null); setSignoffReason('') }}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,215,255,0.5)' }}>Cancel</button>
              <button onClick={requestSignoff} disabled={!signoffReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#C9A54C' }}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
