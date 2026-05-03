import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const listing = await db.listing.findUnique({
    where: { id, status: 'AVAILABLE' },
    include: { agent: true },
  })
  if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 })

  const body = await req.json()
  const { name, email, phone, idToken } = body as {
    name?: string; email?: string; phone?: string; idToken?: string
  }

  let client = null

  if (idToken) {
    // Logged-in user — find their client record
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken)
      const user = await db.user.findUnique({ where: { firebaseUid: decoded.uid }, include: { client: true } })
      client = user?.client ?? null
      if (!client && user) {
        client = await db.client.create({
          data: { userId: user.id, name: user.name, email: user.email, clientType: 'BUYER' },
        })
      }
    } catch {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }
  } else {
    // Guest — name + email required
    if (!name?.trim() || !email?.trim()) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 })
    }
    client = await db.client.findFirst({ where: { email: email.trim() } })
    if (!client) {
      client = await db.client.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() ?? null,
          clientType: 'BUYER',
        },
      })
    } else if (phone?.trim() && !client.phone) {
      await db.client.update({ where: { id: client.id }, data: { phone: phone.trim() } })
    }
  }

  if (!client) return Response.json({ error: 'Could not create client record' }, { status: 500 })

  // Assign to listing's agent if unassigned
  if (!client.assignedAgentId) {
    await db.client.update({
      where: { id: client.id },
      data: { assignedAgentId: listing.agentId },
    })
  }

  // Record the specific property interest
  await db.buyerRequirement.create({
    data: {
      clientId: client.id,
      notes: `Registered interest in: ${listing.title} (${listing.location}) — ${listing.priceDisplay}`,
    },
  })

  // Email the listing agent
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const clientName = client.name
    const clientEmail = client.email ?? email ?? 'Not provided'
    const clientPhone = client.phone ?? phone ?? 'Not provided'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: listing.agent.email,
      subject: `New interest registered: ${listing.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#1B3A6B">New Property Interest</h2>
          <p>A lead has registered interest in one of your listings.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;color:#666;width:120px">Listing</td><td style="padding:8px;font-weight:600">${listing.title}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Location</td><td style="padding:8px">${listing.location}</td></tr>
            <tr><td style="padding:8px;color:#666">Price</td><td style="padding:8px">${listing.priceDisplay}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Name</td><td style="padding:8px">${clientName}</td></tr>
            <tr><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${clientEmail}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Phone</td><td style="padding:8px">${clientPhone}</td></tr>
          </table>
          <p>This client has been added to your portal. <a href="https://mercers-properties.vercel.app/agents/dashboard" style="color:#1B3A6B">View in portal →</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:12px">Mercers Kensington — 19 Kay Gardens, Harare, Zimbabwe</p>
        </div>
      `,
    })
  } catch {
    // Email failure is non-fatal — interest is still registered
  }

  return Response.json({ success: true })
}
