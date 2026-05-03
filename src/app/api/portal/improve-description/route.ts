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

  const { description, title, type } = await req.json()
  if (!description?.trim()) return Response.json({ error: 'No description provided' }, { status: 400 })

  const client = new Anthropic()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a professional real estate copywriter for Mercers Kensington, a premium property agency in Zimbabwe. Rewrite the following property description to be clear, compelling, and professionally worded. Preserve every factual detail. Use confident, engaging prose. No emojis, no markdown formatting, no bullet points — plain paragraphs only. Return ONLY the improved description text, nothing else.

Property: ${title || 'Property'} (${type || 'RESIDENTIAL'})

Original description:
${description}`,
    }],
  })

  const improved = msg.content[0].type === 'text' ? msg.content[0].text.trim() : description
  return Response.json({ improved })
}
