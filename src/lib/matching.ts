import Anthropic from '@anthropic-ai/sdk'
import { agents, Agent } from './data/agents'
import { listings, Listing } from './data/listings'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface MatchRequest {
  intent: 'buy' | 'rent' | 'sell'
  propertyType: string
  area: string
  budget?: string
  notes?: string
}

export interface AgentMatch {
  agent: Agent
  score: number
  reasoning: string
  matchedListings: Listing[]
}

export interface MatchResult {
  primaryMatch: AgentMatch
  alternatives: AgentMatch[]
  summary: string
}

export async function matchClientToAgent(req: MatchRequest): Promise<MatchResult> {
  const agentContext = agents
    .filter(() => true)
    .map(a =>
      `ID: ${a.id} | Name: ${a.name} | Role: ${a.role} | Areas: ${a.regionalPresence.join(', ')} | Specialties: ${a.specialties.join(', ')} | Email: ${a.email} | Phone: ${a.phone}`
    )
    .join('\n')

  const listingContext = listings
    .map(l =>
      `ID: ${l.id} | ${l.title} | ${l.area} | ${l.priceDisplay} | ${l.type} | ${l.listingType} | Agent: ${l.agent}`
    )
    .join('\n')

  const prompt = `You are matching a property client to the best Mercers agent. Mercers is one national team — agents collaborate and refer internally.

CLIENT REQUIREMENTS:
- Intent: ${req.intent === 'buy' ? 'Buy' : req.intent === 'rent' ? 'Rent' : 'Sell'}
- Property type: ${req.propertyType}
- Area of interest: ${req.area}
${req.budget ? `- Budget: ${req.budget}` : ''}
${req.notes ? `- Additional notes: ${req.notes}` : ''}

AVAILABLE AGENTS:
${agentContext}

AVAILABLE LISTINGS:
${listingContext}

Return a JSON object with this exact structure:
{
  "primaryAgentId": "<agent id>",
  "primaryScore": <0-100>,
  "primaryReasoning": "<2-3 sentences why this agent is the best fit>",
  "alternatives": [
    { "agentId": "<id>", "score": <0-100>, "reasoning": "<1 sentence>" }
  ],
  "matchedListingIds": ["<listing id>", ...],
  "summary": "<1 sentence summary for the client>"
}

Alternatives should be 1-2 other agents who could also help. Match listings only if intent is buy or rent and relevant ones exist.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null

  if (!parsed) throw new Error('Failed to parse match response')

  const primaryAgent = agents.find(a => a.id === parsed.primaryAgentId) ?? agents[0]
  const matchedListings = listings.filter(l => (parsed.matchedListingIds ?? []).includes(l.id))

  const alternatives: AgentMatch[] = (parsed.alternatives ?? [])
    .map((alt: { agentId: string; score: number; reasoning: string }) => {
      const agent = agents.find(a => a.id === alt.agentId)
      if (!agent) return null
      return { agent, score: alt.score, reasoning: alt.reasoning, matchedListings: [] }
    })
    .filter(Boolean) as AgentMatch[]

  return {
    primaryMatch: {
      agent: primaryAgent,
      score: parsed.primaryScore ?? 90,
      reasoning: parsed.primaryReasoning ?? 'Best match for your requirements.',
      matchedListings,
    },
    alternatives,
    summary: parsed.summary ?? `We've matched you with ${primaryAgent.name}.`,
  }
}
