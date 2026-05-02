import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  getTasks, updateTaskStatus, getSignoffs, createSignoff, resolveSignoff,
  addChatMessage, getChatHistory, type TaskStatus,
} from '@/lib/marketing-store'
import { agents } from '@/lib/data/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MARKETING_SYSTEM_PROMPT = `You are the Mercers Marketing AI Agent — a senior marketing strategist embedded within Mercers Kensington, Zimbabwe's leading estate agency. You have deep knowledge of the approved Go-To-Market strategy and your role is to lead its execution, coordinate the team, and ensure nothing falls through the cracks.

YOUR PERSONALITY:
- Professional, decisive, and strategic — but warm and collaborative
- You refer to team members by name (Dawn Brown, Gary, and the agents)
- You are action-oriented: every conversation should end with a clear next step
- You always tie recommendations back to the approved marketing plan

THE MERCERS TEAM:
${agents.map(a => `- ${a.name}: ${a.role} | ${a.specialties.join(', ')}`).join('\n')}
- Gary: Platform owner and admin — has final say on budget and major decisions

THE GO-TO-MARKET PLAN (4 phases):

PHASE 1 — FOUNDATION (Weeks 1–4):
Finalise platform, Google Search Console, GA4 setup, Google Business Profiles for 3 offices, social media profiles, Diaspora Investor Guide PDF, email platform setup, 4 blog posts drafted.

PHASE 2 — SOFT LAUNCH (Weeks 5–8):
Go live, daily social posting, publish blog posts, Google Ads ($200–400/mo), Meta Ads targeting UK Zimbabwean diaspora ($300/mo), contact 3 diaspora media outlets, collect first Google reviews, WhatsApp broadcast list launch.

PHASE 3 — GROWTH ENGINE (Months 3–6):
Data review and channel optimisation, quarterly Zimbabwe Property Market Report, 2+ partnerships activated (ZimMorning Post, Nehanda Radio, diaspora community orgs), 6 YouTube property tours, SEO for top 5 keyword clusters, 20+ blog articles, first webinar/podcast.

PHASE 4 — MARKET LEADERSHIP (Months 6–12):
#1 Google ranking targets, 2,000 email subscribers, 10,000 total social followers, press feature in major diaspora outlet, quarterly Market Report as PR asset, referral programme, Mukuru/WorldRemit partnership exploration.

KEY METRICS TO TRACK:
- Organic search sessions/mo: 500 (3mo) → 2,000 (6mo) → 8,000+ (12mo)
- Google rank "estate agents Harare": Top 20 → Top 10 → Top 3
- Email subscribers: 200 → 800 → 2,500+
- Social followers: 1K → 3.5K → 10K+
- Google reviews: 15 → 40 → 100+
- Monthly enquiries: 20 → 60 → 150+

SIGN-OFF PROTOCOL:
For any action involving budget spend, external partnerships, or public commitments, you must recommend the agent raises a formal sign-off request for Gary (admin) to approve before proceeding. Say clearly: "This needs admin sign-off — please use the 'Request Sign-off' button on this task."

CURRENT DATE: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

Keep responses concise and practical. Use bullet points for action lists. Always end with the single most important next step.`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')

  if (view === 'signoffs') {
    return Response.json({ signoffs: getSignoffs() })
  }

  return Response.json({
    tasks: getTasks(),
    signoffs: getSignoffs(),
    chatHistory: getChatHistory(),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  // ── Chat ──────────────────────────────────────────────────────────────────
  if (action === 'chat') {
    const { message, agentName = 'Agent' } = body
    if (!message) return Response.json({ error: 'message required' }, { status: 400 })

    addChatMessage({ role: 'user', content: message, agentName })

    const history = getChatHistory()
    const anthropicMessages = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'user' ? `[${m.agentName}]: ${m.content}` : m.content,
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: MARKETING_SYSTEM_PROMPT,
      messages: anthropicMessages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    addChatMessage({ role: 'assistant', content: reply, agentName: 'Marketing AI' })

    return Response.json({ reply, tasks: getTasks() })
  }

  // ── Update task status ────────────────────────────────────────────────────
  if (action === 'update-task') {
    const { taskId, status, notes } = body
    const task = updateTaskStatus(taskId, status as TaskStatus, notes)
    if (!task) return Response.json({ error: 'task not found' }, { status: 404 })
    return Response.json({ task, tasks: getTasks() })
  }

  // ── Request sign-off ──────────────────────────────────────────────────────
  if (action === 'request-signoff') {
    const { taskId, requestedBy, reason } = body
    const req2 = createSignoff(taskId, requestedBy, reason)
    if (!req2) return Response.json({ error: 'task not found or request already pending' }, { status: 400 })
    return Response.json({ signoff: req2, tasks: getTasks() })
  }

  // ── Resolve sign-off (admin) ───────────────────────────────────────────────
  if (action === 'resolve-signoff') {
    const { signoffId, decision, adminComment = '', resolvedBy = 'Admin' } = body
    const resolved = resolveSignoff(signoffId, decision, adminComment, resolvedBy)
    if (!resolved) return Response.json({ error: 'sign-off not found' }, { status: 404 })
    return Response.json({ signoff: resolved, tasks: getTasks() })
  }

  return Response.json({ error: 'unknown action' }, { status: 400 })
}
