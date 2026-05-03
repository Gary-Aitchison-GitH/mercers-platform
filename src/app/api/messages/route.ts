import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getOrCreate, addMessage, setGaryJoined, getAllConversations, markReadByGary } from '@/lib/store'
import { getDb } from '@/lib/db'
import { agents } from '@/lib/data/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function buildSystemPrompt(locale: string) {
  const db = await getDb()
  const dbListings = db ? await db.listing.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' },
  }) : []

  const listingLines = dbListings.length > 0
    ? dbListings.map(l => `- ${l.title} | ${l.location} | ${l.priceDisplay} | ${l.size} | ${l.listingType}`).join('\n')
    : 'No listings currently available.'

  const agentLines = agents.map(a => `- ${a.name}: ${a.role} | Areas: ${a.regionalPresence.join(', ')} | Specialties: ${a.specialties.join(', ')} — ${a.email}`).join('\n')

  const lang = locale === 'sn' ? 'Respond in Shona' : locale === 'nd' ? 'Respond in Ndebele' : 'Respond in English'

  return `You are the Mercers AI property agent for Zimbabwe. Mercers is one national team — no branches, agents work collaboratively across all regions and refer clients to the best-suited colleague when needed.

Available listings:
${listingLines}

Our agents (nationwide team):
${agentLines}

Language: ${lang}.
Be concise, warm, and professional. Match clients to the right agent based on their needs and the agent specialties above. If Gary (the property manager) is on the line, stay quiet.
IMPORTANT: Write in plain conversational prose only. No bullet points, no bold text, no asterisks, no markdown formatting, no emojis. Just natural sentences.`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const admin = searchParams.get('admin') === 'true'

  if (admin) {
    return Response.json({ conversations: await getAllConversations() })
  }

  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 })

  const convo = await getOrCreate(sessionId)
  return Response.json({ conversation: convo })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, content, role, locale = 'en', action } = body

  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 })

  if (action === 'gary-join') {
    await setGaryJoined(sessionId, true)
    await markReadByGary(sessionId)
    return Response.json({ ok: true })
  }

  if (action === 'gary-leave') {
    await setGaryJoined(sessionId, false)
    return Response.json({ ok: true })
  }

  if (action === 'mark-read') {
    await markReadByGary(sessionId)
    return Response.json({ ok: true })
  }

  // Get current conversation state (before adding the new message)
  const convo = await getOrCreate(sessionId, locale)
  const userMsg = await addMessage(sessionId, { role, content })

  if (role === 'user' && convo.status !== 'gary-joined') {
    // Build history: all previous messages + the new user message
    const history = [
      ...convo.messages
        .filter(m => m.role !== 'gary')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content })),
      { role: 'user' as const, content },
    ]

    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: await buildSystemPrompt(locale),
      messages: history,
    })

    const aiText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    const aiMsg = await addMessage(sessionId, { role: 'assistant', content: aiText })

    return Response.json({ userMessage: userMsg, aiMessage: aiMsg, garyMode: false })
  }

  if (role === 'gary') {
    return Response.json({ userMessage: userMsg, garyMode: true })
  }

  return Response.json({ userMessage: userMsg, garyMode: convo.status === 'gary-joined' })
}
