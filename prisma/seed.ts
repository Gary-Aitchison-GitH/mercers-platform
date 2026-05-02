import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local — Prisma CLI and ts-node don't pick it up automatically
const envLocalPath = resolve(process.cwd(), '.env.local')
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

const agentData = [
  {
    id: 'agent-1',
    name: 'Senior Agent — Harare',
    role: 'Principal Agent',
    email: 'harare@mercers.co.zw',
    phone: '+263 4 XXX XXXX',
    bio: 'Senior property specialist with extensive knowledge of the Harare commercial and industrial market.',
    regionalPresence: ['Harare', 'Nationwide'],
    specialties: ['Commercial', 'Industrial', 'Agricultural'],
    image: '/images/agent-harare-1.jpg',
  },
  {
    id: 'agent-2',
    name: 'Commercial Specialist — Harare',
    role: 'Commercial Agent',
    email: 'commercial@mercers.co.zw',
    phone: '+263 4 XXX XXXX',
    bio: "Dedicated commercial property agent with expertise in the Victoria Falls tourism and hospitality sector.",
    regionalPresence: ['Victoria Falls', 'Matabeleland', 'Nationwide'],
    specialties: ['Commercial', 'Tourism', 'Hospitality'],
    image: '/images/agent-harare-2.jpg',
  },
  {
    id: 'agent-3',
    name: 'Industrial Specialist — Marondera',
    role: 'Industrial Agent',
    email: 'industrial@mercers.co.zw',
    phone: '+263 79 XXX XXXX',
    bio: "Industrial property expert covering Marondera, Zvishavane and Chiredzi.",
    regionalPresence: ['Marondera', 'Zvishavane', 'Chiredzi'],
    specialties: ['Industrial', 'Warehousing', 'Commercial'],
    image: '/images/agent-marondera-1.jpg',
  },
  {
    id: 'agent-4',
    name: 'Dawn Brown',
    role: 'Senior Property Consultant',
    email: 'dawn@mercers.co.zw',
    phone: '+263 79 XXX XXXX',
    bio: 'Senior property consultant with a wealth of local knowledge across Mashonaland East and Harare.',
    regionalPresence: ['Mashonaland East', 'Harare', 'Nationwide'],
    specialties: ['Residential', 'Commercial', 'Agricultural'],
    image: '/images/dawn-brown.jpg',
  },
]

async function main() {
  console.log('Seeding database...')

  for (const agent of agentData) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: agent,
      create: agent,
    })
  }

  console.log(`Seeded ${agentData.length} agents.`)
  console.log('Done. Add listings via the admin panel.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
