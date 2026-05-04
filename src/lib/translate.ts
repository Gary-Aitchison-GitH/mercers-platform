import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Strip unescaped control characters inside JSON string values so JSON.parse
// doesn't choke on multi-line bios returned by the model.
function sanitizeJson(raw: string): string {
  // Replace unescaped control characters inside JSON string values.
  // Uses [\s\S] instead of dotAll flag for broader TS target compatibility.
  return raw.replace(/"((?:[^"\\]|\\[\s\S])*)"/g, (_, inner) =>
    '"' + inner.replace(/[\x00-\x1f]/g, (c: string) => {
      if (c === '\n') return '\\n'
      if (c === '\r') return '\\r'
      if (c === '\t') return '\\t'
      return ''
    }) + '"'
  )
}

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
    system: `You are a professional translator for a Zimbabwe real estate agency.
Translate agent bios and job titles accurately into Shona (sn) and Ndebele (nd).
Keep proper names, place names, and English real-estate terms (e.g. USD, m², agent) as-is.
Respond with valid JSON only, no other text.`,
    messages: [{
      role: 'user',
      content: `Translate the following agent bio and job title into both Shona and Ndebele.

Job title: ${role}
Bio: ${bio}

Respond with this exact JSON structure:
{
  "roleSn": "...",
  "roleNd": "...",
  "bioSn": "...",
  "bioNd": "..."
}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in translation response')
  return JSON.parse(sanitizeJson(jsonMatch[0])) as AgentTranslations
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
    system: `You are a professional translator for a Zimbabwe real estate agency.
Translate property listings accurately into Shona (sn) and Ndebele (nd).
Keep property-specific terms (bedroom, bathroom, USD, m², etc.) in English.
Respond with valid JSON only, no other text.`,
    messages: [{
      role: 'user',
      content: `Translate this property listing title and description into both Shona and Ndebele.

Title: ${title}
Description: ${description}

Respond with this exact JSON structure:
{
  "titleSn": "...",
  "titleNd": "...",
  "descriptionSn": "...",
  "descriptionNd": "..."
}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in translation response')
  return JSON.parse(sanitizeJson(jsonMatch[0])) as ListingTranslations
}
