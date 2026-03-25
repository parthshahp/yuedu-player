export type FieldSource = 'word' | 'pinyin' | 'definition' | 'expression' | 'audio' | ''

export interface AnkiSettings {
  deck: string
  model: string
  // maps each Anki field name → which value to fill it with
  fieldMap: Record<string, FieldSource>
}

const KEY = 'vocab-miner:anki-settings'

export function loadAnkiSettings(): AnkiSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AnkiSettings) : null
  } catch {
    return null
  }
}

export function saveAnkiSettings(settings: AnkiSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export const FIELD_SOURCE_LABELS: Record<FieldSource, string> = {
  word: 'Word',
  pinyin: 'Pinyin',
  definition: 'Definition',
  expression: 'Expression (subtitle)',
  audio: 'Audio clip',
  '': '— none —',
}

export function buildFields(
  fieldMap: Record<string, FieldSource>,
  values: { word: string; pinyin: string; definition: string; expression: string },
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [field, source] of Object.entries(fieldMap)) {
    if (!source || source === 'audio') continue
    result[field] = values[source]
  }
  return result
}

export function getAudioField(fieldMap: Record<string, FieldSource>): string | undefined {
  return Object.entries(fieldMap).find(([, src]) => src === 'audio')?.[0]
}
