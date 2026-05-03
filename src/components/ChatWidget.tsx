'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Mountain, User } from 'lucide-react'
import { useLanguage } from './LanguageContext'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'gary'
  content: string
  timestamp: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = sessionStorage.getItem('mercers-session')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('mercers-session', id)
  }
  return id
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [garyOnline, setGaryOnline] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionId = useRef(getSessionId())
  const { t, locale } = useLanguage()

  // Welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t.chat.welcome,
        timestamp: new Date().toISOString(),
      }])
    }
  }, [open, t.chat.welcome, messages.length])

  // Poll for Gary responses
  useEffect(() => {
    if (!open) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages?sessionId=${sessionId.current}`)
        const data = await res.json()
        const convo = data.conversation
        if (!convo) return

        setGaryOnline(convo.status === 'gary-joined')

        // Sync messages from server
        if (convo.messages.length > 0) {
          setMessages(prev => {
            const serverIds = new Set(convo.messages.map((m: Message) => m.id))
            const localWelcome = prev.filter(m => m.id === 'welcome')
            const merged = [
              ...localWelcome,
              ...convo.messages.filter((m: Message) => !localWelcome.some(lw => lw.id === m.id)),
            ]
            return merged
          })
        }
      } catch { /* silent */ }
    }, 2000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    if (!input.trim() || loading) return
    const userContent = input.trim()
    setInput('')
    setLoading(true)

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          role: 'user',
          content: userContent,
          locale,
        }),
      })
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40 transition-all hover:scale-110 ${open ? 'hidden' : 'flex'}`}
        style={{ background: '#1B3A6B' }}
        aria-label="Open chat"
      >
        <MessageCircle size={24} color="white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#C9A54C' }}>
          AI
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 text-white mercers-gradient">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              {garyOnline ? <User size={18} color="white" /> : <Mountain size={18} color="white" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {garyOnline ? 'Gary — Mercers' : t.chat.title}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-xs opacity-75">
                  {garyOnline ? t.chat.garyOnline : t.chat.subtitle}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-75 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3" style={{ minHeight: 0, maxHeight: '50vh' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'chat-bubble-user'
                      : msg.role === 'gary'
                      ? 'rounded-2xl'
                      : 'chat-bubble-agent'
                  }`}
                  style={msg.role === 'gary' ? { background: '#1B3A6B', color: 'white', borderRadius: '1rem 1rem 1rem 0.25rem' } : {}}
                >
                  {msg.role === 'gary' && (
                    <p className="text-xs font-semibold mb-1" style={{ color: '#C9A54C' }}>Gary · Mercers</p>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="chat-bubble-agent px-4 py-2.5 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-sm text-white/75">...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={t.chat.placeholder}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#1B3A6B] transition-colors"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              style={{ background: '#1B3A6B' }}
              aria-label={t.chat.send}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
