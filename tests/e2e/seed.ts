import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const TEST_LISTING_ADDRESS = '서울시 마포구 연남동 E2E 테스트 공실'

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@e2e.test' },
    update: {},
    create: { email: 'landlord@e2e.test', passwordHash, name: '건물주테스트', role: 'LANDLORD' },
  })

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@e2e.test' },
    update: {},
    create: { email: 'tenant@e2e.test', passwordHash, name: '창업자테스트', role: 'TENANT' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@e2e.test' },
    update: {},
    create: { email: 'admin@e2e.test', passwordHash, name: '운영자테스트', role: 'ADMIN' },
  })

  await prisma.equipmentPackage.upsert({
    where: { businessType: 'CAFE' },
    update: {},
    create: { businessType: 'CAFE', name: '카페 스타터 패키지', items: ['에스프레소 머신', '냉장고'], monthlyFee: 100000 },
  })

  // Listing has no natural unique key to upsert on, and a previous test run may have
  // left it CLOSED with an existing application (the E2E scenario confirms an
  // application, which auto-closes the listing). Reset any prior E2E listing/
  // application state so this script stays safe to re-run and the test always
  // starts from a clean OPEN listing with no applications.
  const previousListings = await prisma.listing.findMany({
    where: { landlordId: landlord.id, address: TEST_LISTING_ADDRESS },
    select: { id: true },
  })
  const previousListingIds = previousListings.map((l) => l.id)
  if (previousListingIds.length > 0) {
    await prisma.application.deleteMany({ where: { listingId: { in: previousListingIds } } })
    await prisma.favorite.deleteMany({ where: { listingId: { in: previousListingIds } } })
    await prisma.listing.deleteMany({ where: { id: { in: previousListingIds } } })
  }

  await prisma.listing.create({
    data: {
      landlordId: landlord.id,
      address: TEST_LISTING_ADDRESS,
      area: 20,
      monthlyRent: 500000,
      deposit: 1000000,
      photos: [],
      contractDurations: [2, 4],
      businessTypes: ['CAFE'],
      status: 'OPEN',
    },
  })

  console.log('seeded', { landlordId: landlord.id, tenantId: tenant.id })
}

main().finally(() => prisma.$disconnect())
