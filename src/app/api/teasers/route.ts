import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  tenancyId: z.string().min(1),
  storeName: z.string().min(1).max(40),
  toRegionHint: z.string().min(1).max(80),
  hintRadiusM: z.number().int().min(100).max(3000),
  openDate: z.string().min(1),
  message: z.string().max(300).optional(),
  hints: z
    .array(z.object({ text: z.string().min(1).max(120), emoji: z.string().max(4) }))
    .min(1)
    .max(5),
  publish: z.boolean().default(true),
})

/** 한글 상호명도 안전하게 URL에 쓰이도록 슬러그를 만든다. */
function makeSlug(storeName: string): string {
  const base = storeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
  const ascii = /^[a-z0-9-]+$/.test(base) ? base : 'move'
  return `${ascii}-${Math.random().toString(36).slice(2, 7)}`
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: data.tenancyId },
    include: { listing: { select: { address: true, lat: true, lng: true } }, teaser: true },
  })
  if (!tenancy) return NextResponse.json({ error: 'tenancy_not_found' }, { status: 404 })
  if (tenancy.tenantId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (tenancy.teaser) {
    return NextResponse.json({ error: 'already_exists', slug: tenancy.teaser.slug }, { status: 409 })
  }

  const teaser = await prisma.relocationTeaser.create({
    data: {
      tenancyId: tenancy.id,
      slug: makeSlug(data.storeName),
      storeName: data.storeName,
      fromAddress: tenancy.listing.address,
      toRegionHint: data.toRegionHint,
      hintRadiusM: data.hintRadiusM,
      toLat: tenancy.listing.lat,
      toLng: tenancy.listing.lng,
      openDate: new Date(data.openDate),
      message: data.message ?? null,
      published: data.publish,
      hints: {
        create: data.hints.map((h, i) => ({ text: h.text, emoji: h.emoji || '📍', sortOrder: i })),
      },
    },
    select: { id: true, slug: true },
  })

  await prisma.tenancy.update({
    where: { id: tenancy.id },
    data: { status: 'RELOCATED' },
  })

  return NextResponse.json(teaser, { status: 201 })
}
