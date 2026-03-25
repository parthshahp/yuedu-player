import { fetchTranscript, InMemoryCache } from 'youtube-transcript-plus'

// Chinese YT videos use varying lang codes — try them in priority order
const ZH_LANGS = ['zh-Hans', 'zh-CN', 'zh', 'zh-Hant', 'zh-TW']

const cache = new InMemoryCache(30 * 60 * 1000) // 30 minutes

export async function POST(req: Request) {
  const { videoId, lang } = await req.json()
  const langsToTry = lang ? [lang] : ZH_LANGS

  for (const l of langsToTry) {
    try {
      const raw = await fetchTranscript(videoId, { lang: l, cache })
      // Library returns `offset` — normalize to `start` to match TranscriptSegment
      const segments = raw.map((s: { text: string; offset: number; duration: number }) => ({
        text: s.text,
        start: s.offset,
        duration: s.duration,
      }))
      return Response.json({ segments, langUsed: l })
    } catch {}
  }
  return Response.json({ error: 'No Chinese subtitles found' }, { status: 404 })
}
