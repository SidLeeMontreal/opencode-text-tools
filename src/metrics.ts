import { flesch } from "flesch"
import { fleschKincaid } from "flesch-kincaid"
import { syllable } from "syllable"

import { applyMasks } from "./preprocess.js"
import type {
  CharCountResult,
  LineCountResult,
  ParagraphCountResult,
  PreprocessOptions,
  ReadabilityResult,
  ScanMeta,
  SentenceCountResult,
  VarianceResult,
  VocabRichnessResult,
  WordCountResult,
} from "./types.js"

export function tokenizeWords(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function round(value: number): number {
  return Number(value.toFixed(2))
}

function toMeta(original: string, analyzed: string, maskedRegions: Array<{ type: string; start: number; end: number }>, cautions: string[] = []): ScanMeta {
  return {
    text_length: original.length,
    analyzed_text_length: analyzed.length,
    ignored_regions: maskedRegions
      .filter((region) => region.type === "code_block" || region.type === "blockquote" || region.type === "url")
      .map((region) => ({ type: region.type as "code_block" | "blockquote" | "url", start: region.start, end: region.end })),
    cautions: cautions.length ? cautions : undefined,
  }
}

function preparedText(text: string, options: PreprocessOptions = {}) {
  return applyMasks(text, options)
}

export function wordCount(text: string, options: PreprocessOptions = {}): WordCountResult {
  const prepared = preparedText(text, options)
  const words = tokenizeWords(prepared.analyzed)
  const normalized = options.case_sensitive_unique ? words : words.map((word) => word.toLowerCase())
  const freq = new Map<string, number>()
  for (const word of normalized) freq.set(word, (freq.get(word) ?? 0) + 1)
  const top_words = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }))
  return {
    total_words: words.length,
    unique_words: freq.size,
    unique_word_percentage: words.length ? round((freq.size / words.length) * 100) : 0,
    top_words,
    meta: toMeta(text, prepared.analyzed, prepared.maskedRegions),
  }
}

export function charCount(text: string, options: PreprocessOptions = {}): CharCountResult {
  const prepared = preparedText(text, options)
  const total = prepared.analyzed.length
  const whitespace = (prepared.analyzed.match(/\s/g) ?? []).length
  return {
    total_chars: total,
    chars_without_spaces: total - whitespace,
    whitespace_chars: whitespace,
    meta: toMeta(text, prepared.analyzed, prepared.maskedRegions),
  }
}

export function lineCount(text: string): LineCountResult {
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((line) => line.trim().length > 0).length
  return {
    total_lines: lines.length,
    non_empty_lines: nonEmpty,
    blank_lines: lines.length - nonEmpty,
  }
}

export function sentenceCount(text: string, options: PreprocessOptions = {}): SentenceCountResult {
  const prepared = preparedText(text, options)
  const sentences = splitSentences(prepared.analyzed)
  const sentence_lengths = sentences.map((sentence) => tokenizeWords(sentence).length)
  return {
    sentence_count: sentences.length,
    avg_words_per_sentence: sentence_lengths.length ? round(sentence_lengths.reduce((sum, n) => sum + n, 0) / sentence_lengths.length) : 0,
    min_sentence_words: sentence_lengths.length ? Math.min(...sentence_lengths) : 0,
    max_sentence_words: sentence_lengths.length ? Math.max(...sentence_lengths) : 0,
    sentence_lengths,
    meta: toMeta(text, prepared.analyzed, prepared.maskedRegions, sentences.length < 3 ? ["Small sample for sentence metrics."] : []),
  }
}

export function paragraphCount(text: string, options: PreprocessOptions = {}): ParagraphCountResult {
  const prepared = preparedText(text, options)
  const paragraphs = prepared.analyzed.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean)
  const paragraph_sentence_counts = paragraphs.map((paragraph) => splitSentences(paragraph).length || (tokenizeWords(paragraph).length ? 1 : 0))
  return {
    paragraph_count: paragraphs.length,
    avg_sentences_per_paragraph: paragraph_sentence_counts.length ? round(paragraph_sentence_counts.reduce((sum, n) => sum + n, 0) / paragraph_sentence_counts.length) : 0,
    paragraph_sentence_counts,
    meta: toMeta(text, prepared.analyzed, prepared.maskedRegions),
  }
}

export function readingLevel(text: string, options: PreprocessOptions = {}): ReadabilityResult {
  const prepared = preparedText(text, options)
  const words = tokenizeWords(prepared.analyzed)
  const sentences = splitSentences(prepared.analyzed)
  const syllable_count = words.reduce((sum, word) => sum + syllable(word), 0)
  return {
    flesch_reading_ease: words.length && sentences.length ? round(flesch({ sentence: sentences.length, word: words.length, syllable: syllable_count })) : 0,
    flesch_kincaid_grade: words.length && sentences.length ? round(fleschKincaid({ sentence: sentences.length, word: words.length, syllable: syllable_count })) : 0,
    word_count: words.length,
    sentence_count: sentences.length,
    syllable_count,
    meta: toMeta(text, prepared.analyzed, prepared.maskedRegions, ["Readability formulas are English-centric heuristics."]),
  }
}

export function sentenceLengthVariance(text: string, options: PreprocessOptions = {}): VarianceResult {
  const sentenceMetrics = sentenceCount(text, options)
  const lengths = sentenceMetrics.sentence_lengths
  const mean = lengths.length ? lengths.reduce((sum, n) => sum + n, 0) / lengths.length : 0
  const variance = lengths.length ? lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / lengths.length : 0
  const stdev = Math.sqrt(variance)
  return {
    sentence_count: lengths.length,
    mean_sentence_length: round(mean),
    standard_deviation: round(stdev),
    coefficient_of_variation: mean > 0 ? round(stdev / mean) : null,
    meta: sentenceMetrics.meta,
  }
}

export function vocabularyRichness(text: string, options: PreprocessOptions = {}): VocabRichnessResult {
  const prepared = preparedText(text, options)
  const words = tokenizeWords(prepared.analyzed)
  const normalized = options.case_sensitive ? words : words.map((word) => word.toLowerCase())
  const freq = new Map<string, number>()
  for (const word of normalized) freq.set(word, (freq.get(word) ?? 0) + 1)
  const hapax_legomena = [...freq.values()].filter((count) => count === 1).length
  return {
    total_words: words.length,
    unique_words: freq.size,
    type_token_ratio: words.length ? round(freq.size / words.length) : 0,
    unique_word_percentage: words.length ? round((freq.size / words.length) * 100) : 0,
    hapax_legomena,
    meta: toMeta(text, prepared.analyzed, prepared.maskedRegions, words.length < 50 ? ["Short samples inflate lexical richness."] : []),
  }
}
