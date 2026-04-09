import { describe, expect, it } from "vitest"

import {
  TextToolsPlugin,
  charCount,
  countSentencesByLength,
  detectAiPatterns,
  detectBannedWords,
  detectEmDashes,
  detectFillerPhrases,
  detectFormat,
  detectHedging,
  detectInlineHeaderLists,
  detectLists,
  detectPassiveVoice,
  detectPromotionalLanguage,
  detectRepetition,
  detectRuleOfThree,
  detectTitleCaseHeadings,
  extractHeadings,
  lineCount,
  paragraphCount,
  readingLevel,
  sentenceCount,
  sentenceLengthVariance,
  vocabularyRichness,
  wordCount,
} from "../src/index.js"

describe("TextToolsPlugin", () => {
  it("exposes every documented tool name", async () => {
    const plugin = await TextToolsPlugin({} as never)
    expect(Object.keys(plugin.tool)).toEqual([
      "text_word_count",
      "text_char_count",
      "text_line_count",
      "text_sentence_count",
      "text_paragraph_count",
      "text_reading_level",
      "text_sentence_length_variance",
      "text_vocabulary_richness",
      "detect_ai_patterns",
      "detect_banned_words",
      "detect_filler_phrases",
      "detect_passive_voice",
      "detect_em_dashes",
      "detect_rule_of_three",
      "detect_hedging",
      "detect_promotional_language",
      "detect_title_case_headings",
      "detect_inline_header_lists",
      "extract_headings",
      "detect_format",
      "detect_lists",
      "count_sentences_by_length",
      "detect_repetition",
    ])
  })

  it("routes each tool to the corresponding implementation and returns JSON", async () => {
    const plugin = await TextToolsPlugin({} as never)
    const text = "## Strategic Negotiations And Global Partnerships\n\nAdditionally, the bridge was built by volunteers — carefully — and it is important to note that we value innovation, inspiration, and insights.\n\n- **Performance:** Stable"

    const cases: Array<[keyof typeof plugin.tool, Record<string, unknown>, unknown]> = [
      ["text_word_count", { text, ignore_code_blocks: true }, wordCount(text, { ignore_code_blocks: true })],
      ["text_char_count", { text }, charCount(text)],
      ["text_line_count", { text }, lineCount(text)],
      ["text_sentence_count", { text }, sentenceCount(text)],
      ["text_paragraph_count", { text }, paragraphCount(text)],
      ["text_reading_level", { text }, readingLevel(text)],
      ["text_sentence_length_variance", { text }, sentenceLengthVariance(text)],
      ["text_vocabulary_richness", { text }, vocabularyRichness(text)],
      ["detect_ai_patterns", { text }, detectAiPatterns(text)],
      ["detect_banned_words", { text }, detectBannedWords(text)],
      ["detect_filler_phrases", { text }, detectFillerPhrases(text)],
      ["detect_passive_voice", { text }, detectPassiveVoice(text)],
      ["detect_em_dashes", { text }, detectEmDashes(text)],
      ["detect_rule_of_three", { text }, detectRuleOfThree(text)],
      ["detect_hedging", { text }, detectHedging(text)],
      ["detect_promotional_language", { text }, detectPromotionalLanguage(text)],
      ["detect_title_case_headings", { text }, detectTitleCaseHeadings(text)],
      ["detect_inline_header_lists", { text }, detectInlineHeaderLists(text)],
      ["extract_headings", { text }, extractHeadings(text)],
      ["detect_format", { text }, detectFormat(text)],
      ["detect_lists", { text }, detectLists(text)],
      ["count_sentences_by_length", { text }, countSentencesByLength(text)],
      ["detect_repetition", { text }, detectRepetition(text)],
    ]

    for (const [toolName, args, expected] of cases) {
      const raw = await plugin.tool[toolName].execute(args as never)
      expect(JSON.parse(raw)).toEqual(expected)
    }
  })
})
