import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict'

const jieba = Jieba.withDict(dict)

export async function POST(req: Request) {
  const { texts } = await req.json()
  const results = (texts as string[]).map((text) => jieba.cut(text, true))
  return Response.json({ results })
}
