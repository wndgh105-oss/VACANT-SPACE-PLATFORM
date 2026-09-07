import { prisma } from '@/lib/prisma'

/** 사용자에게 화면 내 알림을 하나 남긴다. 이메일·SMS·카카오톡 발송은 하지 않는다 (MVP 범위 밖). */
export async function notify(userId: string, title: string, body: string, href?: string) {
  await prisma.notification.create({ data: { userId, title, body, href } })
}
