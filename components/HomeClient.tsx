'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LibraryEntry } from '@/lib/db'

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
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim()
  return null
}

export function HomeClient({ initialLibrary }: { initialLibrary: LibraryEntry[] }) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [library, setLibrary] = useState<LibraryEntry[]>(initialLibrary)
  const [navigating, setNavigating] = useState<string | null>(null)

  const videoId = extractVideoId(input)

  function openPlayer(id: string) {
    setNavigating(id)
    router.push('/player?v=' + id)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (videoId) openPlayer(videoId)
  }

  async function removeFromLibrary(id: string) {
    setLibrary((prev) => prev.filter((e) => e.videoId !== id))
    await fetch(`/api/library?v=${id}`, { method: 'DELETE' })
  }

  if (navigating) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-black px-4 py-12">
        <div className="w-full max-w-md animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-36 rounded-lg bg-white/10" />
            <div className="h-8 w-8 rounded-lg bg-white/10" />
          </div>
          <div className="flex flex-col gap-4 mb-10">
            <div className="h-12 rounded-lg bg-white/10" />
            <div className="h-12 rounded-lg bg-white/10" />
          </div>
          <div className="h-4 w-16 rounded bg-white/10 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[navigating, ...library.filter((e) => e.videoId !== navigating).map((e) => e.videoId)].slice(0, 4).map((id) => (
              <div key={id} className={`rounded-lg overflow-hidden border border-white/10 aspect-video ${id === navigating ? 'ring-1 ring-white/30' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                  alt={id}
                  className="w-full h-full object-cover opacity-40"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-white">Vocab Miner</h1>
          <a
            href="/settings"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </a>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-10">
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
              {library.map(({ videoId: id, title }) => (
                <div key={id} className="group relative">
                  <button
                    onClick={() => openPlayer(id)}
                    className="w-full rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                      alt={title ?? id}
                      className="w-full aspect-video object-cover"
                    />
                    {title && (
                      <div className="px-2 py-1.5 text-left text-xs text-white/70 truncate bg-black/60">
                        {title}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => removeFromLibrary(id)}
                    className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white/50 hover:text-white transition-colors"
                    aria-label="Delete video"
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
