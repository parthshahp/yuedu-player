import { fetchTranscript, InMemoryCache } from 'youtube-transcript-plus'
import { Converter } from 'opencc-js'

// Chinese YT videos use varying lang codes — simplified first, then traditional
const ZH_LANGS = ['zh', 'zh-Hans', 'zh-CN', 'zh-Hant', 'zh-TW']

const cache = new InMemoryCache(30 * 60 * 1000) // 30 minutes

// Traditional variants → Simplified (Mainland)
const toSimplified = Converter({ from: 'tw', to: 'cn' })

const TRADITIONAL_LANGS = new Set(['zh-Hant', 'zh-TW'])

export async function POST(req: Request) {
  const { videoId, lang } = await req.json()
  const langsToTry = lang ? [lang] : ZH_LANGS

  for (const l of langsToTry) {
    try {
      const raw = await fetchTranscript(videoId, { lang: l, cache })
      const needsConversion = TRADITIONAL_LANGS.has(l)
      // Library returns `offset` — normalize to `start` to match TranscriptSegment
      const segments = raw.map((s: { text: string; offset: number; duration: number }) => ({
        text: needsConversion ? toSimplified(s.text) : s.text,
        start: s.offset,
        duration: s.duration,
      }))
      return Response.json({ segments, langUsed: l })
    } catch {}
  }
  return Response.json({ error: 'No Chinese subtitles found' }, { status: 404 })
}
