'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Upload, X, Loader2, Sparkles, Check } from 'lucide-react'

type AgentProfile = {
  id: string
  name: string
  role: string
  bio: string
  phone: string
  email: string
  specialties: string[]
  regionalPresence: string[]
  image: string | null
}

type ProfileForm = {
  role: string
  bio: string
  phone: string
  specialties: string[]
  regionalPresence: string[]
  image: string | null
}

type Props = {
  getToken: () => Promise<string>
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('')

  function add(value: string) {
    const v = value.trim().replace(/,$/, '')
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    else if (e.key === 'Backspace' && !input && tags.length > 0) onChange(tags.slice(0, -1))
  }

  return (
    <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-lg px-3 py-2 min-h-[42px] focus-within:ring-2 focus-within:ring-[#1B3A6B]/20 cursor-text">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#eef4fd', color: '#1B3A6B' }}>
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (input.trim()) add(input) }}
        placeholder={tags.length === 0 ? placeholder : '+ add'}
        className="text-sm outline-none flex-1 min-w-[100px] bg-transparent placeholder-gray-400"
      />
    </div>
  )
}

// ─── Resize helper ────────────────────────────────────────────────────────────

async function resizeImage(file: File, maxPx = 400): Promise<File> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (img.width <= maxPx && img.height <= maxPx) { resolve(file); return }
      const scale = Math.min(maxPx / img.width, maxPx / img.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        resolve(new File([blob!], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.9)
    }
    img.src = url
  })
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

export function ProfileTab({ getToken }: Props) {
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [form, setForm] = useState<ProfileForm>({ role: '', bio: '', phone: '', specialties: [], regionalPresence: [], image: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [improvingBio, setImprovingBio] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    getToken().then(token =>
      fetch('/api/portal/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (cancelled || !d.agent) return
          setProfile(d.agent)
          setForm({
            role: d.agent.role === 'dev' ? '' : (d.agent.role ?? ''),
            bio: d.agent.bio ?? '',
            phone: d.agent.phone ?? '',
            specialties: d.agent.specialties ?? [],
            regionalPresence: d.agent.regionalPresence ?? [],
            image: d.agent.image ?? null,
          })
        })
    ).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [getToken])

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true)
    try {
      const token = await getToken()
      const resized = await resizeImage(file, 400)
      const fd = new FormData()
      fd.append('file', resized)
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json()
      if (data.url) setForm(f => ({ ...f, image: data.url }))
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleImproveBio() {
    if (!form.bio.trim()) return
    setImprovingBio(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/portal/improve-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: form.bio, name: profile?.name, role: form.role }),
      })
      const data = await res.json()
      if (data.improved) setForm(f => ({ ...f, bio: data.improved }))
    } finally {
      setImprovingBio(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const token = await getToken()
      await fetch('/api/portal/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  if (!profile) {
    return <div className="text-center py-12 text-gray-500">Profile not found.</div>
  }

  const initials = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('')

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Identity ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Profile</h3>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center mercers-gradient">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-opacity hover:opacity-90"
              style={{ background: '#1B3A6B' }}
              title="Upload photo"
            >
              {uploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Full name</p>
              <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm text-gray-600 truncate">{profile.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Job title</label>
            <input
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Senior Sales Agent"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+263 77 000 0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            />
          </div>
        </div>
      </div>

      {/* ── Bio ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bio</h3>
          <button
            type="button"
            onClick={handleImproveBio}
            disabled={improvingBio || !form.bio.trim()}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: '#C9A54C', background: '#C9A54C18' }}
          >
            {improvingBio ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {improvingBio ? 'Improving…' : 'Improve with AI'}
          </button>
        </div>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          rows={6}
          placeholder="Write a few paragraphs about your background, experience, and what you bring to clients…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 resize-none"
        />
      </div>

      {/* ── Expertise & Areas ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expertise &amp; Areas</h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Specialties
            <span className="text-gray-400 font-normal ml-1">— press Enter or comma to add</span>
          </label>
          <TagInput
            tags={form.specialties}
            onChange={tags => setForm(f => ({ ...f, specialties: tags }))}
            placeholder="Residential Sales, Commercial Leasing…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Areas covered
            <span className="text-gray-400 font-normal ml-1">— press Enter or comma to add</span>
          </label>
          <TagInput
            tags={form.regionalPresence}
            onChange={tags => setForm(f => ({ ...f, regionalPresence: tags }))}
            placeholder="Harare, Borrowdale, Bulawayo…"
          />
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: saved ? '#16a34a' : '#1B3A6B' }}
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saved && <Check size={15} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
