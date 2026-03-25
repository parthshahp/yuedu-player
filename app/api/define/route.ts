import convertTone from 'pinyin-tone'
import type { SearchResultsArray } from 'cc-cedict'
import { getDict } from '@/lib/cedict'

export async function POST(req: Request) {
  const { word } = await req.json()
  const dict = getDict()
  const results = dict.getBySimplified(word, null, { asObject: false }) as SearchResultsArray | null

  if (!results?.length) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const entries = results.map((entry) => ({
    simplified: entry.simplified,
    traditional: entry.traditional,
    pinyin: convertTone(entry.pinyin),
    definitions: entry.english,
  }))

  return Response.json({ entries })
}
