import { spawn } from 'child_process'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import path from 'path'

const CACHE_DIR = process.env.AUDIO_CACHE_DIR ?? path.join(process.cwd(), 'data', 'audio-cache')

// Tracks in-progress downloads for the lifetime of the server process
const downloading = new Set<string>()

function cachedFile(videoId: string): string | null {
  if (!existsSync(CACHE_DIR)) return null
  const file = readdirSync(CACHE_DIR).find((f) => f.startsWith(`${videoId}.`))
  return file ? path.join(CACHE_DIR, file) : null
}

export async function POST(req: Request) {
  const { videoId } = await req.json()

  mkdirSync(CACHE_DIR, { recursive: true })

  if (cachedFile(videoId)) return Response.json({ status: 'ready' })
  if (downloading.has(videoId)) return Response.json({ status: 'downloading' })

  downloading.add(videoId)

  const proc = spawn('yt-dlp', [
    '-x',
    '--audio-format', 'best',
    '--no-playlist',
    '-o', path.join(CACHE_DIR, `${videoId}.%(ext)s`),
    `https://www.youtube.com/watch?v=${videoId}`,
  ])

  proc.on('close', () => downloading.delete(videoId))

  return Response.json({ status: 'started' })
}
