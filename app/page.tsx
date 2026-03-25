'use client'

import { useState } from 'react'
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

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')

  const videoId = extractVideoId(input)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (videoId) router.push('/player?v=' + videoId)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
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
    </div>
  )
}
