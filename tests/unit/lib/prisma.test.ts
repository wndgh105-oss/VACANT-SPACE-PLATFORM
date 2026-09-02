import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('prisma client singleton', () => {
  it('exports a PrismaClient instance with expected models', () => {
    expect(prisma.user).toBeDefined()
    expect(prisma.listing).toBeDefined()
    expect(prisma.application).toBeDefined()
    expect(prisma.equipmentPackage).toBeDefined()
    expect(prisma.favorite).toBeDefined()
  })
})
