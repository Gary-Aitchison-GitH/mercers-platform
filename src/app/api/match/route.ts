import { NextRequest } from 'next/server'
import { matchClientToAgent } from '@/lib/matching'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { intent, propertyType, area, budget, notes } = body

    if (!intent || !propertyType || !area) {
      return Response.json({ error: 'intent, propertyType, and area are required' }, { status: 400 })
    }

    const result = await matchClientToAgent({ intent, propertyType, area, budget, notes })
    return Response.json(result)
  } catch (err) {
    console.error('Match error:', err)
    return Response.json({ error: 'Matching failed' }, { status: 500 })
  }
}
