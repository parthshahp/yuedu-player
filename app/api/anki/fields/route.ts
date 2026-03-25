import type { NextRequest } from 'next/server'

const ANKI_URL = process.env.ANKI_CONNECT_URL ?? 'http://localhost:8765'

export async function GET(request: NextRequest) {
  const model = request.nextUrl.searchParams.get('model')
  if (!model) return Response.json({ error: 'model param required' }, { status: 400 })

  const res = await fetch(ANKI_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'modelFieldNames', version: 6, params: { modelName: model } }),
  })
  const data = await res.json()
  if (data.error) return Response.json({ error: data.error }, { status: 400 })
  return Response.json({ fields: data.result })
}
