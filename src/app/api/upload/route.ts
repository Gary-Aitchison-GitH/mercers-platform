import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const blob = await put(`listings/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  return Response.json({ url: blob.url })
}
