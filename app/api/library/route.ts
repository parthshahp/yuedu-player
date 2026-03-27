import { listLibrary, upsertLibraryEntry, removeLibraryEntry } from '@/lib/db'

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
  return Response.json({ ok: true })
}
