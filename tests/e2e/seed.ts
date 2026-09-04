import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const TEST_LISTING_ADDRESS = '서울시 마포구 연남동 E2E 테스트 공실'

/**
 * E2E 픽스처를 초기화한다.
 *
 * `npm run seed:e2e` 로 직접 실행할 수도 있고,
 * Playwright globalSetup 에서 호출되기도 한다(매 실행 전 자동 초기화).
 */
export async function seedE2E(prisma: PrismaClient) {
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
    create: {
      businessType: 'CAFE',
      name: '카페 스타터 패키지',
      items: ['에스프레소 머신', '냉장고'],
      monthlyFee: 100000,
    },
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
    await prisma.tenancy.deleteMany({ where: { listingId: { in: previousListingIds } } })
    await prisma.application.deleteMany({ where: { listingId: { in: previousListingIds } } })
    await prisma.favorite.deleteMany({ where: { listingId: { in: previousListingIds } } })
    await prisma.quote.deleteMany({ where: { listingId: { in: previousListingIds } } })
    await prisma.listing.deleteMany({ where: { id: { in: previousListingIds } } })
  }

  await prisma.listing.create({
    data: {
      landlordId: landlord.id,
      address: TEST_LISTING_ADDRESS,
      region: '연남동',
      area: 20,
      monthlyRent: 500000,
      deposit: 1000000,
      photos: [],
      contractDurations: [2, 4],
      businessTypes: ['CAFE'],
      status: 'OPEN',
    },
  })

  return { landlordId: landlord.id, tenantId: tenant.id }
}

/**
 * 데모 시드 데이터 위에서 도는 시나리오가 재실행 가능하도록,
 * 테스트가 만들어 둔 요청만 지운다. (대시보드 데모용 연남동 요청은 남긴다)
 */
export async function resetDemoRequests(prisma: PrismaClient) {
  const tenant = await prisma.user.findUnique({ where: { email: 'tenant@demo.kr' } })
  if (!tenant) return

  const targets = await prisma.listing.findMany({
    where: { OR: [{ address: { contains: '망원동' } }, { title: { contains: '연무장길' } }] },
    select: { id: true },
  })
  const ids = targets.map((t) => t.id)
  if (ids.length === 0) return

  await prisma.application.deleteMany({ where: { tenantId: tenant.id, listingId: { in: ids } } })
  await prisma.listing.updateMany({
    where: { id: { in: ids }, status: 'CLOSED' },
    data: { status: 'OPEN' },
  })
}

async function runAsScript() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })
  try {
    const result = await seedE2E(prisma)
    await resetDemoRequests(prisma)
    console.log('seeded', result)
  } finally {
    await prisma.$disconnect()
  }
}

// `tsx tests/e2e/seed.ts` 로 직접 실행했을 때만 동작한다.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('tests/e2e/seed.ts')) {
  void runAsScript()
}
