import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { SegmentedLine } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'transcripts.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS transcripts (
    video_id TEXT PRIMARY KEY,
    saved_at INTEGER NOT NULL,
    lines     TEXT NOT NULL
  )
`)

const upsert = db.prepare(`
  INSERT INTO transcripts (video_id, saved_at, lines)
  VALUES (@videoId, @savedAt, @lines)
  ON CONFLICT(video_id) DO UPDATE SET saved_at = @savedAt, lines = @lines
`)

const select = db.prepare<[string], { video_id: string; saved_at: number; lines: string }>(
  'SELECT * FROM transcripts WHERE video_id = ?'
)

export function saveTranscript(videoId: string, lines: SegmentedLine[]) {
  upsert.run({ videoId, savedAt: Date.now(), lines: JSON.stringify(lines) })
}

export function loadTranscript(videoId: string): SegmentedLine[] | null {
  const row = select.get(videoId)
  return row ? (JSON.parse(row.lines) as SegmentedLine[]) : null
}
