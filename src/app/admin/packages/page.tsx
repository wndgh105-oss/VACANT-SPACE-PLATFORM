'use client'

import { useEffect, useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

type Package = { id: string; businessType: BusinessType; name: string; items: string[]; monthlyFee: number }

const ALL_BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [form, setForm] = useState({ businessType: 'CAFE' as BusinessType, name: '', itemsText: '', monthlyFee: 0 })
  const [error, setError] = useState<string | null>(null)

  function loadPackages() {
    fetch('/api/packages')
      .then((res) => res.json())
      .then(setPackages)
  }

  useEffect(loadPackages, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessType: form.businessType,
        name: form.name,
        items: form.itemsText.split(',').map((s) => s.trim()).filter(Boolean),
        monthlyFee: form.monthlyFee,
      }),
    })
    if (res.status === 409) {
      setError('이 업종에는 이미 패키지가 등록되어 있습니다.')
      return
    }
    if (!res.ok) {
      setError('패키지 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    setForm({ businessType: 'CAFE', name: '', itemsText: '', monthlyFee: 0 })
    loadPackages()
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('이 패키지를 사용 중인 공실이 있을 수 있습니다. 삭제할까요?')
    if (!confirmed) return
    await fetch(`/api/packages/${id}`, { method: 'DELETE' })
    loadPackages()
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">장비 패키지 마스터 관리</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2 rounded border p-3">
        <select
          className="w-full rounded border p-2"
          value={form.businessType}
          onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}
        >
          {ALL_BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {businessTypeLabel(t)}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border p-2"
          placeholder="패키지명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="포함 장비 (쉼표로 구분)"
          value={form.itemsText}
          onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
        />
        <input
          className="w-full rounded border p-2"
          type="number"
          placeholder="월 렌탈료"
          value={form.monthlyFee || ''}
          onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-black p-2 text-white" type="submit">
          등록
        </button>
      </form>

      <ul className="space-y-2">
        {packages.map((pkg) => (
          <li key={pkg.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                [{businessTypeLabel(pkg.businessType)}] {pkg.name}
              </p>
              <button className="text-sm text-red-600" onClick={() => handleDelete(pkg.id)}>
                삭제
              </button>
            </div>
            <p className="text-sm text-gray-600">{pkg.items.join(', ')}</p>
            <p className="text-sm">월 {pkg.monthlyFee.toLocaleString()}원</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
