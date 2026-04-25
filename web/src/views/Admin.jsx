import { useState, useEffect, useRef } from 'react'
import { Mountain, Lock, Users, MessageSquare, Send, LogIn, LogOut } from 'lucide-react'
import { api } from '../services/api'

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'mercers2026'

function LoginScreen({ onAuth }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    if (pass === ADMIN_PASS) {
      onAuth()
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0d1f3c 0%, #1B3A6B 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#1B3A6B' }}>
            <Mountain size={26} color="#C9A54C" />
          </div>
          <h1 className="text-xl font-bold text-navy-800">Mercers Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Gary's control panel</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && attempt()}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-navy-800 transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">Incorrect password.</p>}
          </div>
          <button
            onClick={attempt}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1B3A6B' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

function LocaleBadge({ locale }) {
  const colors = { en: '#1B3A6B', sn: '#C9A54C', nd: '#2a5aa8' }
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
      style={{ background: colors[locale] || '#6b7280' }}
    >
      {locale?.toUpperCase()}
    </span>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [garyActive, setGaryActive] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const pollRef = useRef(null)
  const bottomRef = useRef(null)

  // Poll conversations
  useEffect(() => {
    if (!authed) return
    const poll = async () => {
      try {
        const data = await api.getConversations()
        setConversations(data.conversations || [])
      } catch { /* silent */ }
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => clearInterval(pollRef.current)
  }, [authed])

  // Scroll messages to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId, conversations])

  const selected = conversations.find(c => c.sessionId === selectedId)

  const handleJoinLeave = async () => {
    if (!selectedId) return
    try {
      if (garyActive) {
        await api.leaveConversation(selectedId)
        setGaryActive(false)
      } else {
        await api.joinConversation(selectedId)
        setGaryActive(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleReply = async () => {
    const content = reply.trim()
    if (!content || !selectedId || sending) return
    setSending(true)
    setReply('')
    try {
      await api.sendAdminReply(selectedId, content)
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col" style={{ background: '#0d1f3c' }}>
        {/* Header */}
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,165,76,0.2)' }}>
            <Mountain size={18} color="#C9A54C" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Mercers Admin</p>
            <p className="text-xs text-blue-300">Live Dashboard</p>
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-2">
            <Users size={10} className="inline mr-1.5" />
            Conversations ({conversations.length})
          </p>
          {conversations.length === 0 ? (
            <p className="px-4 text-xs text-blue-400 mt-4">No conversations yet.</p>
          ) : (
            conversations.map(conv => {
              const preview = conv.messages?.[conv.messages.length - 1]?.content || ''
              const unread = conv.unreadCount || 0
              const isSelected = conv.sessionId === selectedId
              return (
                <button
                  key={conv.sessionId}
                  onClick={() => setSelectedId(conv.sessionId)}
                  className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5 border-b border-white/5"
                  style={isSelected ? { background: 'rgba(201,165,76,0.15)' } : {}}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-white">
                      {conv.sessionId.slice(0, 8)}…
                    </span>
                    <div className="flex items-center gap-1.5">
                      <LocaleBadge locale={conv.locale} />
                      {unread > 0 && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-navy-950 min-w-[18px] text-center"
                          style={{ background: '#C9A54C' }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-blue-300 truncate max-w-[210px]">
                    {preview || 'No messages yet'}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Main panel ── */}
      <main className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 font-medium">Select a conversation</p>
              <p className="text-sm text-gray-300 mt-1">Click a session from the sidebar to view</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conv header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-bold text-navy-800 text-sm font-mono">{selected.sessionId}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <LocaleBadge locale={selected.locale} />
                  <span className="text-xs text-gray-400">{selected.messages?.length || 0} messages</span>
                </div>
              </div>
              <button
                onClick={handleJoinLeave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: garyActive ? '#C9A54C' : '#1B3A6B' }}
              >
                {garyActive ? (
                  <><LogOut size={14} /> Leave Convo</>
                ) : (
                  <><LogIn size={14} /> Join as Gary</>
                )}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {(selected.messages || []).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role !== 'user' && msg.isGary && (
                    <span className="text-[10px] font-bold text-navy-800 mb-1 ml-1">Gary · Mercers</span>
                  )}
                  <div
                    className="max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? { background: '#C9A54C', color: 'white', borderBottomRightRadius: '4px' }
                        : { background: '#1B3A6B', color: 'white', borderBottomLeftRadius: '4px' }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Gary reply input — shown only when active */}
            {garyActive && (
              <div className="bg-white border-t border-gray-100 px-6 py-4 flex items-end gap-3">
                <div className="flex-1 flex flex-col">
                  <p className="text-[10px] font-bold text-gold-500 mb-1.5">Replying as Gary · Mercers</p>
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleReply()
                      }
                    }}
                    placeholder="Type your reply..."
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-navy-800 transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleReply}
                  disabled={!reply.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                  style={{ background: '#1B3A6B' }}
                >
                  <Send size={15} color="white" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
