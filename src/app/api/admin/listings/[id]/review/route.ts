import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

/** 현장 실사 결과 반영: PENDING_REVIEW → OPEN (승인) 또는 CLOSED (반려) */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { approve } = (await request.json().catch(() => ({}))) as { approve?: boolean }
  if (typeof approve !== 'boolean') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (listing.status !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'not_pending' }, { status: 409 })
  }

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { status: approve ? 'OPEN' : 'CLOSED' },
  })

  await notify(
    listing.landlordId,
    approve ? '공실이 실사를 통과했어요' : '공실 등록이 반려됐어요',
    approve
      ? `"${listing.title ?? listing.address}"이(가) 실사를 통과해 공개됐습니다.`
      : `"${listing.title ?? listing.address}"은(는) 실사 결과 등록이 반려됐습니다.`,
    '/landlord'
  )

  return NextResponse.json(updated)
}
