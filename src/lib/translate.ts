import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  return JSON.parse(jsonMatch[0]) as ListingTranslations
}
