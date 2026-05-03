'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2, Send } from 'lucide-react'

type AgentSummary = {
  id: string
  name: string
  role: string
  image: string | null
}

type Props = {
  agent: AgentSummary
  onClose: () => void
}

export default function ContactAgentModal({ agent, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const initials = agent.name.split(' ').map(n => n[0]).slice(0, 2).join('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, name, email, phone, message }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Something went wrong')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center mercers-gradient">
            {agent.image
              ? <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />  // eslint-disable-line @next/next/no-img-element
              : <span className="text-sm font-bold text-white">{initials}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900">Contact {agent.name}</h2>
            <p className="text-xs text-gray-500">{agent.role}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <CheckCircle size={44} className="text-green-500" />
              <h3 className="font-bold text-gray-900 text-lg">Message Sent</h3>
              <p className="text-sm text-gray-500">{agent.name} will be in touch with you shortly.</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1B3A6B' }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+263 77 000 0000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder={`Hi ${agent.name.split(' ')[0]}, I'd like to enquire about…`}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1B3A6B' }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? 'Sending…' : `Send to ${agent.name.split(' ')[0]}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
