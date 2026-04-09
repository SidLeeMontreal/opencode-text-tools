import { describe, expect, it } from "vitest"

import {
  detectAiPatterns,
  detectBannedWords,
  detectEmDashes,
  detectFillerPhrases,
  detectHedging,
  detectInlineHeaderLists,
  detectPassiveVoice,
  detectPromotionalLanguage,
  detectRuleOfThree,
  detectTitleCaseHeadings,
} from "../src/index.js"

describe("patterns", () => {
  describe("detectBannedWords", () => {
    it("finds innovative in text containing it", () => {
      const result = detectBannedWords("An innovative approach helps.")
      expect(result.found).toContain("innovative")
    })

    it("finds leverage in text containing it", () => {
      const result = detectBannedWords("Teams leverage shared tools.")
      expect(result.found).toContain("leverage")
    })

    it("returns an empty array for clean text", () => {
      expect(detectBannedWords("The team shared a practical update.")).toEqual({
        found: [],
        count: 0,
        locations: [],
      })
    })

    it("matches banned words case-insensitively", () => {
      const result = detectBannedWords("We LEVERAGE calm execution.")
      expect(result.found).toContain("leverage")
      expect(result.locations[0]).toContain("line 1")
    })

    it("counts total banned-word occurrences, not just unique terms", () => {
      const result = detectBannedWords("Innovative teams leverage change. Another innovative plan helps us leverage timing.")
      expect(result.found).toEqual(["innovative", "leverage"])
      expect(result.count).toBe(4)
    })
  })

  describe("detectFillerPhrases", () => {
    it("detects in order to", () => {
      expect(detectFillerPhrases("We met in order to decide.")[0]?.matchedText.toLowerCase()).toBe("in order to")
    })

    it("detects it is important to note that", () => {
      expect(detectFillerPhrases("It is important to note that we already shipped.")[0]?.matchedText.toLowerCase())
        .toBe("it is important to note that")
    })

    it("detects due to the fact that", () => {
      expect(detectFillerPhrases("The launch slipped due to the fact that the vendor was late.")[0]?.matchedText.toLowerCase())
        .toBe("due to the fact that")
    })

    it("returns empty for clean text", () => {
      expect(detectFillerPhrases("We met to decide.")).toEqual([])
    })

    it("finds multiple filler phrases in the same text", () => {
      const matches = detectFillerPhrases("It is important to note that we met in order to decide due to the fact that time was short.")
      expect(matches.map((match) => match.matchedText.toLowerCase())).toEqual([
        "in order to",
        "due to the fact that",
        "it is important to note that",
      ])
    })
  })

  describe("detectPassiveVoice", () => {
    it("detects was built by", () => {
      const result = detectPassiveVoice("The bridge was built by volunteers.")
      expect(result[0]?.matchedText.toLowerCase()).toBe("was built")
    })

    it("detects is managed by", () => {
      const result = detectPassiveVoice("The program is managed by the operations team.")
      expect(result[0]?.matchedText.toLowerCase()).toBe("is managed")
    })

    it("does not flag simple active voice", () => {
      expect(detectPassiveVoice("The cat sat on the mat.")).toEqual([])
    })

    it("returns a location hint for each match", () => {
      const result = detectPassiveVoice("First line.\nThe system was designed by experts.")
      expect(result[0]?.locationHint).toBe("line 2")
    })
  })

  describe("detectEmDashes", () => {
    it("treats a single em dash as not overused", () => {
      expect(detectEmDashes("A calm line — with one break.")).toEqual({
        count: 1,
        overused: false,
        locations: ["line 1"],
      })
    })

    it("marks three or more em dashes in one paragraph as overused", () => {
      const result = detectEmDashes("One — two — three — four.")
      expect(result.count).toBe(3)
      expect(result.overused).toBe(true)
    })

    it("returns zero when no em dashes exist", () => {
      expect(detectEmDashes("Plain text only.")).toEqual({ count: 0, overused: false, locations: [] })
    })
  })

  describe("detectRuleOfThree", () => {
    it("detects a rhetorical list of three", () => {
      const result = detectRuleOfThree("We value innovation, inspiration, and insights.")
      expect(result).toHaveLength(1)
      expect(result[0]?.matchedText).toContain("innovation, inspiration, and insights")
    })

    it("does not detect a natural list of two", () => {
      expect(detectRuleOfThree("We value innovation and insights.")).toEqual([])
    })

    it("does not detect a natural list of four", () => {
      expect(detectRuleOfThree("We value innovation, inspiration, insight, and evidence.")).toEqual([])
    })

    it("marks an informational three-item list as ambiguous in the integration scan", () => {
      const scan = detectAiPatterns("The box contains screws, nails, and washers.")
      expect(scan.ambiguousPatterns).toContain("rule_of_three")
      expect(scan.counts.byPattern.rule_of_three).toBe(1)
    })
  })

  describe("detectHedging", () => {
    it("detects could potentially possibly", () => {
      const matches = detectHedging("This could potentially possibly work.")
      expect(matches.map((match) => match.matchedText.toLowerCase())).toEqual([
        "could potentially",
        "possibly",
      ])
    })

    it("detects might arguably be considered through the implemented hedging keywords", () => {
      const matches = detectHedging("It might arguably be considered acceptable because it appears to fit.")
      expect(matches.map((match) => match.matchedText.toLowerCase())).toEqual([
        "might",
        "appears to",
      ])
    })

    it("returns no false positives for a confident statement", () => {
      expect(detectHedging("This works and we shipped it yesterday.")).toEqual([])
    })
  })

  describe("detectPromotionalLanguage", () => {
    it("detects nestled in the heart of", () => {
      const result = detectPromotionalLanguage("The café is nestled in the heart of the old port.")
      expect(result[0]?.matchedText.toLowerCase()).toBe("nestled")
    })

    it("detects boasts a vibrant ecosystem", () => {
      const matches = detectPromotionalLanguage("The city boasts a vibrant ecosystem for startups.")
      expect(matches.map((match) => match.matchedText.toLowerCase())).toEqual(["boasts", "vibrant"])
    })

    it("does not flag a neutral factual sentence", () => {
      expect(detectPromotionalLanguage("The office is located on Saint-Laurent Boulevard.")).toEqual([])
    })
  })

  describe("detectTitleCaseHeadings", () => {
    it("detects title-case markdown headings", () => {
      const result = detectTitleCaseHeadings("## Strategic Negotiations And Global Partnerships")
      expect(result).toHaveLength(1)
      expect(result[0]?.matchedText).toBe("## Strategic Negotiations And Global Partnerships")
    })

    it("does not detect sentence-case headings", () => {
      expect(detectTitleCaseHeadings("## Strategic negotiations and global partnerships")).toEqual([])
    })

    it("detects mixed title case like A Guide to AI Writing", () => {
      const result = detectTitleCaseHeadings("## A Guide to AI Writing")
      expect(result).toHaveLength(1)
      expect(result[0]?.matchedText).toBe("## A Guide to AI Writing")
    })
  })

  describe("detectInlineHeaderLists", () => {
    it("detects bullets with inline bold headers", () => {
      const result = detectInlineHeaderLists("- **Performance:** The performance has improved")
      expect(result).toHaveLength(1)
      expect(result[0]?.matchedText).toBe("- **Performance:**")
    })

    it("does not flag a clean bullet item", () => {
      expect(detectInlineHeaderLists("- The performance improved significantly")).toEqual([])
    })
  })

  describe("detectAiPatterns", () => {
    it("finds at least eight AI-pattern matches in a dense synthetic sample", () => {
      const text = [
        "## Strategic Negotiations And Global Partnerships",
        "Additionally, this vibrant platform stands as a pivotal moment in the evolving landscape — a testament to progress — and a vibrant showcase of bold thinking — for the future.",
        "It is important to note that the team could potentially leverage an innovative framing in order to align with what matters most.",
        "- **Performance:** The system was managed by experts.",
        "We value innovation, inspiration, and insights.",
      ].join("\n")
      const result = detectAiPatterns(text)
      expect(result.counts.totalMatches).toBeGreaterThanOrEqual(8)
      expect(result.counts.byPattern.ai_vocabulary).toBeGreaterThanOrEqual(1)
      expect(result.counts.byPattern.significance_inflation).toBeGreaterThanOrEqual(1)
      expect(result.counts.byPattern.filler_phrases).toBeGreaterThanOrEqual(2)
      expect(result.ambiguousPatterns).toEqual(expect.arrayContaining([
        "rule_of_three",
        "passive_voice",
        "title_case_headings",
      ]))
    })

    it("returns zero or very low matches for clean human-written text", () => {
      const result = detectAiPatterns("I fixed the bug, wrote the test, and went home.")
      expect(result.counts.totalMatches).toBeLessThanOrEqual(1)
    })

    it("detects ai_vocabulary for Additionally without adding unrelated patterns", () => {
      const result = detectAiPatterns("Additionally.")
      expect(result.counts.byPattern.ai_vocabulary).toBe(1)
      expect(Object.keys(result.counts.byPattern)).toEqual(["ai_vocabulary"])
      expect(result.signals).toContain("small_sample")
    })

    it("categorizes significance inflation under content", () => {
      const result = detectAiPatterns("This stands as a pivotal moment in the evolving landscape.")
      expect(result.counts.byPattern.significance_inflation).toBe(3)
      expect(result.counts.byCategory.content).toBe(3)
    })

    it("populates ambiguousPatterns when applicable", () => {
      const result = detectAiPatterns("## A Guide to AI Writing\nThe bridge was built by volunteers.")
      expect(result.ambiguousPatterns).toEqual(expect.arrayContaining([
        "passive_voice",
        "title_case_headings",
      ]))
    })

    it("honors the selected pattern filter", () => {
      const result = detectAiPatterns("Additionally, this stands as a pivotal moment.", { patterns: ["ai_vocabulary"] })
      expect(result.counts.byPattern).toEqual({ ai_vocabulary: 2 })
      expect(result.patternMatches).toHaveLength(2)
    })
  })
})
