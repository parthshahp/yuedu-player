'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import type { DictEntry } from '@/lib/types'
import { loadAnkiSettings, buildFields, getAudioField, getPictureField } from '@/lib/ankiSettings'

interface DefinitionSheetProps {
  entry: DictEntry | null
  sentence: string
  open: boolean
  onClose: () => void
  videoId?: string
  segmentStart?: number
  segmentDuration?: number
}

export function DefinitionSheet({ entry, sentence, open, onClose, videoId, segmentStart, segmentDuration }: DefinitionSheetProps) {
  const [addState, setAddState] = useState<'idle' | 'loading' | 'added' | 'error'>('idle')
  const [addError, setAddError] = useState<string | null>(null)

  function handleClose() {
    setAddState('idle')
    setAddError(null)
    onClose()
  }

  async function handleAddToAnki() {
    if (!entry) return
    const settings = loadAnkiSettings()
    if (!settings) return

    setAddState('loading')
    setAddError(null)

    const values = {
      word: entry.simplified,
      pinyin: entry.pinyin,
      definition: entry.definitions.join('; '),
      expression: sentence,
    }

    try {
      const res = await fetch('/api/anki/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckName: settings.deck,
          modelName: settings.model,
          fields: buildFields(settings.fieldMap, values),
          audioField: getAudioField(settings.fieldMap),
          pictureField: getPictureField(settings.fieldMap),
          videoId,
          segmentStart,
          segmentDuration,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAddError(data.error ?? 'Failed to add card')
        setAddState('error')
      } else {
        setAddState('added')
      }
    } catch {
      setAddError('Could not reach AnkiConnect')
      setAddState('error')
    }
  }

  const ankiConfigured = typeof window !== 'undefined' && loadAnkiSettings() !== null

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-neutral-900 outline-none max-h-[85vh]">
          <Drawer.Handle className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-white/20" />
          <div className="overflow-y-auto px-6 pb-10 pt-4">
            {entry ? (
              <>
                <Drawer.Title className="text-5xl font-bold text-white tracking-wide mb-1">
                  {entry.simplified}
                </Drawer.Title>
                <Drawer.Description className="sr-only">
                  {entry.pinyin} — {entry.definitions[0]}
                </Drawer.Description>
                {entry.simplified !== entry.traditional && (
                  <p className="text-2xl text-white/50 mb-1">{entry.traditional}</p>
                )}
                <p className="text-xl text-yellow-300 mb-4">{entry.pinyin}</p>
                <ol className="list-decimal list-inside space-y-1 mb-6">
                  {entry.definitions.map((def, i) => (
                    <li key={i} className="text-white/80 text-base">
                      {def}
                    </li>
                  ))}
                </ol>
                {sentence && (
                  <p className="text-sm text-white/40 italic border-t border-white/10 pt-4 mb-6">
                    {sentence}
                  </p>
                )}

                {/* Anki */}
                {ankiConfigured ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleAddToAnki}
                      disabled={addState === 'loading' || addState === 'added'}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-base active:scale-95 transition-all"
                    >
                      {addState === 'loading' && 'Adding…'}
                      {addState === 'added' && '✓ Added to Anki'}
                      {(addState === 'idle' || addState === 'error') && 'Add to Anki'}
                    </button>
                    {addState === 'error' && addError && (
                      <p className="text-sm text-red-400 text-center">{addError}</p>
                    )}
                  </div>
                ) : (
                  <a
                    href="/settings"
                    className="block w-full py-3 rounded-xl border border-white/10 text-white/40 text-sm text-center hover:text-white/70 transition-colors"
                  >
                    Configure Anki settings →
                  </a>
                )}
              </>
            ) : (
              <>
                <Drawer.Title className="sr-only">No definition</Drawer.Title>
                <Drawer.Description className="sr-only">No definition found.</Drawer.Description>
                <p className="text-white/40 text-base py-4">No definition found.</p>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
