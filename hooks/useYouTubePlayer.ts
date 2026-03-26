'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function useYouTubePlayer(videoId: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)
  const currentTimeRef = useRef(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // Interpolation state: last confirmed time from the IFrame API + the wall-clock
  // timestamp at which that reading was taken. Between polls we project forward
  // using elapsed wall time so subtitles stay in sync without hammering the API.
  const lastPolledTimeRef = useRef(0)
  const lastPollWallRef = useRef(0)
  const playbackRateRef = useRef(1)

  useEffect(() => {
    if (!videoId) return

    const positionKey = `vocab-miner:position:${videoId}`

    function createPlayer() {
      if (!containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          'ytp-pause-overlay': 0,
        },
        events: {
          onReady: () => {
            const saved = parseFloat(localStorage.getItem(positionKey) ?? '0')
            if (saved > 0) playerRef.current?.seekTo(saved, true)
            setIsReady(true)
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    }

    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!isReady) return

    const positionKey = `vocab-miner:position:${videoId}`

    // Slow poll (250ms) — only to anchor the interpolation clock and detect
    // play/pause state. We do NOT use the raw polled value directly for subtitles.
    const pollId = setInterval(() => {
      const t = playerRef.current?.getCurrentTime() ?? 0
      const state = playerRef.current?.getPlayerState()
      const rate = playerRef.current?.getPlaybackRate() ?? 1
      const playing = state === 1

      lastPolledTimeRef.current = t
      lastPollWallRef.current = performance.now()
      playbackRateRef.current = rate
      setIsPlaying(playing)

      if (t > 0) localStorage.setItem(positionKey, String(t))
    }, 250)

    // Fast rAF loop — interpolates between anchored readings so the subtitle
    // cursor advances every frame rather than every 250ms.
    let rafId: number
    const tick = () => {
      const playing = playerRef.current?.getPlayerState() === 1
      if (playing) {
        const elapsed = (performance.now() - lastPollWallRef.current) / 1000
        const estimated = lastPolledTimeRef.current + elapsed * playbackRateRef.current
        currentTimeRef.current = estimated
        setCurrentTime(estimated)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      clearInterval(pollId)
      cancelAnimationFrame(rafId)
    }
  }, [isReady])

  const play = () => playerRef.current?.playVideo()
  const pause = () => playerRef.current?.pauseVideo()
  const seekBy = (delta: number) => {
    const t = playerRef.current?.getCurrentTime() ?? 0
    playerRef.current?.seekTo(t + delta, true)
    // Re-anchor immediately after a seek so interpolation doesn't drift
    lastPolledTimeRef.current = t + delta
    lastPollWallRef.current = performance.now()
  }

  return { containerRef, currentTime, isReady, isPlaying, play, pause, seekBy }
}
