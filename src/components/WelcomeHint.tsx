'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

interface Props {
  id: string        // unique key stored in localStorage
  title: string
  children: React.ReactNode
}

export default function WelcomeHint({ id, title, children }: Props) {
  const storageKey = `mercers_hint_dismissed_${id}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setVisible(true)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-5 rounded-xl border border-[#C9A54C]/40 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C9A54C' }}>
        <Sparkles size={13} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-0.5">{title}</p>
        <div className="text-xs text-amber-800 leading-relaxed space-y-0.5">{children}</div>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 text-amber-400 hover:text-amber-700 rounded transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
