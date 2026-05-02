import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

async function createPrismaClient(): Promise<PrismaClient | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { Pool } = await import('pg')
    const { PrismaPg } = await import('@prisma/adapter-pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
  } catch {
    return null
  }
}

let _db: PrismaClient | null | undefined = undefined

export async function getDb(): Promise<PrismaClient | null> {
  if (_db !== undefined) return _db
  if (globalForPrisma.prisma) { _db = globalForPrisma.prisma; return _db }
  _db = await createPrismaClient()
  if (_db && process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
  return _db
}

export const hasDb = () => !!process.env.DATABASE_URL
