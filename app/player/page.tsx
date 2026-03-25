'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useSubtitleSync } from '@/hooks/useSubtitleSync'
import { useDictionary } from '@/hooks/useDictionary'
import { SubtitlePanel } from '@/components/SubtitlePanel'
import { DefinitionSheet } from '@/components/DefinitionSheet'
import type { TranscriptSegment, SegmentedLine, DictEntry } from '@/lib/types'

export default function PlayerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlayerContent />
    </Suspense>
  )
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      Loading…
    </div>
  )
}

function PlayerContent() {
  const params = useSearchParams()
  const videoId = params.get('v')

  if (!videoId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        No video ID provided.
      </div>
    )
  }

  return <Player videoId={videoId} />
}

function Player({ videoId }: { videoId: string }) {
  const { containerRef, currentTime, isReady, isPlaying, play, pause, seekBy } = useYouTubePlayer(videoId)
  const { lookup } = useDictionary()
  const [segmentedLines, setSegmentedLines] = useState<SegmentedLine[]>([])
  const [transcriptState, setTranscriptState] = useState<'idle' | 'loading' | 'error'>('idle')

  // Definition sheet state
  const [currentEntry, setCurrentEntry] = useState<DictEntry | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const segments = segmentedLines.map((l) => l.segment)
  const activeIndex = useSubtitleSync(segments, currentTime)

  // Kick off audio prefetch in the background as soon as the player is ready
  useEffect(() => {
    if (!isReady) return
    fetch('/api/anki/prefetch-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    }).catch(() => { /* best-effort */ })
  }, [isReady, videoId])

  useEffect(() => {
    if (!isReady) return
    setTranscriptState('loading')
    fetch('/api/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Transcript fetch failed')
        return res.json() as Promise<{ segments: TranscriptSegment[] }>
      })
      .then(({ segments }) =>
        fetch('/api/segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, segments }),
        })
          .then((r) => r.json() as Promise<{ results: string[][] }>)
          .then(({ results }) =>
            segments.map((segment, i) => ({ segment, words: results[i] } satisfies SegmentedLine))
          )
      )
      .then((lines) => {
        setSegmentedLines(lines)
        setTranscriptState('idle')
      })
      .catch(() => setTranscriptState('error'))
  }, [isReady, videoId])

  const handleWordTap = useCallback((word: string) => {
    pause()
    const entries = lookup(word)
    setCurrentEntry(entries?.[0] ?? null)
    setSheetOpen(true)
  }, [lookup, pause])

  const activeSentence = activeIndex >= 0 ? (segmentedLines[activeIndex]?.segment.text ?? '') : ''
  const activeSegment = activeIndex >= 0 ? (segmentedLines[activeIndex]?.segment ?? null) : null

  function handlePlayPause() {
    if (isPlaying) pause(); else play()
  }

  // Save video to library on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vocab-miner:library')
      const library: { videoId: string; addedAt: number }[] = raw ? JSON.parse(raw) : []
      const filtered = library.filter((e) => e.videoId !== videoId)
      filtered.unshift({ videoId, addedAt: Date.now() })
      localStorage.setItem('vocab-miner:library', JSON.stringify(filtered.slice(0, 20)))
    } catch {}
  }, [videoId])

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="w-full aspect-video">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <MediaControls isPlaying={isPlaying} onPlayPause={handlePlayPause} onSeekBy={seekBy} videoId={videoId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {transcriptState === 'loading' && (
          <div className="p-4 text-white/50">Loading transcript…</div>
        )}
        {transcriptState === 'error' && (
          <div className="p-4 text-red-400">Failed to load transcript.</div>
        )}
        {transcriptState === 'idle' && segmentedLines.length > 0 && (
          <SubtitlePanel
            line={activeIndex >= 0 ? segmentedLines[activeIndex] ?? null : null}
            onWordTap={handleWordTap}
          />
        )}
        {transcriptState === 'idle' && segmentedLines.length === 0 && !isReady && (
          <div className="p-4 text-white/50">Loading player…</div>
        )}
      </div>
      <DefinitionSheet
        entry={currentEntry}
        sentence={activeSentence}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); play() }}
        videoId={videoId}
        segmentStart={activeSegment?.start}
        segmentDuration={activeSegment?.duration}
      />
    </div>
  )
}

function MediaControls({
  isPlaying,
  onPlayPause,
  onSeekBy,
  videoId,
}: {
  isPlaying: boolean
  onPlayPause: () => void
  onSeekBy: (delta: number) => void
  videoId: string
}) {
  return (
    <div className="relative flex items-center justify-center gap-2 bg-black/90 border-t border-white/10 py-3">
      <Link
        href="/"
        className="absolute left-3 flex items-center justify-center w-10 h-10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Home"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </Link>
      <Link
        href={`/settings?from=/player?v=${videoId}`}
        className="absolute right-3 flex items-center justify-center w-10 h-10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </Link>
      <button
        onClick={() => onSeekBy(-5)}
        className="relative flex items-center justify-center w-12 h-12 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
        aria-label="Rewind 5 seconds"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
        <span className="absolute text-[9px] font-bold" style={{ bottom: '9px', right: '6px' }}>5</span>
      </button>

      <button
        onClick={onPlayPause}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 transition-all"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      <button
        onClick={() => onSeekBy(5)}
        className="relative flex items-center justify-center w-12 h-12 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
        aria-label="Forward 5 seconds"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
        </svg>
        <span className="absolute text-[9px] font-bold" style={{ bottom: '9px', left: '6px' }}>5</span>
      </button>
    </div>
  )
}
