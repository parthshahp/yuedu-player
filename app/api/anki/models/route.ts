const ANKI_URL = process.env.ANKI_CONNECT_URL ?? 'http://localhost:8765'

export async function GET() {
  const res = await fetch(ANKI_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'modelNames', version: 6 }),
  })
  const data = await res.json()
  if (data.error) return Response.json({ error: data.error }, { status: 400 })
  return Response.json({ models: data.result })
}
