import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
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

const PLATFORM_SUMMARY = `
Current Mercers portal features:
- Home tab: Mercers AI chat, pipeline stats (listings/clients/inquiries), Today's Plan todo list, recent inquiries feed, agent palette
- My Listings tab: create/edit/delete property listings with image uploads, status management (available/under offer/sold/let)
- My Clients tab: view assigned clients, buyer requirements, journey stages
- Marketing AI page (/agents/marketing-ai): go-to-market task board with 4-phase execution plan, sign-off workflow for budget approvals
- Dev Assist (this page): submit feature requests and feedback to Gary
- Admin tab (admin only): invite new agents, view agent list
- Public site: property listings, AI chat widget for buyers, agent profiles
`.trim()

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const body = await req.json()
  const { messages, action } = body

  // Get agent name for personalisation
  let agentName = 'Agent'
  const agent = await db.agent.findUnique({ where: { firebaseUid: decoded.uid }, select: { name: true } })
  if (agent) agentName = agent.name

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // ── Extract mode: parse conversation into structured request ─────────────────
  if (action === 'extract') {
    const anthropic = new Anthropic()
    const conversation = (messages as Array<{ role: string; content: string }>)
      .map(m => `${m.role === 'user' ? agentName : 'Dev AI'}: ${m.content}`)
      .join('\n\n')

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Based on this conversation between ${agentName} and the Dev AI, extract a structured feature request. Return ONLY valid JSON, no markdown, no explanation.

Conversation:
${conversation}

Return JSON with exactly these fields:
{
  "title": "concise title, max 8 words",
  "description": "2-3 sentences: what they want, why, and the use case",
  "type": "feature" | "bug" | "change" | "question",
  "priority": "low" | "medium" | "high"
}`,
        },
      ],
    })

    try {
      const text = result.content[0].type === 'text' ? result.content[0].text : ''
      const parsed = JSON.parse(text)
      return Response.json(parsed)
    } catch {
      return Response.json({ error: 'Could not parse request' }, { status: 500 })
    }
  }

  // ── Chat mode: stream Dev AI response ────────────────────────────────────────
  const systemPrompt = `You are the Mercers Dev AI — you collect feedback, feature requests, and bug reports from Mercers Kensington agents and forward them to Gary, the platform developer.

You are talking to ${agentName}.
Today is ${today}.

${PLATFORM_SUMMARY}

YOUR ROLE:
- Listen carefully and ask 1–2 good clarifying questions (not all at once) to understand the use case
- Help ${agentName} articulate WHAT they want, WHY it matters, and HOW they'd use it
- Be warm, encouraging — make them feel heard and that their feedback is valued
- When you have enough information, say something like "That's clear! I can write this up as a proper request for Gary. Hit the Submit Request button when you're ready."
- Keep responses short — 2–4 sentences max
- You cannot make changes yourself; you collect and clarify requests for Gary to review`

  const anthropic = new Anthropic()
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: (messages as Array<{ role: string; content: string }>).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
