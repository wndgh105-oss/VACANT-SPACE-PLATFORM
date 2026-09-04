import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RequestForm } from '@/components/RequestForm'

export const dynamic = 'force-dynamic'

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { quoteId?: string; months?: string }
}) {
  const session = await getServerSession(authOptions)

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, address: true, status: true },
  })
  if (!listing) notFound()

  const quote = searchParams.quoteId
    ? await prisma.quote.findUnique({
        where: { id: searchParams.quoteId },
        select: { id: true, months: true, needCash: true, listingId: true },
      })
    : null

  const validQuote = quote && quote.listingId === listing.id ? quote : null
  const months = validQuote?.months ?? (Number(searchParams.months) || 2)

  const me = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, phone: true },
      })
    : null

  return (
    <div className="vs-container py-6">
      <Link
        href={`/spaces/${listing.id}/quote`}
        className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        ← 견적 다시 만들기
      </Link>
      <h1 className="mt-3 text-[26px] font-bold tracking-tight">상담·예약 요청</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        운영자가 조건을 확인한 뒤 연락드립니다. 이 단계에서는 결제가 발생하지 않습니다.
      </p>

      <RequestForm
        listingId={listing.id}
        quoteId={validQuote?.id ?? null}
        defaultMonths={months}
        defaultName={me?.name ?? ''}
        defaultPhone={me?.phone ?? ''}
        loggedIn={Boolean(session)}
        summary={
          validQuote
            ? {
                needCash: validQuote.needCash,
                months: validQuote.months,
                title: listing.title ?? listing.address,
              }
            : null
        }
      />
    </div>
  )
}
