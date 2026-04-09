import { describe, expect, it } from "vitest"

import { detectAiPatterns, detectBannedWords, detectFillerPhrases } from "../src/index.js"

describe("patterns", () => {
  const text = `Additionally, this vibrant platform stands as a pivotal moment in the evolving landscape.\n\nIt is important to note that the team has the ability to leverage an innovative approach.`

  it("finds canonical AI patterns", () => {
    const result = detectAiPatterns(text)
    expect(result.counts.totalMatches).toBeGreaterThan(3)
    expect(result.counts.byPattern.ai_vocabulary).toBeGreaterThan(0)
    expect(result.counts.byPattern.significance_inflation).toBeGreaterThan(0)
  })

  it("finds banned words", () => {
    const result = detectBannedWords("An innovative team can leverage a game-changer.")
    expect(result.found).toContain("innovative")
    expect(result.found).toContain("leverage")
  })

  it("finds filler phrases", () => {
    const result = detectFillerPhrases("It is important to note that we act in order to win.")
    expect(result.length).toBe(2)
  })
})
