import 'dotenv/config'
import { PrismaClient, BusinessType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

/**
 * 데모용 시드.
 *
 * 여기 들어가는 공간·상권 요약·장비 가격은 모두 **가상의 예시 데이터**이며
 * 실제 매물·실제 시세·실제 파트너 견적이 아닙니다.
 * 실행: npm run seed
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEMO_PASSWORD = 'demo1234'

type SeedListing = {
  key: string
  title: string
  address: string
  region: string
  lat: number
  lng: number
  area: number
  monthlyRent: number
  deposit: number
  maintenanceFee: number
  contractDurations: number[]
  businessTypes: BusinessType[]
  recommendedTypes: BusinessType[]
  parking: boolean
  powerKw: number
  hasGas: boolean
  hasDrain: boolean
  immediateMoveIn: boolean
  areaSummary: string
  description: string
}

const LISTINGS: SeedListing[] = [
  {
    key: 'seongsu-1',
    title: '연무장길 코너 1층 · 통유리 카페 자리',
    address: '서울 성동구 성수동2가 연무장길 인근',
    region: '성수동',
    lat: 37.5445,
    lng: 127.0557,
    area: 12,
    monthlyRent: 1_500_000,
    deposit: 1_500_000,
    maintenanceFee: 120_000,
    contractDurations: [1, 2, 3, 6],
    businessTypes: ['CAFE', 'RETAIL'],
    recommendedTypes: ['CAFE'],
    parking: false,
    powerKw: 10,
    hasGas: true,
    hasDrain: true,
    immediateMoveIn: true,
    areaSummary:
      '주말 유동인구가 평일의 2배 수준으로 잡히는 팝업 밀집 구역입니다. 20~30대 여성 방문 비중이 높고, 인근 300m 안에 디저트 카페가 7곳 있어 경쟁은 높지만 집객은 쉽습니다.',
    description:
      '전면 통유리라 외부 노출이 좋습니다. 직전 임차인이 카페로 운영해 급배수·환기 라인이 남아 있어 초기 시공을 줄일 수 있습니다.',
  },
  {
    key: 'seongsu-2',
    title: '성수역 3번 출구 뒤 · 소형 팝업 박스',
    address: '서울 성동구 성수동1가 뚝섬로 인근',
    region: '성수동',
    lat: 37.5447,
    lng: 127.0559,
    area: 8,
    monthlyRent: 2_200_000,
    deposit: 2_200_000,
    maintenanceFee: 150_000,
    contractDurations: [1, 2],
    businessTypes: ['RETAIL'],
    recommendedTypes: ['RETAIL'],
    parking: false,
    powerKw: 8,
    hasGas: false,
    hasDrain: false,
    immediateMoveIn: true,
    areaSummary:
      '브랜드 팝업이 반복적으로 열리는 자리입니다. 평일 저녁·주말 집중형이며, 체류시간보다 진입률이 높은 상권입니다.',
    description: '천장 노출 마감으로 별도 인테리어 없이 사이니지만 붙여도 어울립니다.',
  },
  {
    key: 'yeonnam-1',
    title: '연남동 경의선숲길 · 골목 안쪽 1층',
    address: '서울 마포구 연남동 동교로 인근',
    region: '연남동',
    lat: 37.5626,
    lng: 126.9256,
    area: 15,
    monthlyRent: 1_350_000,
    deposit: 1_350_000,
    maintenanceFee: 100_000,
    contractDurations: [2, 3, 6],
    businessTypes: ['CAFE', 'RETAIL', 'STUDY'],
    recommendedTypes: ['CAFE'],
    parking: false,
    powerKw: 8,
    hasGas: true,
    hasDrain: true,
    immediateMoveIn: false,
    areaSummary:
      '숲길 산책 동선에서 한 블록 안쪽이라 임대료가 대로변 대비 낮습니다. 재방문율이 높은 동네 상권 성격이 강합니다.',
    description: '소규모 로스터리나 디저트 매장에 적합한 규모입니다. 입주 가능일은 협의 필요합니다.',
  },
  {
    key: 'mangwon-1',
    title: '망원시장 초입 · 테이크아웃형 소형 점포',
    address: '서울 마포구 망원동 포은로 인근',
    region: '망원동',
    lat: 37.5556,
    lng: 126.9018,
    area: 6,
    monthlyRent: 900_000,
    deposit: 900_000,
    maintenanceFee: 60_000,
    contractDurations: [1, 2, 3],
    businessTypes: ['CAFE', 'RETAIL'],
    recommendedTypes: ['CAFE'],
    parking: false,
    powerKw: 6,
    hasGas: false,
    hasDrain: true,
    immediateMoveIn: true,
    areaSummary:
      '시장 유입 동선의 시작 지점입니다. 객단가는 낮지만 회전이 빠르고, 테이크아웃 중심 업종의 진입 장벽이 낮습니다.',
    description: '좌석을 두기엔 좁고, 테이크아웃 창구형 운영에 맞습니다.',
  },
  {
    key: 'euljiro-1',
    title: '을지로3가 인쇄골목 · 2층 작업실형 공간',
    address: '서울 중구 을지로3가 충무로 인근',
    region: '을지로',
    lat: 37.566,
    lng: 126.991,
    area: 22,
    monthlyRent: 1_100_000,
    deposit: 1_100_000,
    maintenanceFee: 90_000,
    contractDurations: [2, 3, 6],
    businessTypes: ['OFFICE', 'STUDY', 'RETAIL'],
    recommendedTypes: ['OFFICE'],
    parking: false,
    powerKw: 12,
    hasGas: false,
    hasDrain: false,
    immediateMoveIn: true,
    areaSummary:
      '낮에는 업무 인구, 밤에는 술집 상권으로 성격이 바뀝니다. 2층이라 간판 노출은 약하지만 면적 대비 임대료가 저렴합니다.',
    description: '창이 커서 작업실·소규모 사무실로 인기가 있는 유형입니다.',
  },
  {
    key: 'sangsu-1',
    title: '상수역 인근 · 스터디룸 전환 가능 공간',
    address: '서울 마포구 상수동 와우산로 인근',
    region: '상수동',
    lat: 37.5479,
    lng: 126.9227,
    area: 18,
    monthlyRent: 1_000_000,
    deposit: 1_000_000,
    maintenanceFee: 80_000,
    contractDurations: [2, 3, 6],
    businessTypes: ['STUDY', 'OFFICE'],
    recommendedTypes: ['STUDY'],
    parking: false,
    powerKw: 8,
    hasGas: false,
    hasDrain: false,
    immediateMoveIn: true,
    areaSummary: '대학가 배후 수요가 있어 시험 기간 전후 수요 편차가 큽니다.',
    description: '칸막이 설치 흔적이 남아 있어 스터디룸 전환 비용이 적습니다.',
  },
  {
    key: 'mullae-1',
    title: '문래창작촌 · 철공소 사이 쇼룸형 1층',
    address: '서울 영등포구 문래동3가 도림로 인근',
    region: '문래동',
    lat: 37.5175,
    lng: 126.8946,
    area: 20,
    monthlyRent: 800_000,
    deposit: 800_000,
    maintenanceFee: 50_000,
    contractDurations: [2, 3, 6],
    businessTypes: ['RETAIL', 'CAFE', 'OFFICE'],
    recommendedTypes: ['RETAIL'],
    parking: true,
    powerKw: 15,
    hasGas: false,
    hasDrain: true,
    immediateMoveIn: true,
    areaSummary:
      '주중 낮 유동인구는 적지만 주말 방문 목적형 상권입니다. 임대료가 낮아 실험적 업종의 실패 비용이 작습니다.',
    description: '층고가 높아 전시·쇼룸 활용에 유리합니다. 하역 공간이 있습니다.',
  },
  {
    key: 'haebangchon-1',
    title: '해방촌 신흥로 · 뷰 좋은 소형 카페 자리',
    address: '서울 용산구 용산동2가 신흥로 인근',
    region: '해방촌',
    lat: 37.545,
    lng: 126.983,
    area: 10,
    monthlyRent: 1_200_000,
    deposit: 1_200_000,
    maintenanceFee: 70_000,
    contractDurations: [1, 2, 3],
    businessTypes: ['CAFE'],
    recommendedTypes: ['CAFE'],
    parking: false,
    powerKw: 8,
    hasGas: true,
    hasDrain: true,
    immediateMoveIn: false,
    areaSummary: '경사 지형으로 도보 접근성이 낮은 대신 목적 방문 비중이 높습니다.',
    description: '창가 좌석에서 남산 방향 조망이 나옵니다.',
  },
  {
    key: 'changsin-1',
    title: '창신동 봉제거리 · 넓은 반지하 작업 공간',
    address: '서울 종로구 창신동 지봉로 인근',
    region: '창신동',
    lat: 37.5762,
    lng: 127.0106,
    area: 30,
    monthlyRent: 700_000,
    deposit: 700_000,
    maintenanceFee: 40_000,
    contractDurations: [3, 6],
    businessTypes: ['OFFICE', 'OTHER'],
    recommendedTypes: ['OFFICE'],
    parking: false,
    powerKw: 20,
    hasGas: false,
    hasDrain: true,
    immediateMoveIn: true,
    areaSummary: '제조·봉제 인프라가 밀집해 소규모 생산형 사업에 유리합니다.',
    description: '면적 대비 임대료가 가장 낮은 매물입니다. 채광은 약합니다.',
  },
  {
    key: 'seongsu-3',
    title: '성수동 골목 · 2개월 단기 전용 소형 매장',
    address: '서울 성동구 성수동2가 아차산로 인근',
    region: '성수동',
    lat: 37.5432,
    lng: 127.0571,
    area: 9,
    monthlyRent: 1_300_000,
    deposit: 1_300_000,
    maintenanceFee: 100_000,
    contractDurations: [1, 2],
    businessTypes: ['CAFE', 'RETAIL'],
    recommendedTypes: ['RETAIL'],
    parking: false,
    powerKw: 8,
    hasGas: false,
    hasDrain: true,
    immediateMoveIn: true,
    areaSummary: '메인 골목에서 한 블록 벗어나 임대료가 낮고 실험적 업종이 많습니다.',
    description: '건물주가 2개월 단위 계약을 우선한다고 밝힌 매물입니다.',
  },
  {
    key: 'yeonnam-2',
    title: '연남동 대로변 · 사무실 전환형 2층',
    address: '서울 마포구 연남동 성미산로 인근',
    region: '연남동',
    lat: 37.5639,
    lng: 126.9243,
    area: 25,
    monthlyRent: 1_600_000,
    deposit: 1_600_000,
    maintenanceFee: 130_000,
    contractDurations: [3, 6],
    businessTypes: ['OFFICE', 'STUDY'],
    recommendedTypes: ['OFFICE'],
    parking: true,
    powerKw: 12,
    hasGas: false,
    hasDrain: false,
    immediateMoveIn: false,
    areaSummary: '주거와 상업이 섞여 있어 소규모 팀 사무실 수요가 꾸준합니다.',
    description: '엘리베이터는 없으나 계단 폭이 넓습니다.',
  },
  {
    key: 'mangwon-2',
    title: '망원 주택가 · 조용한 1층 스터디 공간',
    address: '서울 마포구 망원동 월드컵로 인근',
    region: '망원동',
    lat: 37.5566,
    lng: 126.9051,
    area: 16,
    monthlyRent: 950_000,
    deposit: 950_000,
    maintenanceFee: 70_000,
    contractDurations: [2, 3, 6],
    businessTypes: ['STUDY', 'OFFICE'],
    recommendedTypes: ['STUDY'],
    parking: false,
    powerKw: 6,
    hasGas: false,
    hasDrain: false,
    immediateMoveIn: true,
    areaSummary: '배후 주거 수요 중심이며 야간 소음 민원 가능성이 낮은 편입니다.',
    description: '내부가 이미 화이트 도장 상태라 추가 시공 없이 사용 가능합니다.',
  },
]

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const [tenant, landlord, partner, admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'tenant@demo.kr' },
      update: { verified: true, phone: '010-1234-5678' },
      create: {
        email: 'tenant@demo.kr',
        passwordHash,
        name: '김도현',
        role: 'TENANT',
        phone: '010-1234-5678',
        verified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'landlord@demo.kr' },
      update: { verified: true },
      create: {
        email: 'landlord@demo.kr',
        passwordHash,
        name: '박정숙',
        role: 'LANDLORD',
        phone: '010-2222-3333',
        verified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'partner@demo.kr' },
      update: { verified: true, companyName: '한빛상업장비렌탈' },
      create: {
        email: 'partner@demo.kr',
        passwordHash,
        name: '이상우',
        role: 'PARTNER',
        companyName: '한빛상업장비렌탈',
        phone: '02-555-0100',
        verified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@demo.kr' },
      update: { verified: true },
      create: {
        email: 'admin@demo.kr',
        passwordHash,
        name: '운영자',
        role: 'ADMIN',
        verified: true,
      },
    }),
  ])

  // ── 장비 패키지 ────────────────────────────────────────────────
  const packages: Array<{
    businessType: BusinessType
    name: string
    description: string
    items: Array<{ name: string; monthlyFee: number; optional: boolean }>
  }> = [
    {
      businessType: 'CAFE',
      name: '카페 스타터',
      description: '12평 내외 소형 카페를 바로 열 수 있는 최소 구성입니다.',
      items: [
        { name: '반자동 에스프레소 머신 (2그룹)', monthlyFee: 180_000, optional: false },
        { name: '원두 그라인더', monthlyFee: 45_000, optional: false },
        { name: '언더카운터 냉장고', monthlyFee: 60_000, optional: false },
        { name: '제빙기', monthlyFee: 70_000, optional: true },
        { name: 'POS 단말 + 카드리더', monthlyFee: 35_000, optional: false },
        { name: '2인 테이블 4세트 + 의자 8개', monthlyFee: 120_000, optional: true },
        { name: '온수기·정수 필터', monthlyFee: 40_000, optional: true },
        { name: '기본 조명 세트', monthlyFee: 100_000, optional: true },
      ],
    },
    {
      businessType: 'RETAIL',
      name: '팝업스토어 스타터',
      description: '2~4주 단기 팝업에 필요한 진열·결제 구성입니다.',
      items: [
        { name: '모듈형 진열 선반 3조', monthlyFee: 120_000, optional: false },
        { name: '행거·집기 세트', monthlyFee: 70_000, optional: true },
        { name: '트랙 조명 6구', monthlyFee: 90_000, optional: false },
        { name: 'POS 단말 + 카드리더', monthlyFee: 35_000, optional: false },
        { name: '사이니지 스탠드 2개', monthlyFee: 60_000, optional: true },
        { name: '피팅룸 파티션', monthlyFee: 55_000, optional: true },
      ],
    },
    {
      businessType: 'OFFICE',
      name: '소형 사무실 스타터',
      description: '4인 팀이 바로 업무를 시작할 수 있는 구성입니다.',
      items: [
        { name: '사무 책상 4 + 의자 4', monthlyFee: 90_000, optional: false },
        { name: '복합기 (임대·토너 포함)', monthlyFee: 45_000, optional: false },
        { name: '회의용 모니터 43인치', monthlyFee: 40_000, optional: true },
        { name: '공유기·인터넷 회선 설치', monthlyFee: 35_000, optional: false },
        { name: '수납 캐비닛 2개', monthlyFee: 25_000, optional: true },
      ],
    },
    {
      businessType: 'STUDY',
      name: '스터디룸 스타터',
      description: '소규모 스터디·모임 공간 운영을 위한 구성입니다.',
      items: [
        { name: '6인 회의 테이블 + 의자 6', monthlyFee: 80_000, optional: false },
        { name: '화이트보드 + 프로젝터', monthlyFee: 60_000, optional: false },
        { name: '무인 출입 도어락', monthlyFee: 30_000, optional: false },
        { name: '공기청정기 2대', monthlyFee: 30_000, optional: true },
        { name: '정수기', monthlyFee: 25_000, optional: true },
      ],
    },
  ]

  for (const p of packages) {
    const monthlyFee = p.items.reduce((s, i) => s + i.monthlyFee, 0)
    const pkg = await prisma.equipmentPackage.upsert({
      where: { businessType: p.businessType },
      update: {
        name: p.name,
        description: p.description,
        monthlyFee,
        items: p.items.map((i) => i.name),
        partnerId: partner.id,
        active: true,
      },
      create: {
        businessType: p.businessType,
        name: p.name,
        description: p.description,
        monthlyFee,
        items: p.items.map((i) => i.name),
        partnerId: partner.id,
      },
    })
    await prisma.equipmentItem.deleteMany({ where: { packageId: pkg.id } })
    await prisma.equipmentItem.createMany({
      data: p.items.map((i, idx) => ({
        packageId: pkg.id,
        name: i.name,
        monthlyFee: i.monthlyFee,
        optional: i.optional,
        sortOrder: idx,
      })),
    })
  }

  // ── 공간 ──────────────────────────────────────────────────────
  const createdListings: Record<string, string> = {}
  for (const l of LISTINGS) {
    const existing = await prisma.listing.findFirst({
      where: { landlordId: landlord.id, address: l.address, title: l.title },
      select: { id: true },
    })
    const data = {
      landlordId: landlord.id,
      title: l.title,
      address: l.address,
      region: l.region,
      lat: l.lat,
      lng: l.lng,
      area: l.area,
      monthlyRent: l.monthlyRent,
      deposit: l.deposit,
      maintenanceFee: l.maintenanceFee,
      photos: [`/api/placeholder/${l.key}-a`, `/api/placeholder/${l.key}-b`, `/api/placeholder/${l.key}-c`],
      contractDurations: l.contractDurations,
      businessTypes: l.businessTypes,
      recommendedTypes: l.recommendedTypes,
      parking: l.parking,
      powerKw: l.powerKw,
      hasGas: l.hasGas,
      hasDrain: l.hasDrain,
      immediateMoveIn: l.immediateMoveIn,
      areaSummary: l.areaSummary,
      description: l.description,
      status: 'OPEN' as const,
    }
    const row = existing
      ? await prisma.listing.update({ where: { id: existing.id }, data })
      : await prisma.listing.create({ data })
    createdListings[l.key] = row.id
  }

  // 실사 대기 매물 1건 (관리자 화면 데모용)
  const pendingExists = await prisma.listing.findFirst({
    where: { landlordId: landlord.id, status: 'PENDING_REVIEW' },
  })
  if (!pendingExists) {
    await prisma.listing.create({
      data: {
        landlordId: landlord.id,
        title: '합정역 인근 · 신규 등록 (실사 대기)',
        address: '서울 마포구 합정동 양화로 인근',
        region: '합정동',
        lat: 37.5495,
        lng: 126.9137,
        area: 14,
        monthlyRent: 1_400_000,
        deposit: 1_400_000,
        maintenanceFee: 100_000,
        photos: [`/api/placeholder/hapjeong-a`],
        contractDurations: [2, 3],
        businessTypes: ['CAFE', 'RETAIL'],
        recommendedTypes: ['CAFE'],
        powerKw: 8,
        hasGas: true,
        hasDrain: true,
        areaSummary: '현장 실사 전이라 상권 정보가 확인되지 않았습니다.',
        status: 'PENDING_REVIEW',
      },
    })
  }

  // ── 운영 중 계약 + 이전 티저 (창업자 대시보드/티저 데모용) ──────
  const seongsuId = createdListings['seongsu-1']
  let tenancy = await prisma.tenancy.findFirst({
    where: { tenantId: tenant.id, listingId: seongsuId },
  })
  if (!tenancy) {
    const start = new Date()
    start.setDate(start.getDate() - 41)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 2)
    tenancy = await prisma.tenancy.create({
      data: {
        listingId: seongsuId,
        tenantId: tenant.id,
        storeName: '두달커피',
        startDate: start,
        endDate: end,
        monthlyTotal: 2_170_000,
        status: 'ACTIVE',
      },
    })
  }

  const teaserExists = await prisma.relocationTeaser.findUnique({
    where: { tenancyId: tenancy.id },
  })
  if (!teaserExists) {
    const openDate = new Date()
    openDate.setDate(openDate.getDate() + 12)
    const teaser = await prisma.relocationTeaser.create({
      data: {
        tenancyId: tenancy.id,
        slug: 'dudal-coffee',
        storeName: '두달커피',
        fromAddress: '서울 성동구 성수동2가 연무장길 인근',
        toRegionHint: '성수동에서 걸어서 갈 수 있는 거리',
        hintRadiusM: 500,
        toLat: 37.5462,
        toLng: 127.0592,
        openDate,
        message: '두 달 동안 찾아와 주셔서 고마웠어요. 조금 더 넓은 자리로 옮깁니다.',
        published: true,
        views: 328,
      },
    })
    await prisma.teaserHint.createMany({
      data: [
        { teaserId: teaser.id, text: '아직 성수동을 벗어나지 않았어요.', emoji: '📍', sortOrder: 0 },
        { teaserId: teaser.id, text: '전에 있던 자리에서 커피 한 잔 식기 전에 도착할 수 있어요.', emoji: '☕', sortOrder: 1 },
        { teaserId: teaser.id, text: '이번엔 창가 자리가 네 배로 늘었습니다.', emoji: '🪟', sortOrder: 2 },
      ],
    })
  }

  // ── 진행 중 신청 1건 (건물주/관리자 화면 데모용) ────────────────
  const appExists = await prisma.application.findFirst({
    where: { tenantId: tenant.id, listingId: createdListings['yeonnam-1'] },
  })
  if (!appExists) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 20)
    await prisma.application.create({
      data: {
        listingId: createdListings['yeonnam-1'],
        tenantId: tenant.id,
        applicantName: '김도현',
        phone: '010-1234-5678',
        desiredDuration: 2,
        desiredStartDate: startDate,
        message: '두달커피 이전 자리로 검토 중입니다. 급배수 상태를 현장에서 확인하고 싶습니다.',
        status: 'CONTACTING',
      },
    })
  }

  console.log('seed 완료')
  console.log('  창업자    tenant@demo.kr   /', DEMO_PASSWORD)
  console.log('  건물주    landlord@demo.kr /', DEMO_PASSWORD)
  console.log('  장비파트너 partner@demo.kr  /', DEMO_PASSWORD)
  console.log('  운영자    admin@demo.kr    /', DEMO_PASSWORD)
  console.log('  공간', LISTINGS.length, '건 · 장비 패키지', packages.length, '종')
  console.log('  이전 티저: /t/dudal-coffee')
  void admin
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
