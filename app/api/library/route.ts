import { existsSync, readdirSync, unlinkSync } from 'fs'
import path from 'path'
import { listLibrary, upsertLibraryEntry, removeLibraryEntry } from '@/lib/db'

const CACHE_DIR = process.env.AUDIO_CACHE_DIR ?? path.join(process.cwd(), 'data', 'audio-cache')

export async function GET() {
  return Response.json(listLibrary())
}

export async function POST(req: Request) {
  const { videoId, title } = await req.json() as { videoId: string; title?: string }
  upsertLibraryEntry(videoId, title)
  return Response.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const videoId = searchParams.get('v')
  if (!videoId) return Response.json({ error: 'Missing v' }, { status: 400 })
  removeLibraryEntry(videoId)
  if (existsSync(CACHE_DIR)) {
    const file = readdirSync(CACHE_DIR).find((f) => f.startsWith(`${videoId}.`))
    if (file) unlinkSync(path.join(CACHE_DIR, file))
  }
  return Response.json({ ok: true })
}
