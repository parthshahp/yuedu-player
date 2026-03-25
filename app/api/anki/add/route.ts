import { spawnSync } from 'child_process'
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import path from 'path'

const ANKI_URL = process.env.ANKI_CONNECT_URL ?? 'http://localhost:8765'
const CACHE_DIR = '/tmp/vocab-miner'

function findCachedAudio(videoId: string): string | null {
  if (!existsSync(CACHE_DIR)) return null
  try {
    const file = readdirSync(CACHE_DIR).find((f) => f.startsWith(`${videoId}.`))
    return file ? path.join(CACHE_DIR, file) : null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const { deckName, modelName, fields, audioField, videoId, segmentStart, segmentDuration } =
    await req.json()

  const note: Record<string, unknown> = {
    deckName,
    modelName,
    fields,
    tags: ['vocab-miner'],
    options: { allowDuplicate: false },
  }

  // Attach audio clip if settings and timing are available
  if (audioField && videoId && segmentStart !== undefined && segmentDuration !== undefined) {
    const cached = findCachedAudio(videoId)
    if (cached) {
      const ext = path.extname(cached).slice(1)
      const clipPath = path.join(CACHE_DIR, `clip_${videoId}_${segmentStart}.${ext}`)
      try {
        spawnSync('ffmpeg', [
          '-i', cached,
          '-ss', String(segmentStart),
          '-t', String(segmentDuration),
          '-c', 'copy',
          clipPath,
          '-y',
        ])
        if (existsSync(clipPath)) {
          const audioData = readFileSync(clipPath).toString('base64')
          unlinkSync(clipPath)
          note.audio = [{
            filename: `vocab-miner_${videoId}_${segmentStart}.${ext}`,
            data: audioData,
            fields: [audioField],
          }]
        }
      } catch {
        // Continue without audio — clip extraction is best-effort
      }
    }
  }

  const res = await fetch(ANKI_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addNote', version: 6, params: { note } }),
  })

  const data = await res.json()
  if (data.error) return Response.json({ error: data.error }, { status: 400 })
  return Response.json({ noteId: data.result })
}
