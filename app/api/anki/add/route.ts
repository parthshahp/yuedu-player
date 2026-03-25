const ANKI_URL = process.env.ANKI_CONNECT_URL ?? 'http://localhost:8765'

export async function POST(req: Request) {
  const { deckName, modelName, fields } = await req.json()

  const payload = {
    action: 'addNote',
    version: 6,
    params: {
      note: {
        deckName,
        modelName,
        fields,
        tags: ['vocab-miner'],
        options: { allowDuplicate: false },
      },
    },
  }

  const res = await fetch(ANKI_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (data.error) return Response.json({ error: data.error }, { status: 400 })
  return Response.json({ noteId: data.result })
}
