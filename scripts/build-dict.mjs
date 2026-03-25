import cedict from 'cc-cedict'
import convertTone from 'pinyin-tone'
import { writeFileSync } from 'fs'

const out = {}

for (const word of Object.keys(cedict.data.simplified)) {
  const results = cedict.getBySimplified(word, null, { asObject: false })
  if (!results?.length) continue
  out[word] = results.map((e) => ({
    simplified: e.simplified,
    traditional: e.traditional,
    pinyin: convertTone(e.pinyin),
    definitions: e.english,
  }))
}

writeFileSync('public/cedict.json', JSON.stringify(out))
console.log(`cedict: wrote ${Object.keys(out).length} entries → public/cedict.json`)
