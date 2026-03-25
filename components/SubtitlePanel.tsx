'use client'

import type { SegmentedLine } from '@/lib/types'
import { WordToken } from './WordToken'

interface SubtitlePanelProps {
  line: SegmentedLine | null
  onWordTap: (word: string) => void
}

// Split a jieba word into { prefix, core, suffix } where prefix/suffix are
// leading/trailing punctuation and core is the interactive hanzi/alphanumeric part.
function splitWord(word: string): { prefix: string; core: string; suffix: string } {
  const match = word.match(/^([\p{P}\p{S}\p{Z}]*)([\s\S]*?)([\p{P}\p{S}\p{Z}]*)$/u)
  if (!match) return { prefix: '', core: word, suffix: '' }
  return { prefix: match[1], core: match[2], suffix: match[3] }
}

function hasContent(s: string): boolean {
  return /[\p{L}\p{N}]/u.test(s)
}

export function SubtitlePanel({ line, onWordTap }: SubtitlePanelProps) {
  return (
    <div className="flex-1 flex items-start justify-center px-6 pt-6 pb-4 min-h-24">
      {line && (
        <p
          key={line.segment.start}
          className="text-white text-4xl font-medium text-center leading-relaxed"
        >
          {line.words.map((word, j) => {
            const { prefix, core, suffix } = splitWord(word)
            if (!hasContent(core)) {
              return <span key={j}>{word}</span>
            }
            return <span key={j}>{prefix || null}<WordToken word={core} onTap={onWordTap} />{suffix || null}</span>
          })}
        </p>
      )}
    </div>
  )
}
