import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { notifyThreadParticipants } from '@/lib/email'

async function verifyAny(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    return await getAdminAuth().verifyIdToken(token)
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyAny(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id: threadId } = await params

  const thread = await db.thread.findUnique({
    where: { id: threadId },
    include: {
      listing: true,
      participants: {
        include: {
          agent: { select: { id: true, name: true, email: true } },
          client: {
            select: {
              id: true, name: true, clientType: true, journeyStage: true,
              buyerRequirements: { select: { propertyType: true, areas: true, minPrice: true, maxPrice: true, bedroomsMin: true, notes: true } },
            },
          },
        },
      },
      messages: { orderBy: { createdAt: 'asc' } },
      milestones: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!thread) return Response.json({ error: 'Thread not found' }, { status: 404 })

  // Don't double-reply if AI already spoke last
  const lastMsg = thread.messages.at(-1)
  if (lastMsg?.senderType === 'AI') {
    return Response.json({ skipped: true })
  }

  // Build context sections
  const agents = thread.participants.filter(p => p.participantType === 'AGENT' && p.agent)
  const clients = thread.participants.filter(p => p.participantType === 'CLIENT' && p.client)

  const agentNames = agents.map(p => p.agent!.name).join(', ') || 'None assigned'

  const clientSection = clients.map(p => {
    const c = p.client!
    const reqs = c.buyerRequirements[0]
    const reqStr = reqs
      ? [
          reqs.propertyType && `type: ${reqs.propertyType}`,
          reqs.areas.length && `areas: ${reqs.areas.join(', ')}`,
          (reqs.minPrice || reqs.maxPrice) && `budget: $${reqs.minPrice ?? '?'}–$${reqs.maxPrice ?? '?'}`,
          reqs.bedroomsMin && `${reqs.bedroomsMin}+ beds`,
          reqs.notes && `notes: ${reqs.notes}`,
        ].filter(Boolean).join(' | ')
      : null
    return `${c.name} (${c.clientType}, stage: ${c.journeyStage})${reqStr ? '\n  Requirements: ' + reqStr : ''}`
  }).join('\n')

  const listingSection = thread.listing
    ? `Title: ${thread.listing.title}
Location: ${thread.listing.location}
Type: ${thread.listing.type} — ${thread.listing.listingType}
Price: ${thread.listing.priceDisplay}
Size: ${thread.listing.size}
Status: ${thread.listing.status}
Description: ${thread.listing.description}`
    : thread.title ?? 'General business thread'

  const milestoneSection = thread.milestones.length
    ? thread.milestones.map(m => `  [${m.status}] ${m.title}`).join('\n')
    : '  No milestones set yet'

  const conversationSection = thread.messages.map(m => {
    const who = m.senderType === 'AI' ? 'Mercers AI' : (m.senderName ?? m.senderType)
    return `${who}: ${m.content}`
  }).join('\n')

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const systemPrompt = `You are the Mercers AI — the primary transaction coordinator and sales intelligence engine at Mercers Kensington, a premium Zimbabwe real estate agency. Today is ${today}.

You are embedded as an active participant in a property conversation thread. You are the driving force of the sales team: proactive, commercially sharp, and focused on moving transactions forward without letting anything fall through the gaps.

=== PROPERTY ===
${listingSection}

=== TEAM ===
Agents: ${agentNames}

=== CLIENTS ===
${clientSection || 'No client profiles available.'}

=== TRANSACTION MILESTONES ===
${milestoneSection}

=== CONVERSATION ===
${conversationSection}

YOUR RESPONSE RULES:
- Write your next message in this thread as Mercers AI.
- Be concise: 2–4 sentences unless explaining a complex point or drafting a document.
- Always address the most recent message directly.
- Proactively suggest the single most important next step.
- Never summarise what was just said — add value or move things forward.
- Tone: confident, warm, expert. Like a senior colleague who knows Zimbabwe property inside-out.
- If a client asks about the property, answer from the details above.
- If a milestone should be updated based on the conversation, mention it.
- Do not start your reply with "Certainly", "Of course", "Great", or similar filler words.`

  const anthropic = new Anthropic()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Write your next message in this conversation thread.' }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text.trim() : null
  if (!content) return Response.json({ skipped: true })

  const [aiMessage] = await db.$transaction([
    db.threadMessage.create({
      data: {
        threadId,
        senderType: 'AI',
        senderName: 'Mercers AI',
        content,
      },
    }),
    db.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
  ])

  const threadTitle = thread.listing?.title ?? thread.title ?? 'Conversation'
  const clientRecipients = thread.participants
    .filter(p => p.participantType === 'CLIENT' && p.client)
    .map(p => ({ name: p.client!.name, email: (p.client as { email?: string | null }).email ?? null }))
    .filter((r): r is { name: string; email: string } => !!r.email)

  notifyThreadParticipants({
    recipients: clientRecipients,
    senderName: 'Mercers AI',
    threadTitle,
    messagePreview: content,
    portalPath: 'client',
  }).catch(e => console.error('[ai-reply] email error:', e))

  console.log('[ai-reply] generated for thread', threadId, content.slice(0, 80))
  return Response.json({ message: aiMessage })
}
