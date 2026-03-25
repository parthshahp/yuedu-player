export interface TranscriptSegment {
  text: string
  start: number      // seconds
  duration: number   // seconds
}

export interface DictEntry {
  simplified: string
  traditional: string
  pinyin: string       // diacritics, e.g. "nǐ hǎo"
  definitions: string[]
}

export interface SegmentedLine {
  segment: TranscriptSegment
  words: string[]    // output of jieba cut
}
