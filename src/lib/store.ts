import { getDb } from './db'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'gary'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  sessionId: string
  locale: string
  startedAt: string
  lastActivity: string
  messages: ChatMessage[]
  status: 'active' | 'gary-joined' | 'closed'
  unreadByGary: number
}

// In-memory fallback (used when DATABASE_URL is not set)
const memStore = new Map<string, Conversation>()

function dbRowToConversation(row: {
  id: string; sessionId: string; locale: string; status: string
  unreadCount: number; createdAt: Date
  messages: { id: string; senderType: string; content: string; createdAt: Date }[]
}): Conversation {
  const messages: ChatMessage[] = row.messages.map(m => ({
    id: m.id,
    role: m.senderType === 'CLIENT' ? 'user' : m.senderType === 'AI' ? 'assistant' : 'gary',
    content: m.content,
    timestamp: m.createdAt.toISOString(),
  }))
  const last = messages[messages.length - 1]
  return {
    id: row.sessionId,
    sessionId: row.sessionId,
    locale: row.locale,
    startedAt: row.createdAt.toISOString(),
    lastActivity: last?.timestamp ?? row.createdAt.toISOString(),
    messages,
    status: row.status as Conversation['status'],
    unreadByGary: row.unreadCount,
  }
}

export async function getOrCreate(sessionId: string, locale = 'en'): Promise<Conversation> {
  const db = await getDb()
  if (!db) {
    if (!memStore.has(sessionId)) {
      memStore.set(sessionId, {
        id: sessionId, sessionId, locale,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messages: [], status: 'active', unreadByGary: 0,
      })
    }
    return memStore.get(sessionId)!
  }

  const row = await db.conversation.upsert({
    where: { sessionId },
    create: { sessionId, locale, status: 'active', unreadCount: 0 },
    update: {},
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  return dbRowToConversation(row)
}

export async function addMessage(
  sessionId: string,
  msg: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<ChatMessage> {
  const db = await getDb()

  if (!db) {
    const convo = memStore.get(sessionId) ?? (await getOrCreate(sessionId))
    const message: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      ...msg,
    }
    convo.messages.push(message)
    convo.lastActivity = message.timestamp
    if (msg.role === 'user') convo.unreadByGary += 1
    return message
  }

  const senderType = msg.role === 'user' ? 'CLIENT' : msg.role === 'gary' ? 'AGENT' : 'AI'

  const conv = await db.conversation.upsert({
    where: { sessionId },
    create: { sessionId, locale: 'en', status: 'active', unreadCount: msg.role === 'user' ? 1 : 0 },
    update: msg.role === 'user' ? { unreadCount: { increment: 1 } } : {},
  })

  const dbMsg = await db.message.create({
    data: { conversationId: conv.id, senderType: senderType as 'CLIENT' | 'AGENT' | 'AI', content: msg.content },
  })

  return { id: dbMsg.id, role: msg.role, content: dbMsg.content, timestamp: dbMsg.createdAt.toISOString() }
}

export async function markReadByGary(sessionId: string): Promise<void> {
  const db = await getDb()
  if (!db) {
    const c = memStore.get(sessionId)
    if (c) c.unreadByGary = 0
    return
  }
  await db.conversation.update({ where: { sessionId }, data: { unreadCount: 0 } })
}

export async function setGaryJoined(sessionId: string, joined: boolean): Promise<void> {
  const db = await getDb()
  if (!db) {
    const c = memStore.get(sessionId)
    if (c) c.status = joined ? 'gary-joined' : 'active'
    return
  }
  await db.conversation.update({ where: { sessionId }, data: { status: joined ? 'gary-joined' : 'active' } })
}

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDb()
  if (!db) {
    return Array.from(memStore.values()).sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )
  }

  const rows = await db.conversation.findMany({
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return rows
    .map(dbRowToConversation)
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}
