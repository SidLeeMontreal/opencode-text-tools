import type { MaskedRegion, MaskedText, PreprocessOptions } from "./types.js"

function replaceRangeWithSpaces(text: string, start: number, end: number): string {
  return text.slice(0, start) + " ".repeat(Math.max(0, end - start)) + text.slice(end)
}

function buildMaskedText(original: string, analyzed: string, maskedRegions: MaskedRegion[]): MaskedText {
  return { original, analyzed, maskedRegions }
}

function applyRegexMask(text: string, regex: RegExp, type: MaskedRegion["type"]): MaskedText {
  let analyzed = text
  const maskedRegions: MaskedRegion[] = []
  const matches = [...text.matchAll(regex)]
  for (const match of matches.reverse()) {
    const start = match.index ?? 0
    const end = start + match[0].length
    analyzed = replaceRangeWithSpaces(analyzed, start, end)
    maskedRegions.push({ type, start, end })
  }
  return buildMaskedText(text, analyzed, maskedRegions.reverse())
}

export function maskCodeBlocks(text: string): MaskedText {
  const fenced = /```[\s\S]*?```/g
  const inline = /`[^`\n]+`/g
  let current = applyRegexMask(text, fenced, "code_block")
  const inlineMasked = applyRegexMask(current.analyzed, inline, "inline_code")
  return {
    original: text,
    analyzed: inlineMasked.analyzed,
    maskedRegions: [...current.maskedRegions, ...inlineMasked.maskedRegions],
  }
}

export function maskUrls(text: string): MaskedText {
  const bareUrls = /(https?:\/\/[^\s)]+|www\.[^\s)]+|\[[^\]]+\]\((https?:\/\/[^)]+)\))/g
  return applyRegexMask(text, bareUrls, "url")
}

export function maskBlockquotes(text: string): MaskedText {
  const blockquote = /(^|\n)\s*>[^\n]*(?=\n|$)/g
  return applyRegexMask(text, blockquote, "blockquote")
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[\t\f\v]+/g, " ").replace(/[ ]{2,}/g, " ").trim()
}

export function applyMasks(text: string, options: PreprocessOptions = {}): MaskedText {
  let analyzed = options.normalize_whitespace === false ? text : normalizeWhitespace(text)
  const maskedRegions: MaskedRegion[] = []

  if (options.ignore_code_blocks !== false) {
    const result = maskCodeBlocks(analyzed)
    analyzed = result.analyzed
    maskedRegions.push(...result.maskedRegions)
  }

  if (options.ignore_urls !== false) {
    const result = maskUrls(analyzed)
    analyzed = result.analyzed
    maskedRegions.push(...result.maskedRegions)
  }

  if (options.ignore_quotes) {
    const result = maskBlockquotes(analyzed)
    analyzed = result.analyzed
    maskedRegions.push(...result.maskedRegions)
  }

  return {
    original: text,
    analyzed,
    maskedRegions: maskedRegions.sort((a, b) => a.start - b.start),
  }
}
