import { describe, expect, it } from "vitest"

import { charCount, lineCount, readingLevel, wordCount } from "../src/index.js"

describe("metrics", () => {
  const text = "Hello world. Hello again."

  it("counts words and unique words", () => {
    const result = wordCount(text)
    expect(result.total_words).toBe(4)
    expect(result.unique_words).toBe(3)
  })

  it("counts characters", () => {
    const result = charCount("abc de")
    expect(result.total_chars).toBe(6)
    expect(result.chars_without_spaces).toBe(5)
  })

  it("counts lines", () => {
    const result = lineCount("one\n\nthree")
    expect(result.total_lines).toBe(3)
    expect(result.blank_lines).toBe(1)
  })

  it("returns readability metrics", () => {
    const result = readingLevel("This is a simple sentence. This is another one.")
    expect(result.word_count).toBeGreaterThan(0)
    expect(result.sentence_count).toBe(2)
    expect(typeof result.flesch_reading_ease).toBe("number")
  })
})
