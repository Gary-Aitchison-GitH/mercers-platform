import { Resend } from 'resend'

const APP_URL = 'https://mercers-properties.vercel.app'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Mercers Kensington <noreply@resend.dev>'

function threadEmailHtml({
  recipientName,
  senderName,
  threadTitle,
  preview,
  portalUrl,
}: {
  recipientName: string
  senderName: string
  threadTitle: string
  preview: string
  portalUrl: string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#1B3A6B;padding:24px 32px">
            <p style="margin:0;color:#C9A54C;font-size:11px;letter-spacing:2px;text-transform:uppercase">Mercers Kensington</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:bold">New message</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0 0 4px;color:#888;font-size:13px">Hi ${recipientName},</p>
            <p style="margin:0 0 20px;color:#333;font-size:15px">
              <strong>${senderName}</strong> sent a message in <strong>${threadTitle}</strong>:
            </p>
            <blockquote style="margin:0 0 24px;padding:14px 18px;background:#f8f8f8;border-left:3px solid #C9A54C;border-radius:4px;color:#444;font-size:14px;line-height:1.6">
              ${preview}
            </blockquote>
            <a href="${portalUrl}" style="display:inline-block;background:#1B3A6B;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold">
              Open conversation →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f0f0f0">
            <p style="margin:0;color:#aaa;font-size:11px">Mercers Kensington · Zimbabwe Property</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function notifyThreadParticipants({
  recipients,
  senderName,
  threadTitle,
  messagePreview,
  portalPath,
}: {
  recipients: { name: string; email: string }[]
  senderName: string
  threadTitle: string
  messagePreview: string
  portalPath: 'agents' | 'client'
}) {
  const resend = getResend()
  if (!resend || !recipients.length) return

  const portalUrl = portalPath === 'agents'
    ? `${APP_URL}/agents/dashboard`
    : `${APP_URL}/portal/client`

  const preview = messagePreview.length > 200
    ? messagePreview.slice(0, 200) + '…'
    : messagePreview

  await Promise.allSettled(
    recipients.map(r =>
      resend.emails.send({
        from: FROM,
        to: r.email,
        subject: `New message: ${threadTitle}`,
        html: threadEmailHtml({
          recipientName: r.name,
          senderName,
          threadTitle,
          preview,
          portalUrl,
        }),
      })
    )
  )
}
