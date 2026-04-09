import { describe, expect, it } from "vitest"

import { detectFormat, extractHeadings } from "../src/index.js"

describe("structure", () => {
  it("extracts markdown headings", () => {
    const result = extractHeadings("# Title\n\n## Section\nText")
    expect(result.headings).toHaveLength(2)
    expect(result.headings[1].text).toBe("Section")
  })

  it("detects email format", () => {
    const result = detectFormat("Hi team,\n\nQuick update on the launch.\n\nBest,\nJF")
    expect(result.format).toBe("email")
  })
})
