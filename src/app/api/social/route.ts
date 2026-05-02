import Anthropic from '@anthropic-ai/sdk'
import { listings, Listing } from '@/lib/data/listings'
import { agents } from '@/lib/data/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Social Media Pipeline Agent
 *
 * Generates and (optionally) posts property listings to:
 * - Facebook (via Meta Graph API)
 * - Instagram (via Meta Graph API)
 * - Twitter/X (via Twitter API v2)
 * - LinkedIn (via LinkedIn API)
 *
 * Content is generated in English, Shona, and Ndebele.
 */

type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin'

interface SocialPostRequest {
  listingId?: string
  platform?: Platform | 'all'
  customMessage?: string
  locale?: 'en' | 'sn' | 'nd' | 'all'
}

async function generateSocialContent(listing: Listing, platform: Platform, locale: string): Promise<string> {
  const title = locale === 'sn' ? listing.titleSn : locale === 'nd' ? listing.titleNd : listing.title
  const desc = locale === 'sn' ? listing.descriptionSn : locale === 'nd' ? listing.descriptionNd : listing.description

  const platformGuides: Record<Platform, string> = {
    facebook: 'Conversational, 2-3 paragraphs, include call-to-action, use emojis sparingly. Max 500 chars.',
    instagram: 'Visually descriptive, punchy opening line, 5-10 relevant hashtags at end. Max 300 chars + hashtags.',
    twitter: 'Concise, impactful, one clear message, 2-3 hashtags. Max 240 chars.',
    linkedin: 'Professional tone, business value emphasis, market context. Max 400 chars.',
  }

  const prompt = `Create a ${platform} post for this Zimbabwe property listing.

Platform guidelines: ${platformGuides[platform]}
Language: ${locale === 'sn' ? 'Shona' : locale === 'nd' ? 'Ndebele' : 'English'}

Property: ${title}
Location: ${listing.location}
Price: ${listing.priceDisplay}
Size: ${listing.size}
Type: ${listing.type}
For: ${listing.listingType === 'sale' ? 'Sale' : 'Rent'}
Description: ${desc}

Agency: Mercers Kensington | Estate Agents Council of Zimbabwe
Contact: info@mercers.co.zw

Write ONLY the post content, no explanation.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function postToFacebook(content: string, _listing: Listing): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FACEBOOK_PAGE_ID

  if (!token || !pageId) return { success: false, error: 'Facebook credentials not configured' }

  try {
    const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, access_token: token }),
    })
    const data = await res.json() as { id?: string; error?: { message: string } }
    return data.id ? { success: true, id: data.id } : { success: false, error: data.error?.message }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

async function postToTwitter(content: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_SECRET

  if (!bearerToken || !apiKey) return { success: false, error: 'Twitter credentials not configured' }

  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ text: content }),
    })
    const data = await res.json() as { data?: { id: string }; errors?: Array<{ message: string }> }
    return data.data?.id ? { success: true, id: data.data.id } : { success: false, error: data.errors?.[0]?.message }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

async function postToLinkedIn(content: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN
  const organizationId = process.env.LINKEDIN_ORGANIZATION_ID

  if (!token || !organizationId) return { success: false, error: 'LinkedIn credentials not configured' }

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        author: `urn:li:organization:${organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })
    const data = await res.json() as { id?: string; message?: string }
    return data.id ? { success: true, id: data.id } : { success: false, error: data.message }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function POST(req: Request) {
  const body: SocialPostRequest = await req.json()
  const { listingId, platform = 'all', customMessage, locale = 'en' } = body

  const listing = listingId ? listings.find(l => l.id === listingId) : listings[0]
  if (!listing) {
    return Response.json({ error: 'Listing not found' }, { status: 404 })
  }

  const platforms: Platform[] = platform === 'all'
    ? ['facebook', 'instagram', 'twitter', 'linkedin']
    : [platform]

  const locales = locale === 'all' ? ['en', 'sn', 'nd'] : [locale]

  const results: Record<string, unknown> = {}

  for (const plat of platforms) {
    results[plat] = {}
    for (const loc of locales) {
      const content = customMessage || await generateSocialContent(listing, plat, loc)

      let postResult: { success: boolean; id?: string; error?: string } = { success: false, error: 'Not implemented' }
      if (plat === 'facebook') postResult = await postToFacebook(content, listing)
      else if (plat === 'twitter') postResult = await postToTwitter(content)
      else if (plat === 'linkedin') postResult = await postToLinkedIn(content)
      else if (plat === 'instagram') postResult = { success: false, error: 'Instagram posting requires Facebook Page integration' }

      ;(results[plat] as Record<string, unknown>)[loc] = {
        content,
        posted: postResult,
      }
    }
  }

  return Response.json({
    listing: { id: listing.id, title: listing.title, price: listing.priceDisplay },
    results,
    timestamp: new Date().toISOString(),
  })
}

export async function GET() {
  return Response.json({
    status: 'Social Media Pipeline Agent active',
    description: 'POST with { listingId, platform, locale } to generate and post content',
    platforms: ['facebook', 'instagram', 'twitter', 'linkedin'],
    locales: ['en', 'sn', 'nd', 'all'],
    requiredEnvVars: {
      facebook: ['FACEBOOK_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID'],
      twitter: ['TWITTER_BEARER_TOKEN', 'TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'],
      linkedin: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_ORGANIZATION_ID'],
    },
  })
}
