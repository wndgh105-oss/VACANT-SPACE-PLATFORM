import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_EXTENSIONS = /^(jpg|jpeg|png|gif|webp)$/i

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'no file' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const rawExt = file.name.split('.').pop() || 'jpg'
  const ext = ALLOWED_EXTENSIONS.test(rawExt) ? rawExt.toLowerCase() : 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
