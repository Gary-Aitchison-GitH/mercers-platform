import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Agent translations ───────────────────────────────────────────────────────

interface AgentTranslations {
  bioSn: string
  bioNd: string
  roleSn: string
  roleNd: string
}

export async function translateAgent(bio: string, role: string): Promise<AgentTranslations> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    tools: [{
      name: 'provide_translations',
      description: 'Provide the Shona and Ndebele translations',
      input_schema: {
        type: 'object' as const,
        properties: {
          roleSn: { type: 'string', description: 'Job title in Shona' },
          roleNd: { type: 'string', description: 'Job title in Ndebele' },
          bioSn:  { type: 'string', description: 'Agent bio in Shona' },
          bioNd:  { type: 'string', description: 'Agent bio in Ndebele' },
        },
        required: ['roleSn', 'roleNd', 'bioSn', 'bioNd'],
      },
    }],
    tool_choice: { type: 'tool', name: 'provide_translations' },
    system: `You are a professional translator for a Zimbabwe real estate agency.
Translate agent bios and job titles accurately into Shona (sn) and Ndebele (nd).
Keep proper names, place names, and English real-estate terms (e.g. USD, m², agent) as-is.`,
    messages: [{
      role: 'user',
      content: `Translate this agent job title and bio into Shona and Ndebele.\n\nJob title: ${role}\n\nBio:\n${bio}`,
    }],
  })

  const toolUse = message.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool_use block in translation response')
  return toolUse.input as AgentTranslations
}

// ─── Listing translations ─────────────────────────────────────────────────────

interface ListingTranslations {
  titleSn: string
  titleNd: string
  descriptionSn: string
  descriptionNd: string
}

export async function translateListing(title: string, description: string): Promise<ListingTranslations> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    tools: [{
      name: 'provide_translations',
      description: 'Provide the Shona and Ndebele translations',
      input_schema: {
        type: 'object' as const,
        properties: {
          titleSn:       { type: 'string', description: 'Listing title in Shona' },
          titleNd:       { type: 'string', description: 'Listing title in Ndebele' },
          descriptionSn: { type: 'string', description: 'Listing description in Shona' },
          descriptionNd: { type: 'string', description: 'Listing description in Ndebele' },
        },
        required: ['titleSn', 'titleNd', 'descriptionSn', 'descriptionNd'],
      },
    }],
    tool_choice: { type: 'tool', name: 'provide_translations' },
    system: `You are a professional translator for a Zimbabwe real estate agency.
Translate property listings accurately into Shona (sn) and Ndebele (nd).
Keep property-specific terms (bedroom, bathroom, USD, m², etc.) in English.`,
    messages: [{
      role: 'user',
      content: `Translate this property listing into Shona and Ndebele.\n\nTitle: ${title}\n\nDescription:\n${description}`,
    }],
  })

  const toolUse = message.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool_use block in translation response')
  return toolUse.input as ListingTranslations
}
