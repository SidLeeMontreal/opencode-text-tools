# opencode-text-tools

Reusable text analysis toolbox for OpenCode plugins.

## What it is

`opencode-text-tools` gives you two surfaces:

- **Plugin mode**: deterministic text-analysis tools exposed through OpenCode
- **Library mode**: typed TypeScript functions for metrics, pattern detection, and structure analysis

Deterministic tools do **not** call an LLM. LLM-backed helpers in `content.ts` are currently explicit stubs with TODO markers.

## Install

```bash
npm install opencode-text-tools
```

## Usage as an OpenCode plugin

Add it to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-text-tools"]
}
```

## Usage as a library

```ts
import { detectAiPatterns, wordCount } from "opencode-text-tools"

const metrics = wordCount(text)
const scan = detectAiPatterns(text)
```

## Tool reference

| Tool | Description |
| --- | --- |
| `text_word_count` | Count total and unique words |
| `text_char_count` | Count characters with and without spaces |
| `text_line_count` | Count total, blank, and non-empty lines |
| `text_sentence_count` | Count sentences and sentence lengths |
| `text_paragraph_count` | Count paragraphs and density |
| `text_reading_level` | Compute Flesch and Flesch-Kincaid scores |
| `text_sentence_length_variance` | Measure sentence-length variability |
| `text_vocabulary_richness` | Measure lexical variety |
| `detect_ai_patterns` | Scan the canonical 29 Corina AI-writing patterns |
| `detect_banned_words` | Find banned words and phrases |
| `detect_filler_phrases` | Find filler phrases |
| `detect_passive_voice` | Flag likely passive constructions |
| `detect_em_dashes` | Count em dashes and flag overuse |
| `detect_rule_of_three` | Find triadic rhetorical patterns |
| `detect_hedging` | Find hedge-heavy phrasing |
| `detect_promotional_language` | Flag promotional language |
| `detect_title_case_headings` | Find likely title-case headings |
| `detect_inline_header_lists` | Find inline-header bullet lists |
| `extract_headings` | Extract heading structure |
| `detect_format` | Infer article/social/slide/email/brief/other |
| `detect_lists` | Count list structures |
| `count_sentences_by_length` | Bucket sentences by length |
| `detect_repetition` | Find nearby repetition |

## Library function reference

### Metrics
- `wordCount()`
- `charCount()`
- `lineCount()`
- `sentenceCount()`
- `paragraphCount()`
- `readingLevel()`
- `sentenceLengthVariance()`
- `vocabularyRichness()`

### Pattern detection
- `detectAiPatterns()`
- `detectBannedWords()`
- `detectFillerPhrases()`
- `detectPassiveVoice()`
- `detectEmDashes()`
- `detectRuleOfThree()`
- `detectHedging()`
- `detectPromotionalLanguage()`
- `detectTitleCaseHeadings()`
- `detectInlineHeaderLists()`

### Structure analysis
- `extractHeadings()`
- `detectFormat()`
- `detectLists()`
- `countSentencesByLength()`
- `detectRepetition()`

### LLM-backed stubs
- `extractClaims()`
- `extractKeyPoints()`
- `assessTone()`
- `assessVoiceMatch()`
