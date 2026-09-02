'use client'

import { useEffect, useState } from 'react'
import { ListingCard, ListingCardData } from '@/components/ListingCard'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<{ id: string; listing: ListingCardData }[]>([])

  useEffect(() => {
    fetch('/api/favorites')
      .then((res) => res.json())
      .then(setFavorites)
  }, [])

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-xl font-bold">관심 목록</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-500">찜한 공실이 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {favorites.map((f) => (
            <ListingCard key={f.id} listing={f.listing} />
          ))}
        </div>
      )}
    </main>
  )
}
