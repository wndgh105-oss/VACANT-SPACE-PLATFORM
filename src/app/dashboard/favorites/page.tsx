import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SpaceCard } from '@/components/SpaceCard'
import { listingCardSelect } from '@/lib/listingSelect'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/dashboard/favorites')

  const favorites = await prisma.favorite.findMany({
    where: { tenantId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { listing: { select: listingCardSelect } },
  })

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">관심 공간</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        저장한 공간 {favorites.length}곳
      </p>

      {favorites.length === 0 ? (
        <div className="vs-card p-10 text-center">
          <p className="text-[17px] font-bold">아직 저장한 공간이 없어요</p>
          <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
            마음에 드는 공간을 저장해 두면 여기서 비교할 수 있어요.
          </p>
          <Link href="/spaces" className="vs-btn vs-btn-primary mt-5">
            공간 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f, i) => (
            <SpaceCard key={f.id} listing={f.listing} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
