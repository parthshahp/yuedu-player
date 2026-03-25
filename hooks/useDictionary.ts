import { useEffect, useState } from 'react'
import type { DictEntry } from '@/lib/types'

type DictMap = Map<string, DictEntry[]>

let cache: DictMap | null = null
let loadPromise: Promise<DictMap> | null = null

function loadDictionary(): Promise<DictMap> {
  if (cache) return Promise.resolve(cache)
  if (!loadPromise) {
    loadPromise = fetch('/cedict.json')
      .then((r) => r.json() as Promise<Record<string, DictEntry[]>>)
      .then((data) => {
        cache = new Map(Object.entries(data))
        return cache
      })
  }
  return loadPromise
}

export function useDictionary() {
  const [dict, setDict] = useState<DictMap | null>(cache)

  useEffect(() => {
    if (cache) {
      setDict(cache)
      return
    }
    loadDictionary().then(setDict)
  }, [])

  return {
    ready: dict !== null,
    lookup: (word: string): DictEntry[] | null => dict?.get(word) ?? null,
  }
}
