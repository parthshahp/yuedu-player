import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { SegmentedLine } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'transcripts.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    video_id   TEXT PRIMARY KEY,
    title      TEXT,
    added_at   INTEGER,
    transcript TEXT
  )
`)

// One-time migration from old transcripts table
try {
  db.exec(`
    INSERT OR IGNORE INTO videos (video_id, added_at, transcript)
    SELECT video_id, saved_at, lines FROM transcripts
  `)
} catch {}

type VideoRow = {
  video_id: string
  title: string | null
  added_at: number | null
  transcript: string | null
}

const upsertLibrary = db.prepare(`
  INSERT INTO videos (video_id, title, added_at)
  VALUES (@videoId, @title, @addedAt)
  ON CONFLICT(video_id) DO UPDATE SET
    title    = excluded.title,
    added_at = excluded.added_at
`)

const upsertTranscript = db.prepare(`
  INSERT INTO videos (video_id, transcript)
  VALUES (@videoId, @transcript)
  ON CONFLICT(video_id) DO UPDATE SET transcript = excluded.transcript
`)

const selectVideo = db.prepare<[string], VideoRow>('SELECT * FROM videos WHERE video_id = ?')

const selectLibrary = db.prepare<[], VideoRow>(
  'SELECT video_id, title, added_at FROM videos WHERE added_at IS NOT NULL ORDER BY added_at DESC'
)

const deleteVideo = db.prepare('DELETE FROM videos WHERE video_id = ?')

export type LibraryEntry = { videoId: string; title: string | null; addedAt: number }

export function upsertLibraryEntry(videoId: string, title: string | undefined) {
  upsertLibrary.run({ videoId, title: title ?? null, addedAt: Date.now() })
}

export function removeLibraryEntry(videoId: string) {
  deleteVideo.run(videoId)
}

export function listLibrary(): LibraryEntry[] {
  return selectLibrary.all().map((r) => ({
    videoId: r.video_id,
    title: r.title,
    addedAt: r.added_at!,
  }))
}

export function saveTranscript(videoId: string, lines: SegmentedLine[]) {
  upsertTranscript.run({ videoId, transcript: JSON.stringify(lines) })
}

export function loadTranscript(videoId: string): SegmentedLine[] | null {
  const row = selectVideo.get(videoId)
  return row?.transcript ? (JSON.parse(row.transcript) as SegmentedLine[]) : null
}
