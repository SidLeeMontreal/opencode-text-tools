import { describe, expect, it } from "vitest"

import {
  charCount,
  lineCount,
  paragraphCount,
  readingLevel,
  sentenceCount,
  sentenceLengthVariance,
  splitSentences,
  tokenizeWords,
  vocabularyRichness,
  wordCount,
} from "../src/index.js"

describe("metrics", () => {
  describe("tokenizeWords", () => {
    it("keeps apostrophes, curly apostrophes, hyphenated numbers, and unicode letters together", () => {
      expect(tokenizeWords("Don't stop l’été on-call 24/7 café"))
        .toEqual(["Don't", "stop", "l’été", "on-call", "24", "7", "café"])
    })

    it("returns an empty array for text with no words", () => {
      expect(tokenizeWords("   ... — — \n\t")).toEqual([])
    })
  })

  describe("splitSentences", () => {
    it("splits sentences on terminal punctuation followed by a capitalized sentence", () => {
      expect(splitSentences("One. Two? Three!"))
        .toEqual(["One.", "Two?", "Three!"])
    })

    it("treats text without sentence-ending punctuation as a single sentence", () => {
      expect(splitSentences("no punctuation here at all"))
        .toEqual(["no punctuation here at all"])
    })
  })

  describe("wordCount", () => {
    it("counts total words in a simple sentence", () => {
      expect(wordCount("One two three four.").total_words).toBe(4)
    })

    it("counts unique words correctly with case-insensitive deduplication by default", () => {
      const result = wordCount("Hello hello HELLO world")
      expect(result.total_words).toBe(4)
      expect(result.unique_words).toBe(2)
      expect(result.top_words[0]).toEqual({ word: "hello", count: 3 })
    })

    it("ignores words inside masked code blocks when ignore_code_blocks is true", () => {
      const text = "Keep this. ```const hiddenToken = leverageMagic()``` Keep that too."
      expect(wordCount(text, { ignore_code_blocks: true }).total_words).toBe(5)
      expect(wordCount(text, { ignore_code_blocks: true }).top_words.map((entry) => entry.word))
        .toEqual(["keep", "this", "that", "too"])
    })

    it("includes code words when code masking is disabled", () => {
      const text = "Keep this. `hiddenToken` stays visible."
      expect(wordCount(text, { ignore_code_blocks: false }).total_words).toBe(5)
    })

    it("handles an empty string as zero words", () => {
      expect(wordCount("")).toMatchObject({
        total_words: 0,
        unique_words: 0,
        unique_word_percentage: 0,
      })
    })

    it("handles a string with only whitespace as zero words", () => {
      expect(wordCount("   \n\t  ").total_words).toBe(0)
    })

    it("returns the correct unique word percentage", () => {
      expect(wordCount("alpha beta beta gamma").unique_word_percentage).toBe(75)
    })

    it("supports case-sensitive uniqueness when requested", () => {
      expect(wordCount("Echo echo", { case_sensitive_unique: true }).unique_words).toBe(2)
    })
  })

  describe("charCount", () => {
    it("counts total characters", () => {
      expect(charCount("abc de").total_chars).toBe(6)
    })

    it("counts characters without spaces", () => {
      expect(charCount("a b\n").chars_without_spaces).toBe(2)
    })

    it("counts whitespace characters", () => {
      expect(charCount("a b\n", { normalize_whitespace: false }).whitespace_chars).toBe(2)
    })

    it("handles an empty string", () => {
      expect(charCount("")).toMatchObject({
        total_chars: 0,
        chars_without_spaces: 0,
        whitespace_chars: 0,
      })
    })

    it("counts unicode characters as single characters", () => {
      expect(charCount("café 😊").total_chars).toBe(7)
    })
  })

  describe("lineCount", () => {
    it("counts total lines", () => {
      expect(lineCount("one\ntwo\nthree").total_lines).toBe(3)
    })

    it("counts non-empty lines", () => {
      expect(lineCount("one\n\nthree\n").non_empty_lines).toBe(2)
    })

    it("counts blank lines", () => {
      expect(lineCount("one\n\nthree").blank_lines).toBe(1)
    })

    it("treats a single-line string as one total line and zero blank lines", () => {
      expect(lineCount("single line")).toEqual({ total_lines: 1, non_empty_lines: 1, blank_lines: 0 })
    })

    it("counts multiple consecutive blank lines correctly", () => {
      expect(lineCount("one\n\n\nthree")).toEqual({ total_lines: 4, non_empty_lines: 2, blank_lines: 2 })
    })
  })

  describe("sentenceCount", () => {
    it("counts sentences in a paragraph", () => {
      expect(sentenceCount("One short sentence. Another short sentence.").sentence_count).toBe(2)
    })

    it("calculates the correct average words per sentence", () => {
      expect(sentenceCount("One two three. One two three four five.").avg_words_per_sentence).toBe(4)
    })

    it("returns the correct minimum and maximum sentence lengths", () => {
      const result = sentenceCount("One two. One two three four five.")
      expect(result.min_sentence_words).toBe(2)
      expect(result.max_sentence_words).toBe(5)
      expect(result.sentence_lengths).toEqual([2, 5])
    })

    it("handles a single sentence", () => {
      const result = sentenceCount("A single sentence stands here.")
      expect(result.sentence_count).toBe(1)
      expect(result.avg_words_per_sentence).toBe(5)
      expect(result.meta.cautions).toContain("Small sample for sentence metrics.")
    })

    it("handles text with no sentence-ending punctuation", () => {
      const result = sentenceCount("No punctuation but still words")
      expect(result.sentence_count).toBe(1)
      expect(result.min_sentence_words).toBe(5)
      expect(result.max_sentence_words).toBe(5)
    })
  })

  describe("paragraphCount", () => {
    it("counts paragraphs separated by blank lines", () => {
      const text = "First paragraph. Still first.\n\nSecond paragraph here.\n\nThird paragraph."
      const result = paragraphCount(text)
      expect(result.paragraph_count).toBe(3)
      expect(result.paragraph_sentence_counts).toEqual([2, 1, 1])
    })

    it("returns one for a single paragraph", () => {
      expect(paragraphCount("Only one paragraph lives here.").paragraph_count).toBe(1)
    })

    it("handles trailing newlines without inventing extra paragraphs", () => {
      expect(paragraphCount("One paragraph only.\n\n").paragraph_count).toBe(1)
    })
  })

  describe("readingLevel", () => {
    it("returns a flesch reading ease score in a sensible range for readable prose", () => {
      const score = readingLevel("The cat sat on the mat. The dog ran home.").flesch_reading_ease
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(120)
    })

    it("returns a flesch-kincaid grade number", () => {
      expect(readingLevel("The cat sat on the mat. The dog ran home.").flesch_kincaid_grade)
        .not.toBeNaN()
    })

    it("scores simple short sentences as easier than complex long sentences", () => {
      const simple = readingLevel("Cats purr. Dogs run. Birds sing.")
      const complex = readingLevel("Multidisciplinary coordination frameworks occasionally necessitate comprehensive reconsideration of organizational interoperability mechanisms.")
      expect(simple.flesch_reading_ease).toBeGreaterThan(complex.flesch_reading_ease)
      expect(simple.flesch_kincaid_grade).toBeLessThan(complex.flesch_kincaid_grade)
    })

    it("keeps word_count and sentence_count aligned with the helper functions", () => {
      const text = "Alpha beta gamma. Delta epsilon zeta."
      const result = readingLevel(text)
      expect(result.word_count).toBe(wordCount(text).total_words)
      expect(result.sentence_count).toBe(sentenceCount(text).sentence_count)
    })

    it("returns zeros when there are no readable words", () => {
      expect(readingLevel("   \n\t")).toMatchObject({
        flesch_reading_ease: 0,
        flesch_kincaid_grade: 0,
        word_count: 0,
        sentence_count: 0,
        syllable_count: 0,
      })
    })
  })

  describe("sentenceLengthVariance", () => {
    it("reports low variance when sentences are the same length", () => {
      const result = sentenceLengthVariance("One two three. Four five six.")
      expect(result.mean_sentence_length).toBe(3)
      expect(result.standard_deviation).toBe(0)
      expect(result.coefficient_of_variation).toBe(0)
    })

    it("reports higher variance for mixed sentence lengths", () => {
      const even = sentenceLengthVariance("One two three. Four five six.")
      const mixed = sentenceLengthVariance("Short. This sentence is much longer than the first one.")
      expect(mixed.standard_deviation).toBeGreaterThan(even.standard_deviation)
      expect(mixed.coefficient_of_variation).toBeGreaterThan(0)
    })

    it("returns zero variance for a single sentence", () => {
      const result = sentenceLengthVariance("Just one sentence exists here.")
      expect(result.sentence_count).toBe(1)
      expect(result.standard_deviation).toBe(0)
      expect(result.coefficient_of_variation).toBe(0)
    })
  })

  describe("vocabularyRichness", () => {
    it("returns a type-token ratio between zero and one", () => {
      const ratio = vocabularyRichness("alpha beta gamma alpha").type_token_ratio
      expect(ratio).toBeGreaterThanOrEqual(0)
      expect(ratio).toBeLessThanOrEqual(1)
    })

    it("returns a ratio of 1.0 when every word is unique", () => {
      const result = vocabularyRichness("alpha beta gamma delta")
      expect(result.type_token_ratio).toBe(1)
      expect(result.hapax_legomena).toBe(4)
    })

    it("returns a lower ratio for heavily repeated text", () => {
      const unique = vocabularyRichness("alpha beta gamma delta")
      const repeated = vocabularyRichness("alpha alpha alpha alpha delta")
      expect(repeated.type_token_ratio).toBeLessThan(unique.type_token_ratio)
      expect(repeated.unique_word_percentage).toBe(40)
    })

    it("adds a short-sample caution for tiny inputs", () => {
      expect(vocabularyRichness("alpha beta gamma").meta.cautions)
        .toContain("Short samples inflate lexical richness.")
    })

    it("supports case-sensitive richness when requested", () => {
      expect(vocabularyRichness("Echo echo", { case_sensitive: true }).unique_words).toBe(2)
    })
  })
})
