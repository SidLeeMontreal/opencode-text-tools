export type IgnoredRegionType = "code_block" | "inline_code" | "blockquote" | "url"

export interface PreprocessOptions {
  ignore_code_blocks?: boolean
  ignore_quotes?: boolean
  ignore_urls?: boolean
  normalize_whitespace?: boolean
  case_sensitive_unique?: boolean
  case_sensitive?: boolean
  patterns?: string[]
  include_context?: boolean
}

export interface MaskedRegion {
  type: IgnoredRegionType | string
  start: number
  end: number
}

export interface MaskedText {
  original: string
  analyzed: string
  maskedRegions: MaskedRegion[]
}

export interface AgentCapabilityOutput<T = unknown> {
  agent: string
  capability: string
  mode?: string
  version: string
  timestamp: string
  input_summary: string
  artifact: T
  rendered: string
  chained_to?: string
  chain_result?: unknown
  assumptions?: string[]
}

export interface ScanMeta {
  text_length: number
  analyzed_text_length: number
  ignored_regions: Array<{
    type: "code_block" | "blockquote" | "url"
    start: number
    end: number
  }>
  cautions?: string[]
}

export interface PatternMatch {
  id: string
  category: "content" | "language" | "style" | "communication" | "filler"
  severity: "high" | "medium" | "low"
  matchedText: string
  locationHint: string
  explanation: string
  fixSuggestion: string
}

export interface Layer1Scan {
  patternMatches: PatternMatch[]
  counts: {
    totalMatches: number
    byPattern: Record<string, number>
    byCategory: Record<string, number>
  }
  ambiguousPatterns: string[]
  signals?: string[]
  cautions?: string[]
  meta?: ScanMeta
}

export interface ReadabilityScore {
  fleschReadingEase: number
  fleschKincaidGrade: number
  syllableCount: number
}

export interface TextMetrics {
  wordCount: number
  charCount: number
  lineCount: number
  sentenceCount: number
  paragraphCount: number
  readability?: ReadabilityScore
}

export interface WordCountResult {
  total_words: number
  unique_words: number
  unique_word_percentage: number
  top_words: Array<{ word: string; count: number }>
  meta: ScanMeta
}

export interface CharCountResult {
  total_chars: number
  chars_without_spaces: number
  whitespace_chars: number
  meta: ScanMeta
}

export interface LineCountResult {
  total_lines: number
  non_empty_lines: number
  blank_lines: number
}

export interface SentenceCountResult {
  sentence_count: number
  avg_words_per_sentence: number
  min_sentence_words: number
  max_sentence_words: number
  sentence_lengths: number[]
  meta: ScanMeta
}

export interface ParagraphCountResult {
  paragraph_count: number
  avg_sentences_per_paragraph: number
  paragraph_sentence_counts: number[]
  meta: ScanMeta
}

export interface ReadabilityResult {
  flesch_reading_ease: number
  flesch_kincaid_grade: number
  word_count: number
  sentence_count: number
  syllable_count: number
  meta: ScanMeta
}

export interface VarianceResult {
  sentence_count: number
  mean_sentence_length: number
  standard_deviation: number
  coefficient_of_variation: number | null
  meta: ScanMeta
}

export interface VocabRichnessResult {
  total_words: number
  unique_words: number
  type_token_ratio: number
  unique_word_percentage: number
  hapax_legomena: number
  meta: ScanMeta
}

export interface HeadingsResult {
  headings: Array<{ level: number; text: string; line: number; start: number; end: number }>
}

export interface FormatDetectionResult {
  format: "article" | "social" | "slide" | "email" | "brief" | "other"
  confidence: number
  scores: Record<"article" | "social" | "slide" | "email" | "brief" | "other", number>
  signals: string[]
}

export interface ListDetectionResult {
  bullet_lists: number
  numbered_lists: number
  total_list_items: number
  inline_header_patterns: number
  lists: Array<{ type: "bullet" | "numbered"; startLine: number; itemCount: number }>
}

export interface SentenceLengthHistogram {
  short: number
  medium: number
  long: number
  histogram: Array<{ bucket: "short" | "medium" | "long"; count: number }>
  sentence_lengths: number[]
}

export interface RepetitionResult {
  repetitions: Array<{ term: string; count: number; sentence_indexes: number[]; distance: number }>
  meta: ScanMeta
}

export interface ClaimsResult {
  claims: Array<{ claim: string; type: string; verifiability: string }>
  meta: { model: string; todo: true }
}

export interface KeyPointsResult {
  key_points: Array<{ point: string; importance: number }>
  meta: { model: string; todo: true }
}

export interface ToneAssessmentResult {
  primary_tone: string
  secondary_tones: string[]
  confidence: number
  signals: string[]
  meta: { model: string; todo: true }
}

export interface VoiceMatchResult {
  score: number
  verdict: string
  strengths: string[]
  mismatches: string[]
  recommendations: string[]
  meta: { model: string; todo: true }
}

export interface AiPattern {
  id: string
  name: string
  category: "content" | "language" | "style" | "communication" | "filler"
  severity: "high" | "medium" | "low"
  keywords?: string[]
  regexes?: RegExp[]
  explanation: string
  fixSuggestion: string
}
