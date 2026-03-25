import { useMemo } from 'react'
import type { TranscriptSegment } from '@/lib/types'

// After a segment's stated end, keep showing it for this many extra seconds
// before blanking. Handles gaps between segments and short stated durations.
const TAIL_GAP = 3

export function useSubtitleSync(segments: TranscriptSegment[], currentTime: number): number {
  return useMemo(() => {
    if (segments.length === 0) return -1

    // Floor search: find the last segment whose start <= currentTime
    let lo = 0
    let hi = segments.length - 1
    let floor = -1

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      if (segments[mid].start <= currentTime) {
        floor = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    // Before the first subtitle
    if (floor === -1) return -1

    const seg = segments[floor]

    // Blank only if we're well past this segment's stated end (long silence / end of subs)
    if (currentTime > seg.start + seg.duration + TAIL_GAP) return -1

    return floor
  }, [segments, currentTime])
}
