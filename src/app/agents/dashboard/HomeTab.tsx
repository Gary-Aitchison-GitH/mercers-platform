'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bot, Send, Plus, Check, X, Loader2, MessageSquare,
  Building2, Users, Eye, Bell, Sparkles, Megaphone,
  BarChart3, FileSearch, Wrench,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMsg = { role: 'user' | 'assistant'; content: string }
type Todo = { id: string; text: string; done: boolean }
type RecentConvo = { id: string; clientName: string; lastMessage: string; lastAt: string; unread: number }
type Pipeline = { activeListings: number; totalClients: number; viewingStage: number; newInquiries: number }

const STARTER_PROMPTS = [
  "What's my morning brief?",
  "Which clients need follow-up?",
  "Draft a viewing confirmation email",
  "Suggest 5 tasks for today",
]

const PALETTE = [
  { name: 'Home', icon: Bot, href: null, active: true, desc: 'Daily brief & pipeline' },
  { name: 'Marketing', icon: Megaphone, href: '/agents/marketing-ai', active: false, desc: 'Go-to-market tasks' },
  { name: 'Dev Assist', icon: Wrench, href: '/agents/dev-assist', active: false, desc: 'Request features & report bugs' },
  { name: 'Client Match', icon: Users, href: null, active: false, desc: 'Match buyers to listings', soon: true },
  { name: 'Listing Copy', icon: FileSearch, href: null, active: false, desc: 'Write property descriptions', soon: true },
  { name: 'Analytics', icon: BarChart3, href: null, active: false, desc: 'Market insights', soon: true },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeTab({ getToken, displayName }: { getToken: () => Promise<string>; displayName: string }) {
  const [pipeline, setPipeline] = useState<Pipeline>({ activeListings: 0, totalClients: 0, viewingStage: 0, newInquiries: 0 })
  const [conversations, setConversations] = useState<RecentConvo[]>([])
  const [newRequests, setNewRequests] = useState(0)
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Persist todos in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mercers-agent-todos')
      if (stored) setTodos(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('mercers-agent-todos', JSON.stringify(todos))
    } catch { /* ignore */ }
  }, [todos])

  useEffect(() => { loadContext() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadContext() {
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/home-context', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      if (data.pipeline) setPipeline(data.pipeline)
      if (data.conversations) setConversations(data.conversations)
      if (typeof data.newRequests === 'number') setNewRequests(data.newRequests)
    } catch { /* non-fatal */ }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return

    const userMsg: ChatMsg = { role: 'user', content: text.trim() }
    const outgoing = [...messages, userMsg]
    setMessages(outgoing)
    setInput('')
    setStreaming(true)

    try {
      const token = await getToken()
      const res = await fetch('/api/portal/home-ai', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }),
      })

      if (!res.ok || !res.body) return

      setMessages(m => [...m, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snap = accumulated
        setMessages(m => {
          const next = [...m]
          next[next.length - 1] = { role: 'assistant', content: snap }
          return next
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  function addTodo() {
    if (!newTodo.trim()) return
    setTodos(t => [...t, { id: `${Date.now()}`, text: newTodo.trim(), done: false }])
    setNewTodo('')
  }

  function toggleTodo(id: string) {
    setTodos(t => t.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }

  function removeTodo(id: string) {
    setTodos(t => t.filter(item => item.id !== id))
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const firstName = displayName.split(' ')[0] || 'Agent'

  return (
    <div className="space-y-5">

      {/* ── Pipeline stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Listings', value: pipeline.activeListings, Icon: Building2, accent: '#60a5fa' },
          { label: 'Total Clients', value: pipeline.totalClients, Icon: Users, accent: '#C9A54C' },
          { label: 'At Viewing Stage', value: pipeline.viewingStage, Icon: Eye, accent: '#34d399' },
          { label: 'New Inquiries (7d)', value: pipeline.newInquiries, Icon: Bell, accent: '#f97316' },
        ].map(({ label, value, Icon, accent }) => (
          <div
            key={label}
            className="rounded-xl p-4 border"
            style={{ background: '#1B3A6B', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} style={{ color: accent }} />
              <span className="text-xs" style={{ color: '#93c5fd' }}>{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Main area: AI chat + sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* AI Chat — 2/3 */}
        <div
          className="lg:col-span-2 rounded-2xl border flex flex-col"
          style={{ background: '#122347', borderColor: 'rgba(255,255,255,0.08)', height: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,165,76,0.15)' }}>
              <Sparkles size={16} style={{ color: '#C9A54C' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Mercers AI</p>
              <p className="text-xs" style={{ color: '#93c5fd' }}>Your property intelligence assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(201,165,76,0.12)' }}>
                  <Bot size={24} style={{ color: '#C9A54C' }} />
                </div>
                <p className="text-white font-semibold mb-1">Good morning, {firstName}</p>
                <p className="text-sm mb-6" style={{ color: '#93c5fd' }}>Ask me anything about your pipeline, or pick a quick start:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
                  {STARTER_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs rounded-lg px-3 py-2 transition-colors"
                      style={{ color: '#bfdbfe', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? { background: '#C9A54C', color: '#0d1f3c', fontWeight: 500 }
                        : { background: 'rgba(255,255,255,0.08)', color: '#e0e7ff' }
                    }
                  >
                    {msg.content === '' && msg.role === 'assistant'
                      ? <Loader2 size={14} className="animate-spin" style={{ color: '#93c5fd' }} />
                      : <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    }
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Ask about your pipeline, draft an email, plan your day…"
                disabled={streaming}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={streaming || !input.trim()}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-opacity shrink-0"
                style={{ background: '#C9A54C', opacity: streaming || !input.trim() ? 0.4 : 1 }}
              >
                {streaming
                  ? <Loader2 size={16} className="animate-spin" style={{ color: '#0d1f3c' }} />
                  : <Send size={16} style={{ color: '#0d1f3c' }} />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="flex flex-col gap-4">

          {/* Today's Plan */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: '#1B3A6B', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Today&apos;s Plan</h3>
              <button
                onClick={() => sendMessage('Suggest 5–7 specific tasks for today based on my pipeline')}
                disabled={streaming}
                className="flex items-center gap-1 text-xs transition-opacity"
                style={{ color: '#C9A54C', opacity: streaming ? 0.5 : 1 }}
              >
                <Sparkles size={11} />
                AI suggest
              </button>
            </div>

            <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
              {todos.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: '#60a5fa' }}>
                  No tasks yet — add one or ask AI.
                </p>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggleTodo(todo.id)} className="shrink-0">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center transition-colors"
                        style={{
                          background: todo.done ? '#C9A54C' : 'transparent',
                          border: `1px solid ${todo.done ? '#C9A54C' : 'rgba(255,255,255,0.25)'}`,
                        }}
                      >
                        {todo.done && <Check size={10} style={{ color: '#0d1f3c' }} />}
                      </div>
                    </button>
                    <span
                      className="flex-1 text-xs leading-snug"
                      style={{
                        color: todo.done ? 'rgba(148,163,184,0.6)' : '#e0e7ff',
                        textDecoration: todo.done ? 'line-through' : 'none',
                      }}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => removeTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#f87171' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
                placeholder="Add a task…"
                className="flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <button
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity"
                style={{ background: 'rgba(255,255,255,0.1)', opacity: newTodo.trim() ? 1 : 0.4 }}
              >
                <Plus size={13} style={{ color: '#C9A54C' }} />
              </button>
            </div>
          </div>

          {/* Recent Inquiries */}
          <div
            className="rounded-2xl border p-4 flex-1"
            style={{ background: '#1B3A6B', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">Recent Inquiries</h3>
            {conversations.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#60a5fa' }}>
                No recent conversations.
              </p>
            ) : (
              <div className="space-y-1.5">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-start gap-3 p-2 rounded-lg transition-colors cursor-default"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(96,165,250,0.15)' }}
                    >
                      <MessageSquare size={12} style={{ color: '#93c5fd' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-medium text-white truncate">{conv.clientName}</p>
                        {conv.unread > 0 && (
                          <span
                            className="text-xs rounded-full px-1.5 font-bold shrink-0"
                            style={{ background: '#C9A54C', color: '#0d1f3c' }}
                          >
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: '#93c5fd' }}>{conv.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Agent Palette ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
          AI Agent Palette
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PALETTE.map(({ name, icon: Icon, href, active, desc, soon }) => {
            const isDevAssist = name === 'Dev Assist'
            const showBadge = isDevAssist && newRequests > 0
            const card = (
              <div
                className="relative rounded-xl p-3 border transition-all"
                style={{
                  background: active ? 'rgba(201,165,76,0.08)' : 'rgba(27,58,107,0.4)',
                  borderColor: active ? 'rgba(201,165,76,0.3)' : showBadge ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)',
                  boxShadow: active ? '0 0 0 1px rgba(201,165,76,0.15)' : showBadge ? '0 0 0 1px rgba(248,113,113,0.15)' : 'none',
                  opacity: soon ? 0.55 : 1,
                  cursor: soon ? 'not-allowed' : href ? 'pointer' : 'default',
                }}
              >
                {soon && (
                  <span
                    className="absolute top-2 right-2 text-[10px] rounded-full px-1.5 py-0.5"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#93c5fd' }}
                  >
                    Soon
                  </span>
                )}
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: '#f87171', color: 'white' }}
                  >
                    {newRequests}
                  </span>
                )}
                <Icon size={18} style={{ color: active ? '#C9A54C' : showBadge ? '#fca5a5' : '#93c5fd' }} />
                <p className="text-xs font-semibold mt-2" style={{ color: active ? '#C9A54C' : 'white' }}>{name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            )
            return href
              ? <Link key={name} href={href}>{card}</Link>
              : <div key={name}>{card}</div>
          })}
        </div>
      </div>
    </div>
  )
}
