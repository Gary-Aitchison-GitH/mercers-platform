import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig } from 'prisma/config'

// Prisma CLI doesn't auto-load .env.local (that's a Next.js feature).
// Parse it manually so DATABASE_URL_UNPOOLED is available for migrations.
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

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
})
