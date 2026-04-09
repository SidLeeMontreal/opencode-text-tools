import { AI_PATTERN_MAP, AI_PATTERNS } from "./ai-patterns.js"
import { ALL_BANNED_WORDS } from "./banned-words.js"
import { splitSentences, tokenizeWords } from "./metrics.js"
import { applyMasks } from "./preprocess.js"
import type { Layer1Scan, PatternMatch, PreprocessOptions } from "./types.js"

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function lineOfOffset(text: string, offset: number): number {
  return text.slice(0, offset).split("\n").length
}

function locationHint(text: string, start: number): string {
  return `line ${lineOfOffset(text, start)}`
}

function createMatch(text: string, id: string, category: PatternMatch["category"], severity: PatternMatch["severity"], matchedText: string, start: number, explanation: string, fixSuggestion: string): PatternMatch {
  return { id, category, severity, matchedText, locationHint: locationHint(text, start), explanation, fixSuggestion }
}

function scanByKeywords(text: string, id: string, keywords: string[] | undefined, category: PatternMatch["category"], severity: PatternMatch["severity"], explanation: string, fixSuggestion: string): PatternMatch[] {
  if (!keywords?.length) return []
  const matches: PatternMatch[] = []
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "gi")
    for (const match of text.matchAll(regex)) {
      matches.push(createMatch(text, id, category, severity, match[0], match.index ?? 0, explanation, fixSuggestion))
    }
  }
  return matches
}

function scanByRegex(text: string, id: string, regexes: RegExp[] | undefined, category: PatternMatch["category"], severity: PatternMatch["severity"], explanation: string, fixSuggestion: string): PatternMatch[] {
  if (!regexes?.length) return []
  const matches: PatternMatch[] = []
  for (const regex of regexes) {
    const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`)
    for (const match of text.matchAll(re)) {
      matches.push(createMatch(text, id, category, severity, match[0], match.index ?? 0, explanation, fixSuggestion))
    }
  }
  return matches
}

export function detectBannedWords(text: string): { found: string[]; count: number; locations: string[] } {
  const found = ALL_BANNED_WORDS.filter((word) => new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(text))
  const locations = found.map((word) => {
    const index = text.toLowerCase().indexOf(word.toLowerCase())
    return `${word} (${locationHint(text, Math.max(0, index))})`
  })
  return { found, count: found.length, locations }
}

export function detectFillerPhrases(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.filler_phrases
  return scanByKeywords(text, pattern.id, pattern.keywords, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectPassiveVoice(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.passive_voice
  return scanByRegex(text, pattern.id, pattern.regexes, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectEmDashes(text: string): { count: number; overused: boolean; locations: string[] } {
  const locations = [...text.matchAll(/—/g)].map((match) => locationHint(text, match.index ?? 0))
  const paragraphs = text.split(/\n\s*\n/)
  const overused = paragraphs.some((paragraph) => ((paragraph.match(/—/g) ?? []).length > 2))
  return { count: locations.length, overused, locations }
}

export function detectRuleOfThree(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.rule_of_three
  return scanByRegex(text, pattern.id, pattern.regexes, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectHedging(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.excessive_hedging
  return scanByKeywords(text, pattern.id, pattern.keywords, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectPromotionalLanguage(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.promotional_language
  return scanByKeywords(text, pattern.id, pattern.keywords, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectTitleCaseHeadings(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.title_case_headings
  return scanByRegex(text, pattern.id, pattern.regexes, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectInlineHeaderLists(text: string): PatternMatch[] {
  const pattern = AI_PATTERN_MAP.inline_header_lists
  return scanByRegex(text, pattern.id, pattern.regexes, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion)
}

export function detectAiPatterns(text: string, options: PreprocessOptions = {}): Layer1Scan {
  const prepared = applyMasks(text, { ignore_code_blocks: true, ignore_urls: true, normalize_whitespace: true, ...options })
  const selectedIds = options.patterns?.length ? new Set(options.patterns) : null
  const patternMatches: PatternMatch[] = []
  const ambiguousPatterns = new Set<string>()
  const signals = new Set<string>()

  for (const pattern of AI_PATTERNS) {
    if (selectedIds && !selectedIds.has(pattern.id)) continue
    const matches = [
      ...scanByKeywords(prepared.analyzed, pattern.id, pattern.keywords, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion),
      ...scanByRegex(prepared.analyzed, pattern.id, pattern.regexes, pattern.category, pattern.severity, pattern.explanation, pattern.fixSuggestion),
    ]

    let filtered = matches
    if (pattern.id === "em_dash_overuse") {
      const dash = detectEmDashes(prepared.analyzed)
      filtered = dash.overused ? matches : []
    }
    if (pattern.id === "rule_of_three") {
      filtered = detectRuleOfThree(prepared.analyzed)
    }
    if (pattern.id === "title_case_headings") {
      filtered = detectTitleCaseHeadings(text)
    }
    if (pattern.id === "inline_header_lists") {
      filtered = detectInlineHeaderLists(text)
    }

    if (filtered.length > 0) {
      signals.add(pattern.id)
      if (["rule_of_three", "passive_voice", "title_case_headings", "hyphenated_word_pairs", "curly_quotes"].includes(pattern.id)) {
        ambiguousPatterns.add(pattern.id)
      }
      patternMatches.push(...filtered)
    }
  }

  const counts = {
    totalMatches: patternMatches.length,
    byPattern: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  }

  for (const match of patternMatches) {
    counts.byPattern[match.id] = (counts.byPattern[match.id] ?? 0) + 1
    counts.byCategory[match.category] = (counts.byCategory[match.category] ?? 0) + 1
  }

  const aiWords = tokenizeWords(prepared.analyzed).filter((word) => /^(additionally|crucial|delve|enhance|fostering|garner|interplay|intricate|landscape|meticulous|pivotal|showcase|tapestry|testament|underscore|valuable|vibrant)$/i.test(word))
  if (aiWords.length >= 3) signals.add("clustered_ai_vocabulary")
  if (splitSentences(prepared.analyzed).length < 3) signals.add("small_sample")

  return {
    patternMatches,
    counts,
    ambiguousPatterns: [...ambiguousPatterns],
    signals: [...signals],
    cautions: ["heuristic_only"],
    meta: {
      text_length: text.length,
      analyzed_text_length: prepared.analyzed.length,
      ignored_regions: prepared.maskedRegions
        .filter((region) => region.type === "code_block" || region.type === "blockquote" || region.type === "url")
        .map((region) => ({ type: region.type as "code_block" | "blockquote" | "url", start: region.start, end: region.end })),
      cautions: ["Pattern matches are signals, not proof of AI authorship."],
    },
  }
}
