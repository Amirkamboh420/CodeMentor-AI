import { PrismaClient } from '@prisma/client'

// Use a per-request singleton via globalThis to avoid exhausting DB
// connections during hot-reload in development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db