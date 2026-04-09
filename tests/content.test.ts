import { describe, expect, it } from "vitest"

import { assessTone, assessVoiceMatch, extractClaims, extractKeyPoints } from "../src/index.js"

describe("content placeholders", () => {
  it("returns an empty claims result with TODO metadata", async () => {
    await expect(extractClaims("Any text", null)).resolves.toEqual({
      claims: [],
      meta: { model: "TODO", todo: true },
    })
  })

  it("returns an empty key-points result with TODO metadata", async () => {
    await expect(extractKeyPoints("Any text", null)).resolves.toEqual({
      key_points: [],
      meta: { model: "TODO", todo: true },
    })
  })

  it("returns a placeholder tone assessment", async () => {
    await expect(assessTone("Any text", null)).resolves.toEqual({
      primary_tone: "unknown",
      secondary_tones: [],
      confidence: 0,
      signals: ["TODO: implement with OpenCode SDK session"],
      meta: { model: "TODO", todo: true },
    })
  })

  it("returns a placeholder voice-match assessment", async () => {
    await expect(assessVoiceMatch("Any text", "profile", null)).resolves.toEqual({
      score: 0,
      verdict: "todo",
      strengths: [],
      mismatches: [],
      recommendations: ["TODO: implement with OpenCode SDK session"],
      meta: { model: "TODO", todo: true },
    })
  })
})
