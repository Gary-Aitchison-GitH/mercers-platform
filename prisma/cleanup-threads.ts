import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

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

async function main() {
  const threadCount = await prisma.thread.count()
  console.log(`Found ${threadCount} thread(s) to delete.`)

  if (threadCount === 0) {
    console.log('Nothing to delete.')
    return
  }

  // Cascade deletes handle ThreadParticipant, ThreadMessage, Milestone automatically
  const result = await prisma.thread.deleteMany({})
  console.log(`Deleted ${result.count} thread(s) and all related messages, participants, and milestones.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
