import { describe, expect, it } from "vitest"

import {
  countSentencesByLength,
  detectFormat,
  detectLists,
  detectRepetition,
  extractHeadings,
} from "../src/index.js"

describe("structure", () => {
  describe("extractHeadings", () => {
    it("extracts h1, h2, and h3 headings with the correct text and levels", () => {
      const text = [
        "# Title",
        "Intro paragraph.",
        "## Section Name",
        "### Subsection",
      ].join("\n")
      const result = extractHeadings(text)
      expect(result.headings).toEqual([
        { level: 1, text: "Title", line: 1, start: 0, end: 7 },
        { level: 2, text: "Section Name", line: 3, start: 25, end: 40 },
        { level: 3, text: "Subsection", line: 4, start: 41, end: 55 },
      ])
    })

    it("returns an empty array for empty text", () => {
      expect(extractHeadings("").headings).toEqual([])
    })

    it("returns an empty array when no headings exist", () => {
      expect(extractHeadings("Just a paragraph.\nAnother line.").headings).toEqual([])
    })

    it("also detects colon-style fragment headings", () => {
      expect(extractHeadings("Overview:\nBody text.").headings).toEqual([
        { level: 2, text: "Overview", line: 1, start: 0, end: 9 },
      ])
    })
  })

  describe("detectFormat", () => {
    it("detects email format from greeting and signoff signals", () => {
      const result = detectFormat("Hi Corina,\n\nQuick note on the launch.\n\nBest,\nJF")
      expect(result.format).toBe("email")
      expect(result.signals).toContain("email greeting")
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it("detects social format from hashtags and short length", () => {
      const result = detectFormat("Shipping today.\n#buildinpublic #design")
      expect(result.format).toBe("social")
      expect(result.scores.social).toBeGreaterThan(result.scores.article)
    })

    it("detects article format from title, headings, and long paragraphs", () => {
      const text = [
        "# A Useful Essay",
        "",
        "This is a long opening paragraph with several complete sentences. It explains the situation clearly. It adds enough detail to feel like prose rather than notes.",
        "",
        "## Background",
        "Another paragraph follows with more explanation. It continues the argument in full sentences. It offers context instead of bullets.",
      ].join("\n")
      const result = detectFormat(text)
      expect(result.format).toBe("article")
      expect(result.signals).toEqual(expect.arrayContaining(["heading structure", "multiple paragraphs"]))
    })

    it("detects slide format from bullet-heavy headline fragments", () => {
      const text = [
        "Q2 Plan",
        "- Revenue growth",
        "- Market expansion",
        "- Hiring plan",
      ].join("\n")
      const result = detectFormat(text)
      expect(result.format).toBe("slide")
      expect(result.signals).toContain("list structure")
    })

    it("detects brief format from a dense memo with summary and bullets", () => {
      const text = [
        "Summary:",
        "The team reviewed cost, risk, and timing across the release.",
        "",
        "Key Points:",
        "- Budget is stable",
        "- Timeline moved by one week",
        "- Mitigation plan attached",
        "",
        "Recommendation:",
        "Proceed with the revised launch window.",
      ].join("\n")
      const result = detectFormat(text)
      expect(result.format).toBe("brief")
      expect(result.scores.brief).toBeGreaterThanOrEqual(result.scores.slide)
    })

    it("treats ambiguous text as other or low-confidence best guess", () => {
      const result = detectFormat("Just a plain sentence without much structure.")
      expect(["other", "social", "slide", "article", "brief", "email"]).toContain(result.format)
      expect(result.confidence).toBeLessThan(0.8)
    })
  })

  describe("detectLists", () => {
    it("counts two bullet lists and one numbered list", () => {
      const text = [
        "- one",
        "- two",
        "",
        "1. alpha",
        "2. beta",
        "",
        "* three",
        "* four",
      ].join("\n")
      const result = detectLists(text)
      expect(result.bullet_lists).toBe(2)
      expect(result.numbered_lists).toBe(1)
      expect(result.total_list_items).toBe(6)
      expect(result.lists).toEqual([
        { type: "bullet", startLine: 1, itemCount: 2 },
        { type: "numbered", startLine: 4, itemCount: 2 },
        { type: "bullet", startLine: 7, itemCount: 2 },
      ])
    })

    it("counts inline-header patterns inside lists", () => {
      const result = detectLists("- **Performance:** Improved\n- Result: Stable")
      expect(result.inline_header_patterns).toBe(2)
    })

    it("returns no detected lists for clean paragraph text", () => {
      expect(detectLists("A normal paragraph with no list structure.")).toEqual({
        bullet_lists: 0,
        numbered_lists: 0,
        total_list_items: 0,
        inline_header_patterns: 0,
        lists: [],
      })
    })
  })

  describe("countSentencesByLength", () => {
    it("bins short, medium, and long sentences into the right histogram buckets", () => {
      const text = [
        "One two three.",
        "This sentence has exactly eleven distinct words for the medium bucket today.",
        "This final sentence contains far more than twenty four words because it keeps adding concrete terms until the total length crosses the threshold comfortably for the long bucket.",
      ].join(" ")
      const result = countSentencesByLength(text)
      expect(result.short).toBe(1)
      expect(result.medium).toBe(1)
      expect(result.long).toBe(1)
      expect(result.histogram).toEqual([
        { bucket: "short", count: 1 },
        { bucket: "medium", count: 1 },
        { bucket: "long", count: 1 },
      ])
    })

    it("categorizes a single short sentence correctly", () => {
      const result = countSentencesByLength("Tiny sentence here.")
      expect(result).toMatchObject({ short: 1, medium: 0, long: 0, sentence_lengths: [3] })
    })

    it("ignores URLs and code blocks while counting sentence lengths", () => {
      const result = countSentencesByLength("Visit https://example.com now. `internal_value hidden` Done.")
      expect(result.sentence_lengths).toEqual([2, 1])
    })
  })

  describe("detectRepetition", () => {
    it("flags repeated content words across nearby sentences", () => {
      const result = detectRepetition("The cat sat. The cat slept. The cat walked.")
      const cat = result.repetitions.find((item) => item.term === "cat")
      expect(cat).toEqual({ term: "cat", count: 4, sentence_indexes: [0, 1, 2], distance: 1 })
    })

    it("returns an empty result when no phrases repeat", () => {
      expect(detectRepetition("Birds fly. Fish swim. Clouds drift.").repetitions).toEqual([])
    })

    it("uses window size to control detection distance", () => {
      const text = "Alpha repeats. Beta differs. Alpha returns."
      expect(detectRepetition(text, 1).repetitions.find((item) => item.term === "alpha")).toBeUndefined()
      expect(detectRepetition(text, 2).repetitions.find((item) => item.term === "alpha"))
        .toEqual({ term: "alpha", count: 2, sentence_indexes: [0, 2], distance: 2 })
    })
  })
})
