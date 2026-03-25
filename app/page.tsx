'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input)
    const v = url.searchParams.get('v')
    if (v) return v
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1)
      if (/^[\w-]{11}$/.test(id)) return id
    }
  } catch {}
  // bare video ID: 11 alphanumeric/dash/underscore chars
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim()
  return null
}

type LibraryEntry = { videoId: string; addedAt: number }

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [library, setLibrary] = useState<LibraryEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vocab-miner:library')
      if (raw) setLibrary(JSON.parse(raw))
    } catch {}
  }, [])

  const videoId = extractVideoId(input)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (videoId) router.push('/player?v=' + videoId)
  }

  function removeFromLibrary(id: string) {
    const updated = library.filter((e) => e.videoId !== id)
    setLibrary(updated)
    localStorage.setItem('vocab-miner:library', JSON.stringify(updated))
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-4 py-12">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-10">
          <h1 className="text-2xl font-semibold text-white">Vocab Miner</h1>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="YouTube URL or video ID"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-white/40"
          />
          <button
            type="submit"
            disabled={!videoId}
            className="rounded-lg bg-white px-4 py-3 font-medium text-black transition-opacity disabled:opacity-30"
          >
            Open
          </button>
        </form>

        {library.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Recent</h2>
            <div className="grid grid-cols-2 gap-3">
              {library.map(({ videoId: id }) => (
                <div key={id} className="group relative">
                  <button
                    onClick={() => router.push('/player?v=' + id)}
                    className="w-full rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                      alt={id}
                      className="w-full aspect-video object-cover"
                    />
                  </button>
                  <button
                    onClick={() => removeFromLibrary(id)}
                    className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove from library"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
