import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { won } from '@/lib/quote'

export const dynamic = 'force-dynamic'

export default async function PartnerOrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/partner/orders')
  if (session.user.role !== 'PARTNER' && session.user.role !== 'ADMIN') redirect('/')

  // 확정된 신청 중 견적에 장비가 포함된 건 = 배송·설치 대상
  const confirmed = await prisma.application.findMany({
    where: { status: 'CONFIRMED', quote: { isNot: null } },
    orderBy: { desiredStartDate: 'asc' },
    include: {
      listing: { select: { title: true, address: true } },
      quote: {
        include: { lines: { where: { kind: 'ITEM' }, orderBy: { label: 'asc' } } },
      },
    },
  })

  const orders = confirmed.filter((a) => (a.quote?.lines.length ?? 0) > 0)

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">장비 주문</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        계약이 확정된 건의 장비 구성입니다. 실제 발주·배송은 연동되어 있지 않은 데모 화면입니다.
      </p>

      {orders.length === 0 ? (
        <p className="vs-card p-10 text-center text-[14px] text-[var(--ink-muted)]">
          아직 확정된 장비 주문이 없어요. 창업자의 계약이 확정되면 여기에 표시됩니다.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="vs-card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold">{o.listing.title ?? o.listing.address}</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                    {o.applicantName} · 설치 희망일{' '}
                    {o.desiredStartDate.toLocaleDateString('ko-KR')} · {o.desiredDuration}개월
                  </p>
                </div>
                <span className="vs-badge vs-badge-ok">계약 확정</span>
              </div>

              <ul className="mt-4 divide-y divide-[var(--line)] text-[14px]">
                {o.quote!.lines.map((l) => (
                  <li key={l.id} className="flex justify-between py-2">
                    <span>{l.label}</span>
                    <span className="tabular-nums font-semibold">월 {won(l.monthlyFee)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-[15px] font-bold text-[var(--brand)]">
                기간 합계 {won(o.quote!.equipmentTotal)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
