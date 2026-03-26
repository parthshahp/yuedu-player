export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const videoId = searchParams.get('v')
  if (!videoId) return Response.json({ error: 'Missing video ID' }, { status: 400 })

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    if (!res.ok) return Response.json({ error: 'Not found' }, { status: 404 })
    const { title } = await res.json()
    return Response.json({ title })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
