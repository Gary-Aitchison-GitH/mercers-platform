import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AgentCard from '../components/AgentCard'
import ChatWidget from '../components/ChatWidget'
import { useLanguage } from '../components/LanguageContext'
import { agents } from '../services/data'

export default function Agents() {
  const { t } = useLanguage()
  const harareAgents   = agents.filter(a => a.branch === 'harare')
  const maronderaAgents = agents.filter(a => a.branch === 'marondera')

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {/* ── Header ── */}
      <section className="mercers-gradient py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-400 mb-2">The Team</p>
          <h1 className="text-4xl font-bold text-white mb-3">{t.agents.title}</h1>
          <p className="text-blue-200 text-lg">{t.agents.subtitle}</p>
        </div>
      </section>

      <main className="flex-1 py-14 px-4">
        <div className="max-w-7xl mx-auto space-y-14">

          {/* ── Harare Office ── */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-1 h-10 rounded-full"
                style={{ background: '#1B3A6B' }}
              />
              <div>
                <h2 className="text-2xl font-bold text-navy-800">{t.agents.harare}</h2>
                <p className="text-sm text-gray-500 mt-0.5">19 Kay Gardens, Kensington, Harare</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {harareAgents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
          </div>

          {/* ── Marondera Office ── */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-1 h-10 rounded-full"
                style={{ background: '#C9A54C' }}
              />
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-navy-800">{t.agents.marondera}</h2>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: '#C9A54C' }}
                    >
                      New Branch
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Marondera, Mashonaland East</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {maronderaAgents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
          </div>

        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
