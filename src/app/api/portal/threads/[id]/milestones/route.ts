import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) return null
    return decoded
  } catch {
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id: threadId } = await params
  const milestones = await db.milestone.findMany({
    where: { threadId },
    orderBy: { sortOrder: 'asc' },
  })

  return Response.json({ milestones })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id: threadId } = await params
  const body = await req.json()
  const { title, description, dueDate } = body as {
    title: string
    description?: string
    dueDate?: string
  }

  if (!title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })

  const last = await db.milestone.findFirst({
    where: { threadId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const milestone = await db.milestone.create({
    data: {
      threadId,
      title: title.trim(),
      description: description?.trim() ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  })

  return Response.json({ milestone }, { status: 201 })
}
