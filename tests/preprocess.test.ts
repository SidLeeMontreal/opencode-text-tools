import { describe, expect, it } from "vitest"

import {
  applyMasks,
  maskBlockquotes,
  maskCodeBlocks,
  maskUrls,
  normalizeWhitespace,
} from "../src/index.js"

describe("preprocess", () => {
  describe("maskCodeBlocks", () => {
    it("replaces fenced code blocks with same-length spaces", () => {
      const text = "Before\n```ts\nconst x = 1\n```\nAfter"
      const result = maskCodeBlocks(text)
      const maskedSlice = result.analyzed.slice(text.indexOf("```ts"), text.indexOf("```\nAfter") + 3)
      expect(maskedSlice).toBe(" ".repeat("```ts\nconst x = 1\n```".length))
      expect(result.maskedRegions).toEqual([
        { type: "code_block", start: 7, end: 28 },
      ])
    })

    it("preserves text after a code block", () => {
      const text = "Before\n```ts\nconst x = 1\n```\nAfter"
      expect(maskCodeBlocks(text).analyzed.endsWith("\nAfter")).toBe(true)
    })

    it("masks inline code", () => {
      const text = "Use `secretToken` carefully."
      const result = maskCodeBlocks(text)
      expect(result.analyzed).toBe("Use               carefully.")
      expect(result.maskedRegions).toEqual([
        { type: "inline_code", start: 4, end: 17 },
      ])
    })

    it("returns the original text when no code blocks exist", () => {
      const text = "Plain text only."
      expect(maskCodeBlocks(text)).toEqual({ original: text, analyzed: text, maskedRegions: [] })
    })
  })

  describe("maskUrls", () => {
    it("replaces a bare URL with spaces", () => {
      const text = "Visit https://example.com/docs now"
      const result = maskUrls(text)
      expect(result.analyzed).toBe("Visit                          now")
      expect(result.maskedRegions).toEqual([
        { type: "url", start: 6, end: 30 },
      ])
    })

    it("masks a markdown link URL while preserving link text characters outside the match", () => {
      const text = "Read [the docs](https://example.com/docs) today"
      const result = maskUrls(text)
      expect(result.analyzed).toBe("Read                                      today")
      expect(result.maskedRegions).toEqual([
        { type: "url", start: 5, end: 41 },
      ])
    })

    it("returns the original text when no URLs exist", () => {
      const text = "No links here."
      expect(maskUrls(text)).toEqual({ original: text, analyzed: text, maskedRegions: [] })
    })
  })

  describe("maskBlockquotes", () => {
    it("masks a quoted line", () => {
      const text = "> quoted line\nPlain"
      const result = maskBlockquotes(text)
      expect(result.analyzed).toBe("             \nPlain")
      expect(result.maskedRegions).toEqual([
        { type: "blockquote", start: 0, end: 13 },
      ])
    })

    it("preserves non-quoted text", () => {
      const text = "> quoted line\nPlain"
      expect(maskBlockquotes(text).analyzed.endsWith("\nPlain")).toBe(true)
    })

    it("masks multiple blockquote lines", () => {
      const text = "> one\n> two\nPlain"
      const result = maskBlockquotes(text)
      expect(result.maskedRegions).toEqual([
        { type: "blockquote", start: 0, end: 5 },
        { type: "blockquote", start: 5, end: 11 },
      ])
      expect(result.analyzed).toBe("           \nPlain")
    })
  })

  describe("normalizeWhitespace", () => {
    it("collapses multiple spaces to a single space", () => {
      expect(normalizeWhitespace("one   two")).toBe("one two")
    })

    it("replaces tabs with a single space", () => {
      expect(normalizeWhitespace("one\ttwo\tthree")).toBe("one two three")
    })

    it("preserves newlines while normalizing line endings", () => {
      expect(normalizeWhitespace("one\r\n\r\ntwo")).toBe("one\n\ntwo")
    })
  })

  describe("applyMasks", () => {
    it("masks code blocks when ignore_code_blocks is true", () => {
      const result = applyMasks("Start `secret` end", { ignore_code_blocks: true, ignore_urls: false, normalize_whitespace: false })
      expect(result.analyzed).toBe("Start          end")
      expect(result.maskedRegions).toEqual([
        { type: "inline_code", start: 6, end: 14 },
      ])
    })

    it("masks URLs when ignore_urls is true", () => {
      const result = applyMasks("See https://example.com", { ignore_code_blocks: false, ignore_urls: true, normalize_whitespace: false })
      expect(result.analyzed).toBe("See                    ")
      expect(result.maskedRegions).toEqual([
        { type: "url", start: 4, end: 23 },
      ])
    })

    it("combines code, URL, and blockquote masks", () => {
      const text = "> quote\nLook at https://example.com and `secret`"
      const result = applyMasks(text, { ignore_quotes: true, ignore_urls: true, ignore_code_blocks: true, normalize_whitespace: false })
      expect(result.maskedRegions.map((region) => region.type)).toEqual(["blockquote", "url", "inline_code"])
      expect(result.analyzed.length).toBe(text.length)
      expect(result.analyzed.endsWith("and         ")).toBe(true)
    })

    it("keeps analyzed text length the same as the original text length", () => {
      const text = "Line 1\n```js\nconst x = 1\n```\nVisit https://example.com"
      const result = applyMasks(text, { ignore_code_blocks: true, ignore_urls: true, normalize_whitespace: false })
      expect(result.analyzed.length).toBe(text.length)
    })

    it("normalizes whitespace by default before masking", () => {
      const result = applyMasks("one\t\t two")
      expect(result.analyzed).toBe("one two")
    })
  })
})
