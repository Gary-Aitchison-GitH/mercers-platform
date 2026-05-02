import Anthropic from '@anthropic-ai/sdk'
import { listings } from '@/lib/data/listings'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * SEO Optimization Agent
 *
 * Tracks search patterns and user behavior, then uses Claude to generate
 * improved meta tags, content, and structured data to improve Google rankings.
 *
 * The "RL loop": queries → analyze patterns → optimize → measure → repeat
 */

interface SEOAnalysisRequest {
  page: string
  currentKeywords?: string[]
  searchQueries?: string[]
  locale?: string
}

export async function POST(req: Request) {
  const body: SEOAnalysisRequest = await req.json()
  const { page, currentKeywords = [], searchQueries = [], locale = 'en' } = body

  const listingSummary = listings.map(l =>
    `${l.title} — ${l.location} — ${l.priceDisplay} — ${l.type} — ${l.listingType}`
  ).join('\n')

  const prompt = `You are an SEO optimization agent for Mercers Kensington, a Zimbabwe property agency.

Page: ${page}
Current keywords: ${currentKeywords.join(', ') || 'none'}
Recent user search queries: ${searchQueries.join(', ') || 'none'}
Language: ${locale}

Available listings:
${listingSummary}

Analyze and provide:
1. Optimized page title (under 60 chars)
2. Meta description (under 155 chars)
3. 10 target keywords (mix of short and long-tail, Zimbabwe-specific)
4. Structured data additions (JSON-LD)
5. Content improvement suggestions
6. Internal linking recommendations

Focus on Zimbabwe property market terms, local area names, and property types.
Include Shona (${locale === 'sn' ? 'PRIMARY' : 'secondary'}) and Ndebele (${locale === 'nd' ? 'PRIMARY' : 'secondary'}) keyword variations.

Respond with valid JSON only.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  let parsed
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text }
  } catch {
    parsed = { raw: text }
  }

  return Response.json({
    page,
    locale,
    optimization: parsed,
    timestamp: new Date().toISOString(),
  })
}

export async function GET() {
  return Response.json({
    status: 'SEO Agent active',
    description: 'POST with { page, currentKeywords, searchQueries, locale } to get optimization recommendations',
    pages: ['/', '/listings', '/agents', '/contact'],
  })
}
