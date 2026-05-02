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

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { messages } = await req.json()

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)

  let agentName = 'Agent'
  let contextData = ''

  if (!isAdmin) {
    const agent = await db.agent.findUnique({
      where: { firebaseUid: decoded.uid },
      include: {
        listings: {
          where: { status: 'AVAILABLE' },
          select: { title: true, location: true, priceDisplay: true, type: true, listingType: true },
          take: 20,
        },
        clientsAssigned: {
          select: { name: true, clientType: true, journeyStage: true, email: true, phone: true },
          take: 20,
        },
      },
    })

    if (agent) {
      agentName = agent.name

      const recentConvos = await db.conversation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { name: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      })

      const listingsSummary = agent.listings.length
        ? agent.listings.map(l => `  • ${l.title} | ${l.location} | ${l.priceDisplay} | ${l.type} ${l.listingType}`).join('\n')
        : '  (none yet)'

      const clientsSummary = agent.clientsAssigned.length
        ? agent.clientsAssigned.map(c => `  • ${c.name} | ${c.clientType} | Stage: ${c.journeyStage}${c.email ? ` | ${c.email}` : ''}`).join('\n')
        : '  (none yet)'

      const convosSummary = recentConvos.length
        ? recentConvos.map(c => {
            const msg = c.messages[0]?.content?.slice(0, 80) ?? 'no messages'
            return `  • ${c.client?.name ?? 'Visitor'}: "${msg}"`
          }).join('\n')
        : '  (none yet)'

      contextData = `
AGENT PIPELINE DATA
Agent: ${agent.name} (${agent.email})

Active Listings (${agent.listings.length}):
${listingsSummary}

Assigned Clients (${agent.clientsAssigned.length}):
${clientsSummary}

Recent Website Conversations:
${convosSummary}
`.trim()
    }
  } else {
    const [listingCount, clientCount] = await Promise.all([
      db.listing.count({ where: { status: 'AVAILABLE' } }),
      db.client.count(),
    ])
    agentName = 'Admin'
    contextData = `Platform Overview: ${listingCount} active listings, ${clientCount} total clients across all agents.`
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const systemPrompt = `You are the Mercers Kensington AI assistant — a sharp, efficient property intelligence tool for ${agentName} at Mercers Kensington, a premium Zimbabwe real estate agency.

Today is ${today}.

${contextData}

YOUR ROLE:
- Deliver crisp morning briefings when asked ("what's my day?", "morning brief", etc.)
- When asked for a to-do list, output a clean numbered list of 5–7 specific, actionable tasks based on the pipeline data above
- Draft professional emails, WhatsApp messages, and client communications when requested
- Identify which clients need urgent follow-up based on journey stage (viewing and offer stages are most time-sensitive)
- Answer specific questions about listings, clients, and deals
- Suggest match opportunities between clients and available listings
- Be concise — lead with the most actionable insight, keep responses under 250 words unless drafting a document
- Tone: confident, professional, warm — like a smart colleague, not a chatbot`

  const anthropic = new Anthropic()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
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

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
