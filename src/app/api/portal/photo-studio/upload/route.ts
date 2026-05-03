import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { cloudinary } from '@/lib/cloudinary-server'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) return null
    return decoded
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mercers/listings', resource_type: 'image' },
      (err, res) => err ? reject(err) : resolve(res as { public_id: string; secure_url: string })
    )
    stream.end(buffer)
  })

  return Response.json({ publicId: result.public_id, url: result.secure_url })
}
