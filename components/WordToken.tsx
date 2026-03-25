'use client'

interface WordTokenProps {
  word: string
  onTap: (word: string) => void
  isLoading?: boolean
}

export function WordToken({ word, onTap, isLoading }: WordTokenProps) {
  return (
    <span
      onClick={() => onTap(word)}
      className={
        isLoading
          ? 'cursor-wait rounded px-0.5 bg-white/20 text-white/60 animate-pulse'
          : 'cursor-pointer rounded px-0.5 hover:bg-white/10 active:bg-yellow-400/30'
      }
    >
      {word}
    </span>
  )
}
