import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { agentId, name, email, phone, message } = await req.json()
  if (!agentId || !name?.trim() || !email?.trim() || !message?.trim()) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const agent = await db.agent.findUnique({ where: { id: agentId } })
  if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: agent.email,
      subject: `New enquiry for ${agent.name} — Mercers Kensington`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#1B3A6B">New Direct Enquiry</h2>
          <p>Someone has contacted you directly through the Mercers Kensington website.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;color:#666;width:100px">From</td><td style="padding:8px;font-weight:600">${name.trim()}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${email.trim()}</td></tr>
            <tr><td style="padding:8px;color:#666">Phone</td><td style="padding:8px">${phone?.trim() || 'Not provided'}</td></tr>
          </table>
          <div style="background:#f9f9f9;border-left:3px solid #1B3A6B;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0">
            <p style="margin:0;color:#333;white-space:pre-line">${message.trim()}</p>
          </div>
          <p>Reply directly to this email or contact them at ${email.trim()}.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:12px">Mercers Kensington — 19 Kay Gardens, Harare, Zimbabwe</p>
        </div>
      `,
      replyTo: email.trim(),
    })
  } catch {
    // Email failure is non-fatal
  }

  return Response.json({ success: true })
}
