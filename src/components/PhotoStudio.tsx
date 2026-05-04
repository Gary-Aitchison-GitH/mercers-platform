'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  X, Upload, Sparkles, Crop, Users, CheckCircle2,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Images
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Photo {
  id: string
  publicId: string
  originalUrl: string
  processedUrl?: string
  status: 'uploading' | 'ready' | 'processing' | 'done' | 'error'
  errorMsg?: string
  selected: boolean
}

interface Ops {
  enhance: boolean
  crop: boolean
  removePeople: boolean
}

interface Props {
  onComplete: (urls: string[]) => void
  onClose: () => void
}

export default function PhotoStudio({ onComplete, onClose }: Props) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [ops, setOps] = useState<Ops>({ enhance: true, crop: true, removePeople: false })
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<Photo | null>(null)

  const getToken = useCallback(async () => {
    if (!user) return ''
    return user.getIdToken()
  }, [user])

  const updatePhoto = useCallback((id: string, patch: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    const token = await getToken()
    const newPhotos: Photo[] = files.map(f => ({
      id: crypto.randomUUID(),
      publicId: '',
      originalUrl: URL.createObjectURL(f),
      status: 'uploading',
      selected: true,
    }))
    setPhotos(prev => [...prev, ...newPhotos])

    await Promise.all(
      files.map(async (file, i) => {
        const photo = newPhotos[i]
        try {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/portal/photo-studio/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
          const data = await res.json()
          if (data.publicId) {
            updatePhoto(photo.id, {
              publicId: data.publicId,
              originalUrl: data.url,
              status: 'ready',
            })
          } else {
            updatePhoto(photo.id, { status: 'error', errorMsg: 'Upload failed' })
          }
        } catch {
          updatePhoto(photo.id, { status: 'error', errorMsg: 'Upload failed' })
        }
      })
    )
  }, [getToken, updatePhoto])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
    noClick: photos.length > 0,
  })

  const selectedPhotos = photos.filter(p => p.selected && p.status === 'ready')
  const doneCount = photos.filter(p => p.status === 'done').length
  const activeOpsCount = Object.values(ops).filter(Boolean).length

  async function handleProcess() {
    if (!selectedPhotos.length || !activeOpsCount) return
    const token = await getToken()

    selectedPhotos.forEach(p => updatePhoto(p.id, { status: 'processing' }))
    setProcessing(true)

    try {
      const res = await fetch('/api/portal/photo-studio/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: selectedPhotos.map(p => p.publicId), operations: ops }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }))
        selectedPhotos.forEach(p => updatePhoto(p.id, { status: 'error', errorMsg: err.error || 'Server error' }))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.done) continue
            const photo = photos.find(p => p.publicId === event.publicId)
            if (!photo) continue
            if (event.status === 'done') {
              updatePhoto(photo.id, { status: 'done', processedUrl: event.url })
            } else {
              updatePhoto(photo.id, { status: 'error', errorMsg: event.message })
            }
          } catch { /* malformed SSE line */ }
        }
      }
    } catch {
      selectedPhotos.forEach(p => updatePhoto(p.id, { status: 'error', errorMsg: 'Connection error' }))
    } finally {
      setProcessing(false)
    }
  }

  function handleAddToListing() {
    const urls = photos
      .filter(p => p.status === 'done' && p.processedUrl)
      .map(p => p.processedUrl!)
    // Include any ready (unprocessed) photos too
    const readyUrls = photos
      .filter(p => p.status === 'ready')
      .map(p => p.originalUrl)
    onComplete([...urls, ...readyUrls])
  }

  function toggleAll() {
    const allSelected = photos.filter(p => p.status === 'ready').every(p => p.selected)
    setPhotos(prev => prev.map(p =>
      p.status === 'ready' ? { ...p, selected: !allSelected } : p
    ))
  }

  const opsConfig = [
    { key: 'enhance' as const, icon: Sparkles, label: 'Auto-enhance', desc: 'Brightness, contrast, indoor lighting', addon: false },
    { key: 'crop' as const, icon: Crop, label: 'Crop to 5×7 landscape', desc: 'Smart crop preserves the room', addon: false },
    { key: 'removePeople' as const, icon: Users, label: 'Remove people & pets', desc: 'AI erases people, cats, dogs', addon: true },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1B3A6B' }}>
              <Images size={18} color="white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Photo Studio</h2>
              <p className="text-xs text-gray-400">AI-powered bulk editing for listing photos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Left: photo area */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">

            {/* Drop zone (always visible at top when photos exist) */}
            <div
              {...getRootProps()}
              className={`transition-all ${photos.length === 0
                ? 'flex-1 flex flex-col items-center justify-center cursor-pointer m-6 rounded-2xl border-2 border-dashed'
                : 'mx-4 mt-4 rounded-xl border-2 border-dashed cursor-pointer py-3 flex items-center justify-center gap-2'
              } ${isDragActive ? 'border-[#1B3A6B] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input {...getInputProps()} />
              {photos.length === 0 ? (
                <div className="text-center px-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#1B3A6B11' }}>
                    <Upload size={28} style={{ color: '#1B3A6B' }} />
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">Drop photos here</p>
                  <p className="text-sm text-gray-400">or click to browse your files</p>
                  <p className="text-xs text-gray-300 mt-3">Supports JPG, PNG, HEIC · Select all photos for this listing at once</p>
                </div>
              ) : (
                <>
                  <Upload size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Add more photos</span>
                </>
              )}
            </div>

            {/* Select all bar */}
            {photos.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2">
                <button
                  onClick={toggleAll}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {photos.filter(p => p.status === 'ready').every(p => p.selected) ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-xs text-gray-400">
                  {selectedPhotos.length} of {photos.filter(p => p.status === 'ready').length} selected
                </span>
              </div>
            )}

            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className={`relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer border-2 transition-all ${
                        photo.selected && photo.status === 'ready' ? 'border-[#1B3A6B]' : 'border-transparent'
                      }`}
                      onClick={() => {
                        if (photo.status === 'done') {
                          setPreview(photo)
                        } else if (photo.status === 'ready') {
                          updatePhoto(photo.id, { selected: !photo.selected })
                        }
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.status === 'done' ? photo.processedUrl! : photo.originalUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {/* Checkbox */}
                      {photo.status === 'ready' && (
                        <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          photo.selected ? 'bg-[#1B3A6B] border-[#1B3A6B]' : 'bg-white/80 border-gray-300'
                        }`}>
                          {photo.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      )}

                      {/* Status overlay */}
                      {photo.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 size={20} className="text-white animate-spin" />
                        </div>
                      )}
                      {photo.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                          <Sparkles size={18} className="text-[#C9A54C] animate-pulse" />
                          <span className="text-white text-[10px] font-medium">AI working…</span>
                        </div>
                      )}
                      {photo.status === 'done' && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                          <CheckCircle2 size={14} color="white" />
                        </div>
                      )}
                      {photo.status === 'error' && (
                        <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-1 px-2">
                          <AlertCircle size={16} className="text-white" />
                          <span className="text-white text-[9px] text-center leading-tight">{photo.errorMsg}</span>
                        </div>
                      )}
                      {photo.status === 'done' && (
                        <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-medium text-white bg-black/50 py-0.5">
                          Tap to compare
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: operations panel */}
          <div className="w-64 flex flex-col p-5 gap-4 overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Operations</p>
              <div className="space-y-2">
                {opsConfig.map(({ key, icon: Icon, label, desc, addon }) => (
                  <button
                    key={key}
                    onClick={() => setOps(o => ({ ...o, [key]: !o[key] }))}
                    disabled={processing}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      ops[key]
                        ? 'border-[#1B3A6B] bg-blue-50'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${ops[key] ? '' : 'grayscale'}`}
                      style={{ background: ops[key] ? '#1B3A6B' : '#e5e7eb' }}>
                      <Icon size={14} color={ops[key] ? 'white' : '#9ca3af'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
                        {addon && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none">Add-on</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress */}
            {(processing || doneCount > 0) && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Progress</span>
                  <span className="text-xs text-gray-500">{doneCount}/{selectedPhotos.length + doneCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: '#1B3A6B',
                      width: `${((doneCount) / (selectedPhotos.length + doneCount || 1)) * 100}%`,
                    }}
                  />
                </div>
                {processing && (
                  <p className="text-[10px] text-gray-400 mt-1.5">AI is processing in parallel…</p>
                )}
              </div>
            )}

            {/* Process button */}
            <button
              onClick={handleProcess}
              disabled={processing || !selectedPhotos.length || !activeOpsCount}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#C9A54C' }}
            >
              {processing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Process {selectedPhotos.length || ''} photo{selectedPhotos.length !== 1 ? 's' : ''}
                </>
              )}
            </button>

            {activeOpsCount === 0 && (
              <p className="text-xs text-red-500 text-center -mt-2">Select at least one operation</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToListing}
            disabled={photos.filter(p => p.status === 'done' || p.status === 'ready').length === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: '#1B3A6B' }}
          >
            Add {photos.filter(p => p.status === 'done').length || photos.filter(p => p.status === 'ready').length} photos to listing
          </button>
        </div>
      </div>

      {/* Before/After preview modal — side-by-side full images */}
      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const idx = photos.findIndex(p => p.id === preview.id)
                    const prev = photos.slice(0, idx).reverse().find(p => p.status === 'done')
                    if (prev) setPreview(prev)
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <ChevronLeft size={18} color="white" />
                </button>
                <button
                  onClick={() => {
                    const idx = photos.findIndex(p => p.id === preview.id)
                    const next = photos.slice(idx + 1).find(p => p.status === 'done')
                    if (next) setPreview(next)
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <ChevronRight size={18} color="white" />
                </button>
                <span className="text-white text-sm font-medium ml-1">Before / After</span>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <X size={18} color="white" />
              </button>
            </div>

            {/* Side-by-side: each image is full and complete */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-center text-xs font-bold text-white/70 uppercase tracking-wider">Before</span>
                <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.originalUrl} alt="Before" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-center text-xs font-bold text-[#C9A54C] uppercase tracking-wider">After</span>
                <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.processedUrl!} alt="After" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            <p className="text-center text-white/40 text-xs mt-3">Click background to close · use arrows to browse processed photos</p>
          </div>
        </div>
      )}
    </div>
  )
}
