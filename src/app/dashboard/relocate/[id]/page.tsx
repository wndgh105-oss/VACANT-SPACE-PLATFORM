import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TeaserEditor } from '@/components/TeaserEditor'

export const dynamic = 'force-dynamic'

export default async function RelocatePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=/dashboard/relocate/${params.id}`)

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { address: true, title: true } },
      teaser: { select: { slug: true } },
    },
  })

  if (!tenancy) notFound()
  if (tenancy.tenantId !== session.user.id) redirect('/dashboard')
  if (tenancy.teaser) redirect(`/t/${tenancy.teaser.slug}`)

  return (
    <div className="vs-container py-8">
      <Link href="/dashboard" className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)]">
        ← 내 창업 현황으로
      </Link>
      <h1 className="mt-3 text-[28px] font-bold tracking-tight">이전 소식 만들기</h1>
      <p className="mb-6 mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
        자리를 옮기면 단골이 끊기는 게 가장 큰 손해입니다. 새 주소를 바로 알리는 대신, 단골이 직접
        찾아오게 만드는 힌트 페이지를 만들어 SNS에 공유해 보세요.
      </p>

      <TeaserEditor
        tenancyId={tenancy.id}
        defaultStoreName={tenancy.storeName ?? ''}
        fromAddress={tenancy.listing.address}
      />
    </div>
  )
}
