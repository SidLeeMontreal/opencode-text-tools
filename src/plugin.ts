import { tool } from "@opencode-ai/plugin"
import type { Plugin } from "@opencode-ai/plugin"

import { charCount, lineCount, paragraphCount, readingLevel, sentenceCount, sentenceLengthVariance, vocabularyRichness, wordCount } from "./metrics.js"
import { detectAiPatterns, detectBannedWords, detectEmDashes, detectFillerPhrases, detectHedging, detectInlineHeaderLists, detectPassiveVoice, detectPromotionalLanguage, detectRuleOfThree, detectTitleCaseHeadings } from "./patterns.js"
import { countSentencesByLength, detectFormat, detectLists, detectRepetition, extractHeadings } from "./structure.js"

export const TextToolsPlugin: Plugin = async (_ctx) => {
  const json = (value: unknown) => JSON.stringify(value, null, 2)
  return {
    tool: {
      text_word_count: tool({
        description: "Count words in text (total and unique). Deterministic.",
        args: { text: tool.schema.string(), ignore_code_blocks: tool.schema.boolean().optional() },
        execute: async ({ text, ignore_code_blocks }) => json(wordCount(text, { ignore_code_blocks })),
      }),
      text_char_count: tool({
        description: "Count characters with and without spaces. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(charCount(text)),
      }),
      text_line_count: tool({
        description: "Count total, blank, and non-empty lines. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(lineCount(text)),
      }),
      text_sentence_count: tool({
        description: "Count sentences and sentence lengths. Deterministic heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(sentenceCount(text)),
      }),
      text_paragraph_count: tool({
        description: "Count paragraphs and sentence density. Deterministic heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(paragraphCount(text)),
      }),
      text_reading_level: tool({
        description: "Calculate Flesch Reading Ease and Flesch-Kincaid grade. Deterministic heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(readingLevel(text)),
      }),
      text_sentence_length_variance: tool({
        description: "Measure sentence length variance. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(sentenceLengthVariance(text)),
      }),
      text_vocabulary_richness: tool({
        description: "Measure lexical variety. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(vocabularyRichness(text)),
      }),
      detect_ai_patterns: tool({
        description: "Scan text for all 29 Corina AI writing patterns. Heuristic only; returns signals, not proof.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectAiPatterns(text)),
      }),
      detect_banned_words: tool({
        description: "Scan for banned words and phrases. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectBannedWords(text)),
      }),
      detect_filler_phrases: tool({
        description: "Find filler phrases. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectFillerPhrases(text)),
      }),
      detect_passive_voice: tool({
        description: "Flag possible passive voice. Heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectPassiveVoice(text)),
      }),
      detect_em_dashes: tool({
        description: "Count em dashes and flag likely overuse. Deterministic threshold heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectEmDashes(text)),
      }),
      detect_rule_of_three: tool({
        description: "Detect possible rule-of-three phrasing. Heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectRuleOfThree(text)),
      }),
      detect_hedging: tool({
        description: "Find hedge-heavy phrasing. Deterministic lexicon scan.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectHedging(text)),
      }),
      detect_promotional_language: tool({
        description: "Flag promotional language. Deterministic lexicon scan.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectPromotionalLanguage(text)),
      }),
      detect_title_case_headings: tool({
        description: "Find likely title-case headings. Heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectTitleCaseHeadings(text)),
      }),
      detect_inline_header_lists: tool({
        description: "Find inline-header list items like '- **Header:** value'. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectInlineHeaderLists(text)),
      }),
      extract_headings: tool({
        description: "Extract headings from markdown-like text. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(extractHeadings(text)),
      }),
      detect_format: tool({
        description: "Infer whether text looks like an article, social post, slide, email, brief, or other. Deterministic heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectFormat(text)),
      }),
      detect_lists: tool({
        description: "Count bullet and numbered lists. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectLists(text)),
      }),
      count_sentences_by_length: tool({
        description: "Bucket sentences into short, medium, and long groups. Deterministic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(countSentencesByLength(text)),
      }),
      detect_repetition: tool({
        description: "Find repeated words in close proximity. Deterministic heuristic.",
        args: { text: tool.schema.string() },
        execute: async ({ text }) => json(detectRepetition(text)),
      }),
    },
  }
}
