export type TaskStatus = 'pending' | 'in-progress' | 'awaiting-signoff' | 'approved' | 'done' | 'blocked'

export interface MarketingTask {
  id: string
  phase: 1 | 2 | 3 | 4
  phaseLabel: string
  title: string
  status: TaskStatus
  assignedTo: string
  notes: string
  updatedAt: string
}

export interface SignoffRequest {
  id: string
  taskId: string
  taskTitle: string
  phase: number
  requestedBy: string
  reason: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment: string
  resolvedAt: string
  resolvedBy: string
}

export interface MarketingChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentName: string
  timestamp: string
}

// ── Seed tasks from the Go-To-Market plan ────────────────────────────────────

const SEED_TASKS: Omit<MarketingTask, 'updatedAt'>[] = [
  // Phase 1 — Foundation
  { id: 'p1-1', phase: 1, phaseLabel: 'Foundation', title: 'Finalise & QA full platform (mobile, WhatsApp chat)', status: 'in-progress', assignedTo: 'All Agents', notes: '' },
  { id: 'p1-2', phase: 1, phaseLabel: 'Foundation', title: 'Submit sitemap to Google Search Console & Bing', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p1-3', phase: 1, phaseLabel: 'Foundation', title: 'Set up GA4 + conversion tracking (enquiry, WhatsApp, listing view)', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p1-4', phase: 1, phaseLabel: 'Foundation', title: 'Claim & optimise Google Business Profiles (3 offices)', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p1-5', phase: 1, phaseLabel: 'Foundation', title: 'Create social profiles: Facebook, Instagram, LinkedIn, YouTube', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p1-6', phase: 1, phaseLabel: 'Foundation', title: 'Produce "Diaspora Investor Guide" PDF lead magnet', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p1-7', phase: 1, phaseLabel: 'Foundation', title: 'Set up email platform (Mailchimp/Loops) with welcome sequence', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p1-8', phase: 1, phaseLabel: 'Foundation', title: 'Draft 4 blog posts: Harare guide, Marondera, investment guide, FAQ', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  // Phase 2 — Soft Launch
  { id: 'p2-1', phase: 2, phaseLabel: 'Soft Launch', title: 'Go live — share across personal networks & WhatsApp groups', status: 'pending', assignedTo: 'All Agents', notes: '' },
  { id: 'p2-2', phase: 2, phaseLabel: 'Soft Launch', title: 'Begin daily social posting cadence (5 posts/week)', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p2-3', phase: 2, phaseLabel: 'Soft Launch', title: 'Publish all 4 blog posts', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p2-4', phase: 2, phaseLabel: 'Soft Launch', title: 'Run Google Ads: brand + "estate agents Harare" ($200–400/mo)', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p2-5', phase: 2, phaseLabel: 'Soft Launch', title: 'Run Meta Ads: UK Zimbabwean diaspora targeting ($300/mo test)', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p2-6', phase: 2, phaseLabel: 'Soft Launch', title: 'Contact 3 diaspora media outlets for coverage', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p2-7', phase: 2, phaseLabel: 'Soft Launch', title: 'Request Google reviews from first clients — target 10 in Month 1', status: 'pending', assignedTo: 'All Agents', notes: '' },
  { id: 'p2-8', phase: 2, phaseLabel: 'Soft Launch', title: 'Launch WhatsApp broadcast list with website opt-in', status: 'pending', assignedTo: 'Gary', notes: '' },
  // Phase 3 — Growth Engine
  { id: 'p3-1', phase: 3, phaseLabel: 'Growth Engine', title: 'Review data — double down on converting channels, cut the rest', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p3-2', phase: 3, phaseLabel: 'Growth Engine', title: 'Publish quarterly Zimbabwe Property Market Report', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p3-3', phase: 3, phaseLabel: 'Growth Engine', title: 'Activate 2+ partnership deals (media + community)', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p3-4', phase: 3, phaseLabel: 'Growth Engine', title: 'YouTube: 6 property tour videos live', status: 'pending', assignedTo: 'All Agents', notes: '' },
  { id: 'p3-5', phase: 3, phaseLabel: 'Growth Engine', title: 'SEO: target first page for top 5 keyword clusters', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p3-6', phase: 3, phaseLabel: 'Growth Engine', title: 'Launch Marketing AI chatbot on website as lead-gen', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p3-7', phase: 3, phaseLabel: 'Growth Engine', title: 'Blog: grow to 20+ articles targeting keyword clusters', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p3-8', phase: 3, phaseLabel: 'Growth Engine', title: 'First agent podcast/webinar: "Investing in Zimbabwe 2026"', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  // Phase 4 — Market Leadership
  { id: 'p4-1', phase: 4, phaseLabel: 'Market Leadership', title: 'Target #1 Google: "estate agents Harare" + "property for sale Zimbabwe"', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p4-2', phase: 4, phaseLabel: 'Market Leadership', title: 'Email list: 2,000 qualified subscribers, 30%+ open rate', status: 'pending', assignedTo: 'Gary', notes: '' },
  { id: 'p4-3', phase: 4, phaseLabel: 'Market Leadership', title: 'Social: 5K Facebook, 2K Instagram, 1K LinkedIn followers', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p4-4', phase: 4, phaseLabel: 'Market Leadership', title: 'Press feature in ZimMorning Post or Nehanda Radio', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p4-5', phase: 4, phaseLabel: 'Market Leadership', title: 'Launch Mercers Market Report as quarterly press release', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
  { id: 'p4-6', phase: 4, phaseLabel: 'Market Leadership', title: 'Launch referral programme — reward clients for introductions', status: 'pending', assignedTo: 'All Agents', notes: '' },
  { id: 'p4-7', phase: 4, phaseLabel: 'Market Leadership', title: 'Explore paid partnership with Mukuru / WorldRemit', status: 'pending', assignedTo: 'Dawn Brown', notes: '' },
]

// ── In-memory stores ──────────────────────────────────────────────────────────

const now = () => new Date().toISOString()

let tasks: MarketingTask[] = SEED_TASKS.map(t => ({ ...t, updatedAt: now() }))
let signoffs: SignoffRequest[] = []
const chatHistory: MarketingChatMessage[] = []

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function getTasks(): MarketingTask[] {
  return tasks
}

export function updateTaskStatus(id: string, status: TaskStatus, notes = ''): MarketingTask | null {
  const task = tasks.find(t => t.id === id)
  if (!task) return null
  task.status = status
  if (notes) task.notes = notes
  task.updatedAt = now()
  return task
}

// ── Sign-off requests ─────────────────────────────────────────────────────────

export function getSignoffs(): SignoffRequest[] {
  return signoffs.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
}

export function createSignoff(
  taskId: string,
  requestedBy: string,
  reason: string
): SignoffRequest | null {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return null
  const existing = signoffs.find(s => s.taskId === taskId && s.status === 'pending')
  if (existing) return existing
  const req: SignoffRequest = {
    id: Math.random().toString(36).slice(2),
    taskId,
    taskTitle: task.title,
    phase: task.phase,
    requestedBy,
    reason,
    requestedAt: now(),
    status: 'pending',
    adminComment: '',
    resolvedAt: '',
    resolvedBy: '',
  }
  signoffs.push(req)
  updateTaskStatus(taskId, 'awaiting-signoff')
  return req
}

export function resolveSignoff(
  id: string,
  decision: 'approved' | 'rejected',
  adminComment: string,
  resolvedBy: string
): SignoffRequest | null {
  const req = signoffs.find(s => s.id === id)
  if (!req) return null
  req.status = decision
  req.adminComment = adminComment
  req.resolvedAt = now()
  req.resolvedBy = resolvedBy
  updateTaskStatus(req.taskId, decision === 'approved' ? 'approved' : 'pending')
  return req
}

// ── Chat history ──────────────────────────────────────────────────────────────

export function getChatHistory(): MarketingChatMessage[] {
  return chatHistory
}

export function addChatMessage(msg: Omit<MarketingChatMessage, 'id' | 'timestamp'>): MarketingChatMessage {
  const m: MarketingChatMessage = {
    id: Math.random().toString(36).slice(2),
    timestamp: now(),
    ...msg,
  }
  chatHistory.push(m)
  return m
}
