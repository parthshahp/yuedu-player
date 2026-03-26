'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  loadAnkiSettings,
  saveAnkiSettings,
  FIELD_SOURCE_LABELS,
  type AnkiSettings,
  type FieldSource,
} from '@/lib/ankiSettings'

const SOURCES = Object.keys(FIELD_SOURCE_LABELS) as FieldSource[]

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const router = useRouter()
  const params = useSearchParams()
  const fromUrl = params.get('from')

  const [decks, setDecks] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [fields, setFields] = useState<string[]>([])
  const [settings, setSettings] = useState<AnkiSettings>({ deck: '', model: '', fieldMap: {} })
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'saved'>('loading')
  const [ankiError, setAnkiError] = useState<string | null>(null)

  function handleBack() {
    if (fromUrl) {
      router.push(fromUrl)
    } else {
      router.back()
    }
  }

  function loadFromAnki() {
    setStatus('loading')
    setAnkiError(null)
    const saved = loadAnkiSettings()

    Promise.all([
      fetch('/api/anki/decks').then((r) => r.json()),
      fetch('/api/anki/models').then((r) => r.json()),
    ])
      .then(([deckData, modelData]) => {
        if (deckData.error || modelData.error) {
          setAnkiError(deckData.error ?? modelData.error)
          setStatus('error')
          return
        }
        setDecks(deckData.decks)
        setModels(modelData.models)

        if (saved) {
          setSettings(saved)
        } else {
          setSettings((s) => ({
            ...s,
            deck: deckData.decks[0] ?? '',
            model: modelData.models[0] ?? '',
          }))
        }
        setStatus('idle')
      })
      .catch(() => {
        setAnkiError('Could not reach AnkiConnect. Is Anki open with the AnkiConnect add-on installed?')
        setStatus('error')
      })
  }

  // Load decks + models on mount, restore saved settings
  useEffect(() => {
    loadFromAnki()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch fields whenever model changes
  useEffect(() => {
    if (!settings.model) return
    fetch(`/api/anki/fields?model=${encodeURIComponent(settings.model)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return
        setFields(data.fields)
        // Preserve existing mappings; add empty entries for new fields
        setSettings((s) => {
          const newMap: Record<string, FieldSource> = {}
          for (const f of data.fields) {
            newMap[f] = s.fieldMap[f] ?? ''
          }
          return { ...s, fieldMap: newMap }
        })
      })
  }, [settings.model])

  function handleSave() {
    saveAnkiSettings(settings)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button onClick={handleBack} className="text-white/50 hover:text-white transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Anki Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-lg mx-auto w-full">
        {status === 'error' && (
          <div className="rounded-xl bg-red-950/60 border border-red-800 px-4 py-4 text-sm text-red-300 flex flex-col gap-3">
            <p>{ankiError}</p>
            <button
              onClick={loadFromAnki}
              className="self-start rounded-lg border border-red-700 px-3 py-1.5 text-red-300 hover:bg-red-900/40 transition-colors text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {status !== 'error' && (
          <>
            {/* Deck */}
            <section>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                Deck
              </label>
              <select
                value={settings.deck}
                onChange={(e) => setSettings((s) => ({ ...s, deck: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base appearance-none focus:outline-none focus:border-white/30"
              >
                {decks.map((d) => (
                  <option key={d} value={d} className="bg-neutral-900">
                    {d}
                  </option>
                ))}
              </select>
            </section>

            {/* Note type */}
            <section>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                Note Type
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base appearance-none focus:outline-none focus:border-white/30"
              >
                {models.map((m) => (
                  <option key={m} value={m} className="bg-neutral-900">
                    {m}
                  </option>
                ))}
              </select>
            </section>

            {/* Field mapping */}
            {fields.length > 0 && (
              <section>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                  Field Mapping
                </label>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    >
                      <span className="text-sm text-white/80 shrink-0">{field}</span>
                      <select
                        value={settings.fieldMap[field] ?? ''}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            fieldMap: { ...s.fieldMap, [field]: e.target.value as FieldSource },
                          }))
                        }
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white appearance-none focus:outline-none focus:border-white/30"
                      >
                        {SOURCES.map((src) => (
                          <option key={src} value={src} className="bg-neutral-900">
                            {FIELD_SOURCE_LABELS[src]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <button
              onClick={handleSave}
              disabled={!settings.deck || !settings.model}
              className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-base disabled:opacity-30 active:scale-95 transition-all"
            >
              {status === 'saved' ? 'Saved!' : 'Save'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
