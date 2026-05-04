import type { PrismaClient } from '@prisma/client'
import type { DecodedIdToken } from 'firebase-admin/auth'

export async function getOrCreateAgent(db: PrismaClient, decoded: DecodedIdToken) {
  const fbRole = decoded.role as string | undefined

  // 1. Lookup by Firebase UID — sync role if the Firebase claim has changed
  let agent = await db.agent.findUnique({ where: { firebaseUid: decoded.uid } })
  if (agent) {
    if (fbRole && agent.role !== fbRole) {
      agent = await db.agent.update({ where: { id: agent.id }, data: { role: fbRole } })
    }
    return agent
  }

  // 2. Fallback: lookup by email, then link the UID and sync role
  if (decoded.email) {
    agent = await db.agent.findUnique({ where: { email: decoded.email } })
    if (agent) {
      console.log('[get-agent] linking firebaseUid to existing agent', agent.id)
      return db.agent.update({
        where: { id: agent.id },
        data: { firebaseUid: decoded.uid, ...(fbRole ? { role: fbRole } : {}) },
      })
    }
  }

  // 3. Auto-create for admin/dev users who were never invited through the agent flow
  const role = decoded.role as string
  if (['admin', 'dev'].includes(role) && decoded.email) {
    const name = (decoded.name as string | undefined) || decoded.email.split('@')[0]
    console.log('[get-agent] auto-creating agent record for', role, decoded.email)
    return db.agent.create({
      data: {
        firebaseUid: decoded.uid,
        name,
        role,
        email: decoded.email,
        phone: '',
        bio: '',
        regionalPresence: [],
        specialties: [],
        inviteStatus: 'active',
      },
    })
  }

  console.log('[get-agent] no agent found for uid:', decoded.uid, 'email:', decoded.email, 'role:', role)
  return null
}
