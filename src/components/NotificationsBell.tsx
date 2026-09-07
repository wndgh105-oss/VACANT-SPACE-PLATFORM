'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type NotificationItem = {
  id: string
  title: string
  body: string
  href: string | null
  read: boolean
  createdAt: string
}

export function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const data = (await res.json()) as { items: NotificationItem[]; unreadCount: number }
    setItems(data.items)
    setUnreadCount(data.unreadCount)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.href) router.push(n.href)
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label="알림"
        className="vs-btn vs-btn-ghost relative !px-2.5 !py-2"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="vs-fade absolute right-0 top-full z-50 mt-2 w-80 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-3">
            <p className="text-[14px] font-bold">알림</p>
            {unreadCount > 0 && (
              <button type="button" className="text-[12px] text-[var(--brand)]" onClick={markAllRead}>
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-center text-[13px] text-[var(--ink-muted)]">아직 알림이 없어요.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`block w-full border-b border-[var(--line)] p-3 text-left last:border-b-0 hover:bg-[var(--surface-alt)] ${
                    n.read ? '' : 'bg-[var(--brand-soft)]'
                  }`}
                >
                  <p className="text-[13px] font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--ink-muted)]">{n.body}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
