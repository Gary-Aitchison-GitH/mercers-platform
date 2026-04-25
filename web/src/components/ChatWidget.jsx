import { useState, useEffect, useRef } from 'react'
import { Mountain, X, Send, MessageSquare } from 'lucide-react'
import { useLanguage } from './LanguageContext'
import { api } from '../services/api'

function getSessionId() {
  let id = sessionStorage.getItem('mercers_session')
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
    sessionStorage.setItem('mercers_session', id)
  }
  return id
}

export default function ChatWidget() {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [garyOnline, setGaryOnline] = useState(false)
  const [welcomed, setWelcomed] = useState(false)
  const sessionId = useRef(getSessionId())
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  // Welcome message on first open
  useEffect(() => {
    if (open && !welcomed) {
      setMessages([{ role: 'assistant', content: t.chat.welcome, isGary: false }])
      setWelcomed(true)
    }
  }, [open, welcomed, t.chat.welcome])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for session updates every 2s while open
  useEffect(() => {
    if (!open) {
      clearInterval(pollRef.current)
      return
    }
    const poll = async () => {
      try {
        const data = await api.get(`/api/chat/session?sessionId=${sessionId.current}`)
        if (data.messages) {
          // Replace messages with server state (includes Gary replies)
          const mapped = data.messages.map(m => ({
            role: m.role,
            content: m.content,
            isGary: m.isGary || false,
          }))
          if (mapped.length > 0) setMessages(mapped)
        }
        setGaryOnline(data.garyOnline || false)
      } catch {
        // silently fail polling
      }
    }
    pollRef.current = setInterval(poll, 2000)
    return () => clearInterval(pollRef.current)
  }, [open])

  const send = async () => {
    const content = input.trim()
    if (!content || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content }])
    setLoading(true)
    try {
      const res = await api.sendMessage(sessionId.current, content, locale)
      setGaryOnline(res.garyOnline || false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.message,
        isGary: res.isGary || false,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.',
        isGary: false,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%)' }}
        aria-label="Open chat"
      >
        {open
          ? <X size={22} color="white" />
          : <MessageSquare size={22} color="white" />
        }
        {/* Gold AI badge */}
        {!open && (
          <span
            className="absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: '#C9A54C' }}
          >
            AI
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ height: '480px', border: '1px solid rgba(27,58,107,0.2)' }}
        >
          {/* Header */}
          <div className="mercers-gradient px-4 py-3 flex items-center gap-3 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <Mountain size={18} color="#C9A54C" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{t.chat.title}</p>
              <p className="text-xs text-blue-200 truncate">
                {garyOnline ? 'Property manager is live' : t.chat.subtitle}
              </p>
            </div>
            {/* Online dot */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-300">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-surface px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && msg.isGary && (
                  <span className="text-[10px] font-semibold text-navy-800 mb-1 ml-1">Gary · Mercers</span>
                )}
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
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
            {loading && (
              <div className="flex items-start">
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm"
                  style={{ background: '#1B3A6B', color: 'white', borderBottomLeftRadius: '4px' }}
                >
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-3 py-2.5 flex items-end gap-2 shrink-0">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.chat.placeholder}
              className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-navy-800 transition-colors leading-snug"
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
              style={{ background: '#1B3A6B' }}
            >
              <Send size={15} color="white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
