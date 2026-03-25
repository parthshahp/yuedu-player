import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict'
import { saveTranscript } from '@/lib/db'
import type { TranscriptSegment } from '@/lib/types'

const jieba = Jieba.withDict(dict)

export async function POST(req: Request) {
  const { videoId, segments } = await req.json() as { videoId: string; segments: TranscriptSegment[] }
  const results = segments.map((s) => jieba.cut(s.text, true))
  const lines = segments.map((segment, i) => ({ segment, words: results[i] }))
  saveTranscript(videoId, lines)
  return Response.json({ results })
}
