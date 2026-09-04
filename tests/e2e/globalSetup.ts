import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedE2E, resetDemoRequests } from './seed'

/**
 * 매 E2E 실행 전에 상태를 초기화한다.
 *
 * - E2E 전용 픽스처(사용자·공실)를 다시 만든다.
 * - 데모 데이터 위에서 도는 시나리오가 409(중복 신청)로 실패하지 않도록
 *   테스트가 만든 요청만 지운다.
 *
 * 이것이 없으면 두 번째 실행부터 "이미 신청함"으로 실패한다.
 */
export default async function globalSetup() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })
  try {
    await seedE2E(prisma)
    await resetDemoRequests(prisma)
  } finally {
    await prisma.$disconnect()
  }
}
