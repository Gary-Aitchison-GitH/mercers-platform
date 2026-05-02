'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Send, CheckCircle, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import AgentCard from '@/components/AgentCard'
import { useLanguage } from '@/components/LanguageContext'
import { agents } from '@/lib/data/agents'

export default function ContactPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setSending(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <section className="mercers-gradient py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-3">{t.contact.title}</h1>
          <p className="text-blue-200">{t.contact.address}</p>
        </div>
      </section>

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#F9F8F5' }}>
        <div className="max-w-5xl mx-auto space-y-16">

          {/* Head Office + Form */}
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#1B3A6B' }}>{t.agents.headOffice}</h2>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: '#C9A54C' }} />
                      19 Kay Gardens, Kensington, Harare, Zimbabwe
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} style={{ color: '#C9A54C' }} />
                      <a href="tel:+2634000000" className="hover:text-[#1B3A6B] transition-colors">+263 4 000 0000</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} style={{ color: '#C9A54C' }} />
                      <a href="mailto:info@mercers.co.zw" className="hover:text-[#1B3A6B] transition-colors">info@mercers.co.zw</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eef4fd' }}>
                    <Users size={16} style={{ color: '#1B3A6B' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#1B3A6B' }}>{t.agents.nationwide}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{t.agents.collaborationBody}</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {sent ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <CheckCircle size={48} style={{ color: '#1B3A6B' }} className="mb-4" />
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#1B3A6B' }}>Message Sent!</h3>
                  <p className="text-gray-500 text-sm">One of our agents will be in touch shortly.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
                    className="mt-6 text-sm font-semibold"
                    style={{ color: '#C9A54C' }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-6" style={{ color: '#1B3A6B' }}>General Enquiry</h2>
                  {[
                    { key: 'name', label: t.contact.name, type: 'text' },
                    { key: 'email', label: t.contact.email, type: 'email' },
                    { key: 'phone', label: t.contact.phone, type: 'tel' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        required={field.key !== 'phone'}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B3A6B] transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.contact.message}</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B3A6B] transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#1B3A6B' }}
                  >
                    <Send size={15} />
                    {sending ? 'Sending...' : t.contact.send}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact an agent directly */}
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B3A6B' }}>Contact an Agent Directly</h2>
            <p className="text-gray-500 text-sm mb-8">Prefer to speak to someone specific? Reach out directly — every agent handles any property type and can refer you to the ideal colleague if needed.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
