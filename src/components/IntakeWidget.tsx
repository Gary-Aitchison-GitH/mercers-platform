'use client'

import { useState } from 'react'
import { ArrowRight, Phone, Mail, MapPin, Sparkles, ChevronRight, RotateCcw } from 'lucide-react'
import { AgentMatch } from '@/lib/matching'
import { Agent } from '@/lib/data/agents'

type Step = 'intent' | 'type' | 'area' | 'result'

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Industrial', 'Agricultural']
const AREAS = ['Harare', 'Marondera', 'Bulawayo', 'Victoria Falls', 'Bindura', 'Zvishavane', 'Chiredzi', 'Other']

interface ResultData {
  primaryMatch: AgentMatch & { agent: Agent }
  alternatives: (AgentMatch & { agent: Agent })[]
  summary: string
}

export default function IntakeWidget() {
  const [step, setStep] = useState<Step>('intent')
  const [intent, setIntent] = useState<'buy' | 'rent' | 'sell' | null>(null)
  const [propertyType, setPropertyType] = useState('')
  const [area, setArea] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResultData | null>(null)
  const [error, setError] = useState('')

  const reset = () => {
    setStep('intent')
    setIntent(null)
    setPropertyType('')
    setArea('')
    setBudget('')
    setResult(null)
    setError('')
  }

  const runMatch = async () => {
    if (!intent || !propertyType || !area) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, propertyType: propertyType.toLowerCase(), area, budget }),
      })
      if (!res.ok) throw new Error('Match failed')
      const data = await res.json()
      setResult(data)
      setStep('result')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="mercers-gradient px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,165,76,0.3)' }}>
          <Sparkles size={18} style={{ color: '#C9A54C' }} />
        </div>
        <div>
          <p className="font-bold text-white text-sm">Find Your Agent</p>
          <p className="text-xs text-blue-200">AI-matched to your exact needs</p>
        </div>
        {step !== 'intent' && step !== 'result' && (
          <button onClick={reset} className="ml-auto text-blue-300 hover:text-white transition-colors">
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      <div className="p-6">

        {/* Step: Intent */}
        {step === 'intent' && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">What are you looking to do?</p>
            <div className="grid grid-cols-3 gap-3">
              {(['buy', 'rent', 'sell'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => { setIntent(opt); setStep('type') }}
                  className="py-3 rounded-xl text-sm font-semibold border-2 transition-all capitalize hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
                  style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                  {opt === 'buy' ? '🏠 Buy' : opt === 'rent' ? '🔑 Rent' : '📋 Sell'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Property Type */}
        {step === 'type' && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">What type of property?</p>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => { setPropertyType(type); setStep('area') }}
                  className="py-2.5 px-4 rounded-xl text-sm font-medium border-2 text-left transition-all hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
                  style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Area + Budget */}
        {step === 'area' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Which area?</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {AREAS.map(a => (
                  <button
                    key={a}
                    onClick={() => setArea(a)}
                    className="py-2 px-3 rounded-lg text-sm font-medium border-2 text-left transition-all"
                    style={{
                      borderColor: area === a ? '#1B3A6B' : '#e5e7eb',
                      color: area === a ? '#1B3A6B' : '#6b7280',
                      background: area === a ? '#eef4fd' : 'white',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Budget (optional)</label>
              <input
                type="text"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. USD 500,000 or USD 2,000/pm"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1B3A6B] transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={runMatch}
              disabled={!area || loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#1B3A6B' }}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Matching you now...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Find My Agent
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">{result.summary}</p>

            {/* Primary match */}
            <div className="rounded-xl p-4 border-2" style={{ borderColor: '#1B3A6B', background: '#f8faff' }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full mercers-gradient flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">
                    {result.primaryMatch.agent.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: '#1B3A6B' }}>{result.primaryMatch.agent.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: '#C9A54C' }}>
                      Best Match
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: '#C9A54C' }}>{result.primaryMatch.agent.role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{result.primaryMatch.reasoning}</p>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href={`tel:${result.primaryMatch.agent.phone}`}
                      className="flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 transition-opacity hover:opacity-80 text-white"
                      style={{ background: '#1B3A6B' }}
                    >
                      <Phone size={12} /> {result.primaryMatch.agent.phone}
                    </a>
                    <a
                      href={`mailto:${result.primaryMatch.agent.email}`}
                      className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 border transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                    >
                      <Mail size={12} /> {result.primaryMatch.agent.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Matched listings */}
            {result.primaryMatch.matchedListings?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Relevant Listings</p>
                <div className="space-y-1.5">
                  {result.primaryMatch.matchedListings.slice(0, 2).map((l) => (
                    <div key={l.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <MapPin size={11} style={{ color: '#C9A54C' }} />
                      <span className="flex-1 truncate">{l.title}</span>
                      <span className="font-semibold shrink-0" style={{ color: '#1B3A6B' }}>{l.priceDisplay}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {result.alternatives?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Also available</p>
                <div className="space-y-2">
                  {result.alternatives.map((alt) => (
                    <a
                      key={alt.agent.id}
                      href={`mailto:${alt.agent.email}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl border hover:border-[#1B3A6B] transition-colors"
                      style={{ borderColor: '#f0f0f0' }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#eef4fd' }}>
                        <span className="text-xs font-bold" style={{ color: '#1B3A6B' }}>
                          {alt.agent.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{alt.agent.name}</p>
                        <p className="text-xs text-gray-400 truncate">{alt.reasoning}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> Start again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
