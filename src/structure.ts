import { splitSentences, tokenizeWords } from "./metrics.js"
import { applyMasks } from "./preprocess.js"
import type { FormatDetectionResult, HeadingsResult, ListDetectionResult, RepetitionResult, SentenceLengthHistogram } from "./types.js"

export function extractHeadings(text: string): HeadingsResult {
  const headings: HeadingsResult["headings"] = []
  const lines = text.split(/\r?\n/)
  let offset = 0
  lines.forEach((line, index) => {
    const markdown = line.match(/^(#{1,6})\s+(.*)$/)
    if (markdown) {
      headings.push({ level: markdown[1].length, text: markdown[2].trim(), line: index + 1, start: offset, end: offset + line.length })
    } else if (/^[A-Z][^.!?]{2,80}:$/.test(line.trim())) {
      headings.push({ level: 2, text: line.trim().slice(0, -1), line: index + 1, start: offset, end: offset + line.length })
    }
    offset += line.length + 1
  })
  return { headings }
}

export function detectFormat(text: string): FormatDetectionResult {
  const lines = text.split(/\r?\n/)
  const headings = extractHeadings(text).headings.length
  const paragraphs = text.split(/\n\s*\n/).filter((block) => block.trim().length > 0).length
  const bullets = lines.filter((line) => /^\s*[-*+]\s+/.test(line)).length
  const numbered = lines.filter((line) => /^\s*\d+[.)]\s+/.test(line)).length
  const hasGreeting = /^\s*(hi|hello|dear)\b/im.test(text)
  const hasSignoff = /\b(best|thanks|regards),?\s*$/im.test(text)
  const socialLength = text.length < 400 ? 0.4 : 0
  const scores = {
    article: Math.min(1, paragraphs * 0.18 + headings * 0.15 + (splitSentences(text).length > 4 ? 0.25 : 0)),
    social: Math.min(1, socialLength + ((text.match(/#/g) ?? []).length * 0.1) + ((text.match(/\n/g) ?? []).length < 4 ? 0.2 : 0)),
    slide: Math.min(1, bullets * 0.18 + numbered * 0.18 + (paragraphs <= 3 ? 0.25 : 0) + ((bullets + numbered) >= 3 ? 0.15 : 0)),
    email: Math.min(1, (hasGreeting ? 0.45 : 0) + (hasSignoff ? 0.35 : 0) + (text.includes("Subject:") ? 0.15 : 0)),
    brief: Math.min(1, headings * 0.14 + bullets * 0.1 + paragraphs * 0.1),
    other: 0.05,
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<[FormatDetectionResult["format"], number]>
  const [format, confidence] = sorted[0]
  const signals = [] as string[]
  if (headings) signals.push("heading structure")
  if (paragraphs > 1) signals.push("multiple paragraphs")
  if (bullets || numbered) signals.push("list structure")
  if (hasGreeting) signals.push("email greeting")
  return { format, confidence: Number(confidence.toFixed(2)), scores, signals }
}

export function detectLists(text: string): ListDetectionResult {
  const lines = text.split(/\r?\n/)
  const lists: ListDetectionResult["lists"] = []
  let bullet_lists = 0
  let numbered_lists = 0
  let total_list_items = 0
  let inline_header_patterns = 0

  let activeType: "bullet" | "numbered" | null = null
  let activeStart = 0
  let activeCount = 0

  const flush = () => {
    if (activeType && activeCount > 0) lists.push({ type: activeType, startLine: activeStart, itemCount: activeCount })
    activeType = null
    activeStart = 0
    activeCount = 0
  }

  lines.forEach((line, index) => {
    const isBullet = /^\s*[-*+]\s+/.test(line)
    const isNumbered = /^\s*\d+[.)]\s+/.test(line)
    if (isBullet || isNumbered) {
      total_list_items += 1
      if (/^\s*[-*+]\s+(?:\*\*[^*]+:\*\*|[^:]{1,80}:)/.test(line)) inline_header_patterns += 1
      const nextType = isBullet ? "bullet" : "numbered"
      if (activeType !== nextType) {
        flush()
        activeType = nextType
        activeStart = index + 1
      }
      activeCount += 1
      if (isBullet) bullet_lists = lists.filter((list) => list.type === "bullet").length + 1
      if (isNumbered) numbered_lists = lists.filter((list) => list.type === "numbered").length + 1
    } else {
      flush()
    }
  })
  flush()

  bullet_lists = lists.filter((list) => list.type === "bullet").length
  numbered_lists = lists.filter((list) => list.type === "numbered").length
  return { bullet_lists, numbered_lists, total_list_items, inline_header_patterns, lists }
}

export function countSentencesByLength(text: string): SentenceLengthHistogram {
  const prepared = applyMasks(text, { ignore_code_blocks: true, ignore_urls: true })
  const sentence_lengths = splitSentences(prepared.analyzed).map((sentence) => tokenizeWords(sentence).length)
  const short = sentence_lengths.filter((length) => length <= 10).length
  const medium = sentence_lengths.filter((length) => length > 10 && length <= 24).length
  const long = sentence_lengths.filter((length) => length > 24).length
  return { short, medium, long, histogram: [{ bucket: "short", count: short }, { bucket: "medium", count: medium }, { bucket: "long", count: long }], sentence_lengths }
}

const STOPWORDS = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "is", "it", "for", "on", "with", "that", "this"])

export function detectRepetition(text: string, windowSize = 2): RepetitionResult {
  const prepared = applyMasks(text, { ignore_code_blocks: true, ignore_urls: true })
  const sentences = splitSentences(prepared.analyzed)
  const termsBySentence = sentences.map((sentence) => tokenizeWords(sentence).map((word) => word.toLowerCase()).filter((word) => !STOPWORDS.has(word)))
  const repetitions: RepetitionResult["repetitions"] = []

  for (let i = 0; i < termsBySentence.length; i += 1) {
    const current = new Set(termsBySentence[i])
    for (let j = i + 1; j < Math.min(termsBySentence.length, i + windowSize + 1); j += 1) {
      for (const term of current) {
        if (termsBySentence[j].includes(term)) {
          const existing = repetitions.find((item) => item.term === term)
          if (existing) {
            existing.count += 1
            if (!existing.sentence_indexes.includes(j)) existing.sentence_indexes.push(j)
            existing.distance = Math.min(existing.distance, j - i)
          } else {
            repetitions.push({ term, count: 2, sentence_indexes: [i, j], distance: j - i })
          }
        }
      }
    }
  }

  return {
    repetitions,
    meta: {
      text_length: text.length,
      analyzed_text_length: prepared.analyzed.length,
      ignored_regions: prepared.maskedRegions
        .filter((region) => region.type === "code_block" || region.type === "blockquote" || region.type === "url")
        .map((region) => ({ type: region.type as "code_block" | "blockquote" | "url", start: region.start, end: region.end })),
    },
  }
}
