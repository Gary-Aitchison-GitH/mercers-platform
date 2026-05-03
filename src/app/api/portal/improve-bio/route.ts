import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAdminAuth } from '@/lib/firebase-admin'

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

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { bio, name, role } = await req.json()
  if (!bio?.trim()) return Response.json({ error: 'No bio provided' }, { status: 400 })

  const client = new Anthropic()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are helping a real estate agent at Mercers Kensington — a premium property agency in Zimbabwe — write a professional biography for their public profile. Rewrite the following bio to be confident, warm, and professionally compelling. Keep it concise: 2–3 short paragraphs. Stay consistent in person (first or third — match what's already there). No emojis, no markdown formatting, no bullet points. Return ONLY the improved bio text, nothing else.

Agent: ${name || 'Agent'} — ${role || 'Sales Agent'}

Bio to improve:
${bio}`,
    }],
  })

  const improved = msg.content[0].type === 'text' ? msg.content[0].text.trim() : bio
  return Response.json({ improved })
}
