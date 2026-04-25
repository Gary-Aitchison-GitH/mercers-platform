import { useState } from 'react'
import { MapPin, Phone, Mail, CheckCircle, Send } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import { useLanguage } from '../components/LanguageContext'

const OFFICES = [
  {
    name: 'Harare — Head Office',
    address: '19 Kay Gardens, Kensington, Harare, Zimbabwe',
    phone: '+263 4 000 0000',
    email: 'harare@mercers.co.zw',
  },
  {
    name: 'Marondera — New Branch',
    address: 'Marondera, Mashonaland East, Zimbabwe',
    phone: '+263 79 000 0000',
    email: 'marondera@mercers.co.zw',
    isNew: true,
  },
]

export default function Contact() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSending(true)
    // Simulate submission — replace with real API call
    await new Promise(r => setTimeout(r, 800))
    setSending(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {/* ── Header ── */}
      <section className="mercers-gradient py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-400 mb-2">Reach Us</p>
          <h1 className="text-4xl font-bold text-white mb-3">{t.contact.title}</h1>
          <p className="text-blue-200 text-lg">We'd love to hear from you.</p>
        </div>
      </section>

      <main className="flex-1 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Office cards ── */}
          <div className="space-y-5">
            {OFFICES.map(office => (
              <div
                key={office.name}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-navy-800 text-lg">{office.name}</h3>
                  {office.isNew && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0 ml-2"
                      style={{ background: '#C9A54C' }}
                    >
                      New
                    </span>
                  )}
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin size={15} className="text-gold-500 mt-0.5 shrink-0" />
                    <span>{office.address}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={15} className="text-gold-500 shrink-0" />
                    <a href={`tel:${office.phone}`} className="hover:text-navy-800 transition-colors">
                      {office.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={15} className="text-gold-500 shrink-0" />
                    <a href={`mailto:${office.email}`} className="hover:text-navy-800 transition-colors">
                      {office.email}
                    </a>
                  </li>
                </ul>
              </div>
            ))}
          </div>

          {/* ── Contact form ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: '#eef4fd' }}
                >
                  <CheckCircle size={32} className="text-navy-800" />
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  Thank you for reaching out. One of our agents will be in touch with you shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
                  className="mt-6 text-sm font-semibold text-gold-500 hover:text-gold-600 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-navy-800 text-lg mb-6">Send Us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.contact.name}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-navy-800 transition-colors"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.contact.email}</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-navy-800 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.contact.phone}</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-navy-800 transition-colors"
                      placeholder="+263 7 000 0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t.contact.message}</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-navy-800 transition-colors resize-none"
                      placeholder="I'm interested in..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%)' }}
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </span>
                    ) : (
                      <>
                        <Send size={15} />
                        {t.contact.send}
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
